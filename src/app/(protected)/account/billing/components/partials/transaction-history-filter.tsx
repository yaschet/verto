/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { FunnelSimpleIcon, FunnelSimpleXIcon } from '@phosphor-icons/react';
import { useFilteringStore } from '@components/providers/filtering-store-provider';
import { Button } from '@components/ui/button';
import { cn } from '@library/utils';

export function TransactionHistoryFilter() {
    const isFilterOpen = useFilteringStore((state) => state.transactionsHistoryState.isFilterOpen);
    const setIsFilterOpen = useFilteringStore(
        (state) => state.transactionsHistoryActions.setTransactionsHistoryFilterOpen,
    );
    const countOfFilters = useFilteringStore((state) => state.transactionsHistoryState.appliedFiltersCount);
    const hasAppliedFilters = useFilteringStore((state) => state.transactionsHistoryState.isFilterApplied);

    if (hasAppliedFilters) {
        return (
            <Button
                aria-label="More Actions"
                className={cn('relative flex h-auto items-center justify-center gap-1')}
                color="default"
                size="sm"
                variant="solid"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
                <FunnelSimpleXIcon className="size-5" color="currentColor" weight="bold" />
                <span className={cn('hidden lg:inline')}>Filter{countOfFilters > 1 ? 's' : ''} Applied</span>
                <div
                    className={cn(
                        'bg-destructive absolute top-0 right-0 -mt-1.5 -mr-1.5 flex h-5 w-5 items-center justify-center rounded-full text-xs text-white',
                    )}
                >
                    {countOfFilters}
                </div>
            </Button>
        );
    }

    return (
        <Button
            aria-label="More Actions"
            className={cn('flex h-auto items-center justify-center gap-1')}
            color="default"
            size="sm"
            variant={isFilterOpen ? 'solid' : 'soft'}
            onClick={() => setIsFilterOpen(!isFilterOpen)}
        >
            {isFilterOpen ? (
                <FunnelSimpleXIcon className="size-5" color="currentColor" weight="bold" />
            ) : (
                <FunnelSimpleIcon className="size-5" color="currentColor" weight="bold" />
            )}
            {isFilterOpen ? (
                <span className={cn('hidden lg:inline')}>Close Filter</span>
            ) : (
                <span className={cn('hidden lg:inline')}>Filter</span>
            )}
        </Button>
    );
}
