/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { CreditsTransactionTable } from '@app/(protected)/account/billing/components/partials/credits-transactions-table';
import { StripeCustomerPortalButton } from '@app/(protected)/account/billing/components/partials/customer-portal-button';
import { TransactionHistoryFilter } from '@app/(protected)/account/billing/components/partials/transaction-history-filter';
import { TransactionHistoryFilterPanel } from '@app/(protected)/account/billing/components/partials/transaction-history-filter-panel';
import { PanelSection } from '@app/(protected)/account/components/shared/panel-section';
import { cn } from '@library/utils';
import { creditsTransactionsQueryOptions } from '@queries/tanstack/billing-query-options';
import { getQueryClient } from '@queries/tanstack/query-client';

export default async function TransactionHistoryPanel() {
    const queryClient = getQueryClient();

    await queryClient.prefetchInfiniteQuery(creditsTransactionsQueryOptions());

    return (
        <PanelSection
            description={
                <div className={cn('flex w-full flex-col gap-4')}>
                    <div className={cn('flex w-full flex-col gap-0')}>
                        <p className={cn('text-muted max-w-96 text-sm')}>
                            Review your recent credit transactions and activities below. This includes
                            purchases, refunds, bonuses, penalties, and consumption details.
                        </p>
                    </div>
                </div>
            }
            title={
                <div className={cn('flex w-full flex-row items-center justify-between gap-4')}>
                    <h2 className={cn('text-primary text-lg font-semibold')}>Transaction History</h2>
                    <div className={cn('flex w-auto flex-row items-center justify-end gap-2')}>
                        <TransactionHistoryFilter />
                        <StripeCustomerPortalButton />
                    </div>
                </div>
            }
            vertical={true}
        >
            <div className={cn('flex w-full flex-col gap-4')}>
                <TransactionHistoryFilterPanel />
                <HydrationBoundary state={dehydrate(queryClient)}>
                    <CreditsTransactionTable />
                </HydrationBoundary>
            </div>
        </PanelSection>
    );
}
