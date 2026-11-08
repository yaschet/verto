/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getServerUserId } from '@/helpers/user';
import UserActivityChartClient from '@app/(protected)/admin/dashboard/components/statistics/user-activity/user-activity-chart-client';
import { getDateRange } from '@library/time';
import { userActivityQueryOptions } from '@queries/tanstack/admin/statistics-query-options';
import { getQueryClient } from '@queries/tanstack/query-client';

export default async function UserActivityChartRsc() {
    const queryClient = getQueryClient();
    const userId = await getServerUserId();

    // Define the default filter:
    const defaultFilter = 'last_6_months';

    // Get the current date:
    const now = new Date();

    // Compute the startDate and endDate based on the default filter:
    const { endDate, startDate } = getDateRange(defaultFilter, now);

    await queryClient.prefetchQuery(
        userActivityQueryOptions(userId, {
            startDate,
            endDate,
        }),
    );

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <UserActivityChartClient />
        </HydrationBoundary>
    );
}
