/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { HydrationBoundary, type QueryClient, dehydrate } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { getServerUserId } from '@/helpers/user';
import { getQueryClient } from '@/src/queries/tanstack/query-client';
import TranslationPairsChartSuspense from '@app/(protected)/app/dashboard/components/analytics/translation-pairs/translation-pairs-chart-suspense';
import { getDateRange } from '@library/time';
import { analyticsTranslationPairsQueryOptions } from '@queries/tanstack/analytics-query-options';

// Lazy load the heavy chart client component (includes recharts ~190KB)
const TranslationPairsChartClient = dynamic(
    () =>
        import(
            '@app/(protected)/app/dashboard/components/analytics/translation-pairs/translation-pairs-chart-client'
        ),
    {
        loading: () => <TranslationPairsChartSuspense />,
    },
);

export default async function TranslationPairsChartRsc() {
    const queryClient: QueryClient = getQueryClient();
    const userId = await getServerUserId();

    // Define the default filter:
    const defaultFilter = 'last_7_days';

    // Get the current date:
    const now = new Date();

    // Compute the startDate and endDate based on the default filter:
    const { endDate, startDate } = getDateRange(defaultFilter, now);

    // Prefetch the query for the last 7 days of analytics data:
    await queryClient.prefetchQuery(
        analyticsTranslationPairsQueryOptions(userId, {
            startDate,
            endDate,
        }),
    );

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <TranslationPairsChartClient />
        </HydrationBoundary>
    );
}
