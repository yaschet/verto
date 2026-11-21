/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { type ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { useStore } from 'zustand';
import { createFilteringStore } from '@stores/filtering-store';
import type { FilteringStore } from '@stores/filtering-store';

export type FilteringStoreApi = ReturnType<typeof createFilteringStore>;

const FilteringStoreContext = createContext<FilteringStoreApi | null>(null);

export type FilteringStoreProviderProps = {
    children: ReactNode;
    userId?: string | null | undefined;
};

export function FilteringStoreProvider({ children, userId }: FilteringStoreProviderProps) {
    const [store, setStore] = useState<FilteringStoreApi>(createFilteringStore(userId));

    useEffect(() => {
        setStore(createFilteringStore(userId));
    }, [userId]);

    return <FilteringStoreContext.Provider value={store}>{children}</FilteringStoreContext.Provider>;
}

export const useFilteringStore = <T,>(selector: (store: FilteringStore) => T): T => {
    const filteringStoreContext = useContext(FilteringStoreContext);

    if (!filteringStoreContext) {
        throw new Error("The 'useFilteringStore' hook must be used within a 'FilteringStoreProvider'.");
    }

    return useStore(filteringStoreContext, selector);
};
