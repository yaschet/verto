/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { GlobalStoreProvider } from '@/src/components/providers/global-store-provider';
import ConfettiComponent from '@/src/components/ui/confetti';
import { getServerUser } from '@/helpers/user';
import { getLogger } from '@/src/services/logger';
import { FilteringStoreProvider } from '@components/providers/filtering-store-provider';
import { userDataQueryOptions } from '@queries/tanstack/auth-query-options';
import { balanceDataQueryOptions } from '@queries/tanstack/billing-query-options';
import { getQueryClient } from '@queries/tanstack/query-client';
import type { ReactNode } from 'react';

export default async function AppStateProvider({ children }: { children: ReactNode }) {
    const logger = getLogger('PROVIDERS:APP-INITIALIZER');
    const queryClient = getQueryClient();

    const user = await getServerUser();

    if (user) {
        try {
            await Promise.all([
                queryClient.prefetchQuery(userDataQueryOptions(user.id)),
                queryClient.prefetchQuery(balanceDataQueryOptions(user.id)),
            ]);
        } catch (error) {
            logger.error('Failed to prefetch profile or balance:', error);
        }
    }

    const dehydratedState = dehydrate(queryClient);

    return (
        <GlobalStoreProvider userId={user?.id}>
            <FilteringStoreProvider userId={user?.id}>
                <HydrationBoundary state={dehydratedState}>
                    <ConfettiComponent />
                    {children}
                </HydrationBoundary>
            </FilteringStoreProvider>
        </GlobalStoreProvider>
    );
}
