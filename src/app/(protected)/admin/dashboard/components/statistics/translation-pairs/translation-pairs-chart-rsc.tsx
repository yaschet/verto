/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getServerUserId } from '@/helpers/user';
import { getQueryClient } from '@/src/queries/tanstack/query-client';
import TranslationPairsChartClient from '@app/(protected)/admin/dashboard/components/statistics/translation-pairs/translation-pairs-chart-client';
import { getDateRange } from '@library/time';
import { translationPairsQueryOptions } from '@queries/tanstack/admin/statistics-query-options';

export default async function TranslationPairsChartRsc() {
    const queryClient = getQueryClient();
    const userId = await getServerUserId();

    // Define the default filter:
    const defaultFilter = 'last_6_months';

    // Get the current date:
    const now = new Date();

    // Compute the startDate and endDate based on the default filter:
    const { endDate, startDate } = getDateRange(defaultFilter, now);

    // Prefetch the query for the last 7 days of analytics data
    await queryClient.prefetchQuery(
        translationPairsQueryOptions(userId, {
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
