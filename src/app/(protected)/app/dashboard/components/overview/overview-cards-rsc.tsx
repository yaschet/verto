/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getServerUserId } from '@/helpers/user';
import OverviewCardsClient from '@app/(protected)/app/dashboard/components/overview/overview-cards-client';
import { overviewInsightsQueryOptions } from '@queries/tanstack/analytics-query-options';
import { getQueryClient } from '@queries/tanstack/query-client';

export default async function OverviewCardsRsc() {
    const userId = await getServerUserId();
    const queryClient = getQueryClient();

    await queryClient.prefetchQuery(overviewInsightsQueryOptions(userId ?? undefined));

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <OverviewCardsClient />
        </HydrationBoundary>
    );
}
