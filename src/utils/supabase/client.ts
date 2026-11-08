/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';
import { env } from '@/env';
import type { ExtendedDatabase } from '@/types/database/database.extended';
import type { SupportedStorage } from '@supabase/supabase-js';

function supportsLocalStorage() {
    try {
        return 'localStorage' in globalThis && globalThis.localStorage !== null;
    } catch {
        return false;
    }
}

const customStorageAdapter: SupportedStorage = {
    getItem: (key) => {
        if (!supportsLocalStorage()) {
            // Configure alternate storage
            return null;
        }
        return globalThis.localStorage.getItem(key);
    },
    removeItem: (key) => {
        if (!supportsLocalStorage()) {
            // Configure alternate storage here:
            return;
        }
        globalThis.localStorage.removeItem(key);
    },
    setItem: (key, value) => {
        if (!supportsLocalStorage()) {
            // Configure alternate storage here
            return;
        }
        globalThis.localStorage.setItem(key, value);
    },
};

export function createBrowserClient() {
    return createSupabaseBrowserClient<ExtendedDatabase>(
        env.NEXT_PUBLIC_SUPABASE_URL!,
        env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                detectSessionInUrl: true,
                flowType: 'pkce',
                storage: customStorageAdapter,
            },
        },
    );
}
