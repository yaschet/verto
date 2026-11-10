/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getServerUserId } from '@/helpers/user';
import { AverageTranslationDurationChartClient } from '@app/(protected)/admin/dashboard/components/metrics/average-translation-duration/average-translation-duration-chart-client';
import { getDateRange } from '@library/time';
import { averageTranslationDurationQueryOptions } from '@queries/tanstack/admin/metrics-query-options';
import { getQueryClient } from '@queries/tanstack/query-client';

export default async function AverageTranslationDurationChartRsc() {
    const queryClient = getQueryClient();
    const userId = await getServerUserId();

    // Define the default filter:
    const defaultFilter = 'last_7_days';

    // Get the current date:
    const now = new Date();

    // Compute the startDate and endDate based on the default filter:
    const { endDate, startDate } = getDateRange(defaultFilter, now);

    // Prefetch the query for the last 7 days of analytics data
    await queryClient.prefetchQuery(
        averageTranslationDurationQueryOptions(userId, {
            startDate,
            endDate,
        }),
    );

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <AverageTranslationDurationChartClient />
        </HydrationBoundary>
    );
}
