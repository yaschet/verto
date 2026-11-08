/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { createStore } from 'zustand/vanilla';
import type { StoreApi } from 'zustand/vanilla';

export type AdminState = {
    isAddUserSheetOpen: boolean;
};

export type AdminActions = {
    setIsAddUserSheetOpen: (isOpen: boolean) => void;
};

export type AdminStore = AdminState & AdminActions;

export const defaultAdminState: AdminState = {
    isAddUserSheetOpen: false,
};

export const createAdminStore = (initState: AdminState = defaultAdminState): StoreApi<AdminStore> => {
    return createStore<AdminStore>()((set) => ({
        ...initState,
        setIsAddUserSheetOpen: (isOpen) => set({ isAddUserSheetOpen: isOpen }),
    }));
};
