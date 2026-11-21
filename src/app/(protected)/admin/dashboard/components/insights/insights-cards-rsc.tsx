/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getServerUserId } from '@/helpers/user';
import InsightsCardsClient from '@app/(protected)/admin/dashboard/components/insights/insights-cards-client';
import { getDateRange } from '@library/time';
import { insightsQueryOptions } from '@queries/tanstack/admin/insights-query-options';
import { getQueryClient } from '@queries/tanstack/query-client';

export default async function InsightsCardsRsc() {
    const userId = await getServerUserId();
    const queryClient = getQueryClient();

    // Define the default filter:
    const defaultFilter = 'last_6_months';

    // Get the current date:
    const now = new Date();

    // Compute the startDate and endDate based on the default filter:
    const { endDate, startDate } = getDateRange(defaultFilter, now);

    await queryClient.prefetchQuery(
        insightsQueryOptions(userId ?? undefined, {
            startDate,
            endDate,
        }),
    );

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <InsightsCardsClient />
        </HydrationBoundary>
    );
}
