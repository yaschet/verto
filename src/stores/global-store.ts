/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { createJSONStorage, persist } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';
import type { StateCreator } from 'zustand';
import type { StoreApi } from 'zustand/vanilla';

export type GlobalState = {
    isConfettiVisible: boolean;
};

export type GlobalActions = {
    showConfetti: () => void;
    hideConfetti: () => void;
};

export type GlobalStore = GlobalState & GlobalActions;

export const defaultGlobalState: GlobalState = {
    isConfettiVisible: false,
};

export const createGlobalStore = (
    userId?: string | null | undefined,
    globalState: GlobalState = defaultGlobalState,
): StoreApi<GlobalStore> => {
    const storeOptions: StateCreator<GlobalStore> = (set) => ({
        ...globalState,
        hideConfetti: () => set({ isConfettiVisible: false }),
        showConfetti: () => set({ isConfettiVisible: true }),
    });

    return userId
        ? createStore<GlobalStore>()(
              persist(storeOptions, {
                  name: `global-storage-${userId}`,
                  storage: createJSONStorage(() => localStorage),
              }),
          )
        : createStore<GlobalStore>(storeOptions);
};
