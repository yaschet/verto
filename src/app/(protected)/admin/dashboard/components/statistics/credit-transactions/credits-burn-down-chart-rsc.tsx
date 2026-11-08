/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getServerUserId } from '@/helpers/user';
import { getQueryClient } from '@/src/queries/tanstack/query-client';
import CreditsBurnDownChartClient from '@app/(protected)/admin/dashboard/components/statistics/credit-transactions/credits-burn-down-chart-client';
import { getDateRange } from '@library/time';
import { creditsBurnDownAnalyticsQueryOptions } from '@queries/tanstack/admin/statistics-query-options';

export default async function CreditsBurnDownChartRsc() {
    const queryClient = getQueryClient();
    const userId = await getServerUserId();

    // Initialize `selectedFilter` to a valid option:
    const selectedFilter = 'last_6_months';

    // Compute the startDate and endDate based on the selected filter
    const now = new Date();
    const { endDate, startDate } = getDateRange(selectedFilter, now);

    await queryClient.prefetchQuery(
        creditsBurnDownAnalyticsQueryOptions(userId, {
            startDate,
            endDate,
        }),
    );

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <CreditsBurnDownChartClient />
        </HydrationBoundary>
    );
}
