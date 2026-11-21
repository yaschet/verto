/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { FilterTransactionsForm } from '@app/(protected)/account/billing/components/partials/filter-transactions-form';
import { useFilteringStore } from '@components/providers/filtering-store-provider';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@components/ui/sheet';

export function TransactionHistoryFilterPanel() {
    const isOpen = useFilteringStore((state) => state.transactionsHistoryState.isFilterOpen);
    const onOpenChange = useFilteringStore(
        (state) => state.transactionsHistoryActions.setTransactionsHistoryFilterOpen,
    );

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Filter Transactions</SheetTitle>
                    <SheetDescription>Filter transactions by type, amount, and date range.</SheetDescription>
                </SheetHeader>
                <div className="mt-3 flex max-h-full w-full flex-col items-center justify-center gap-2 overflow-hidden">
                    <FilterTransactionsForm />
                </div>
            </SheetContent>
        </Sheet>
    );
}
