/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { useEffect } from 'react';
import { DefaultCard } from '@/components/ui/card';
import { CreditsTransactionTable } from '@/src/app/(protected)/account/billing/components/partials/credits-transactions-table';
import { TransactionHistoryFilter } from '@/src/app/(protected)/account/billing/components/partials/transaction-history-filter';
import { TransactionHistoryFilterPanel } from '@/src/app/(protected)/account/billing/components/partials/transaction-history-filter-panel';
import { PanelSection } from '@/src/app/(protected)/account/components/shared/panel-section';
import { useFilteringStore } from '@/src/components/providers/filtering-store-provider';
import { cn } from '@/src/library/utils';

interface UserBillingSectionProps {
    userId: string;
}

export function UserBillingSection({ userId }: UserBillingSectionProps) {
    const resetTransactionsHistoryFilter = useFilteringStore(
        (state) => state.transactionsHistoryActions.resetTransactionsHistoryFilter,
    );

    // Reset filters on mount to ensure we don't carry over state from other pages
    useEffect(() => {
        resetTransactionsHistoryFilter();
        return () => {
            resetTransactionsHistoryFilter();
        };
    }, [resetTransactionsHistoryFilter]);

    return (
        <DefaultCard className="p-6">
            <PanelSection
                description={
                    <div className={cn('flex w-full flex-col gap-4')}>
                        <div className={cn('flex w-full flex-col gap-0')}>
                            <p className={cn('text-muted max-w-96 text-sm')}>
                                Review the user&apos;s recent credit transactions and activities.
                            </p>
                        </div>
                    </div>
                }
                title={
                    <div className={cn('flex w-full flex-row items-center justify-between gap-4')}>
                        <h2 className={cn('text-primary text-lg font-semibold')}>Transaction History</h2>
                        <div className={cn('flex w-auto flex-row items-center justify-end gap-2')}>
                            <TransactionHistoryFilter />
                        </div>
                    </div>
                }
                vertical={true}
            >
                <div className={cn('flex w-full flex-col gap-4')}>
                    <TransactionHistoryFilterPanel />
                    <CreditsTransactionTable userId={userId} isAdmin={true} />
                </div>
            </PanelSection>
        </DefaultCard>
    );
}
