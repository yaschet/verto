/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { createJSONStorage, persist } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';
import type { transactionsHistoryFilterSchema } from '@schemas/billing-schemas';
import type { infer as zInfer } from 'zod';
import type { StateCreator } from 'zustand';
import type { StoreApi } from 'zustand/vanilla';

/**
 * Zod Schemas for different tables
 */

export const defaultTransactionsHistoryFilterState: TransactionsHistoryFilterState = {
    transactionType: {
        purchase: true,
        consumption: true,
        bonus: true,
        penalty: true,
        refund: true,
    },
    amountRange: {
        min: undefined,
        max: undefined,
    },
    dateRange: {
        start: undefined,
        end: undefined,
    },
};

// Type inferred from Zod schema for Transactions History
export type TransactionsHistoryFilterState = zInfer<typeof transactionsHistoryFilterSchema>;

/**
 * Global Filtering State Definition
 * Contains filters for each table in the application
 */
export type FilteringState = {
    transactionsHistory: TransactionsHistoryFilterState;
    transactionsHistoryState: {
        appliedFiltersCount: number;
        isFilterApplied: boolean;
        isFilterOpen?: boolean;
    };
};

/**
 * Global Filtering Actions
 * Contains methods to update filtering states for different tables
 */
export type FilteringActions = {
    transactionsHistoryActions: {
        setTransactionsHistoryFilter: (filters: TransactionsHistoryFilterState) => void;
        resetTransactionsHistoryFilter: () => void;
        updateTransactionsHistoryState: () => void;
        setTransactionsHistoryFilterOpen: (isOpen: boolean) => void;
    };
};

export type FilteringStore = FilteringState & FilteringActions;

export const defaultGlobalState: FilteringState = {
    transactionsHistory: defaultTransactionsHistoryFilterState,
    transactionsHistoryState: {
        appliedFiltersCount: 0,
        isFilterApplied: false,
    },
};

/**
 * Create a new instance of the Filtering Store.
 *
 * This store manages filters for multiple tables, with strict type-safety for each table's filter schema.
 *
 * @version 1.0.0
 * @param userId
 * @param globalState Initial filtering state.
 * @returns {StoreApi<FilteringStore>} The Filtering Store.
 */
export const createFilteringStore = (
    userId?: string | null | undefined,
    globalState: FilteringState = defaultGlobalState,
): StoreApi<FilteringStore> => {
    const storeOptions: StateCreator<FilteringStore> = (set, get) => ({
        ...globalState,
        transactionsHistoryActions: {
            setTransactionsHistoryFilter: (filters: TransactionsHistoryFilterState) => {
                set((state) => ({
                    ...state,
                    transactionsHistory: filters,
                }));
                get().transactionsHistoryActions.updateTransactionsHistoryState();
            },
            resetTransactionsHistoryFilter: () => {
                set((state) => ({
                    ...state,
                    transactionsHistory: defaultTransactionsHistoryFilterState,
                }));
                get().transactionsHistoryActions.updateTransactionsHistoryState();
            },
            updateTransactionsHistoryState: () => {
                const currentFilters = get().transactionsHistory;
                const defaultFilters = defaultTransactionsHistoryFilterState;
                let count = 0;
                for (const key in currentFilters) {
                    if (Object.prototype.hasOwnProperty.call(currentFilters, key)) {
                        if (
                            JSON.stringify(currentFilters[key as keyof TransactionsHistoryFilterState]) !==
                            JSON.stringify(defaultFilters[key as keyof TransactionsHistoryFilterState])
                        ) {
                            count++;
                        }
                    }
                }
                set((state) => ({
                    ...state,
                    transactionsHistoryState: {
                        appliedFiltersCount: count,
                        isFilterApplied: count > 0,
                    },
                }));
            },
            setTransactionsHistoryFilterOpen: (isOpen: boolean) => {
                set((state) => ({
                    ...state,
                    transactionsHistoryState: {
                        ...state.transactionsHistoryState,
                        isFilterOpen: isOpen,
                    },
                }));
            },
        },
    });

    return userId
        ? createStore(
              persist(storeOptions, {
                  name: `filtering-storage-${userId}`,
                  storage: createJSONStorage(() => localStorage),
                  partialize: (state) => ({
                      transactionsHistory: state.transactionsHistory,
                      transactionsHistoryState: state.transactionsHistoryState,
                  }),
              }),
          )
        : createStore(storeOptions);
};
