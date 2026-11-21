/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { type ReactNode, createContext, useContext, useRef } from 'react';
import { useStore } from 'zustand';
import { type AdminStore, createAdminStore } from '@stores/admin-store';

export type AdminStoreApi = ReturnType<typeof createAdminStore>;

const AdminStoreContext = createContext<AdminStoreApi | null>(null);

export interface AdminStoreProviderProps {
    children: ReactNode;
}

export const AdminStoreProvider = ({ children }: AdminStoreProviderProps) => {
    const storeRef = useRef<AdminStoreApi>(undefined);
    if (!storeRef.current) {
        storeRef.current = createAdminStore();
    }

    return <AdminStoreContext.Provider value={storeRef.current}>{children}</AdminStoreContext.Provider>;
};

export const useAdminStore = <T,>(selector: (store: AdminStore) => T): T => {
    const adminStoreContext = useContext(AdminStoreContext);

    if (!adminStoreContext) {
        throw new Error(`useAdminStore must be used within AdminStoreProvider`);
    }

    return useStore(adminStoreContext, selector);
};
