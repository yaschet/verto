/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { useGoogleOneTapLogin } from '@react-oauth/google';
import { usePathname } from 'next/navigation';
import { type ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { titleCase } from 'title-case';
import { useStore } from 'zustand';
import { env } from '@/env';
import { signInWithGoogleOneTap } from '@actions/auth/sign-in';
import useHeartbeat from '@hooks/queries/auth/use-heartbeat';
import { type GlobalStore, createGlobalStore } from '@stores/global-store';

export type GlobalStoreApi = ReturnType<typeof createGlobalStore>;

const GlobalStoreContext = createContext<GlobalStoreApi | null>(null);

export type GlobalStoreProviderProps = {
    children: ReactNode;
    userId?: string | null | undefined;
};

/**
 * Determines if Google One Tap should be shown based on current route
 * Returns true if One Tap should be DISABLED
 */
function shouldDisableOneTap(pathname: string, userId?: string | null): boolean {
    // Check for dev feature flag to completely disable One Tap
    if (process.env.NODE_ENV === 'development' && env.NEXT_PUBLIC_DISABLE_GOOGLE_ONE_TAP) {
        return true;
    }

    // Always disable if user is already authenticated
    if (userId) return true;

    // Disable on all auth pages (/auth/sign-in, /auth/sign-up, etc.)
    if (pathname.startsWith('/auth')) return true;

    // Disable on authenticated routes (user shouldn't be there without login anyway)
    if (pathname.startsWith('/app')) return true;

    // Disable on error pages
    if (pathname.startsWith('/error')) return true;

    // Check localStorage for dismissal (remember for 7 days)
    if (typeof window !== 'undefined') {
        const dismissed = localStorage.getItem('google-one-tap-dismissed');
        if (dismissed) {
            const dismissedTime = parseInt(dismissed, 10);
            const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
            if (Date.now() - dismissedTime < sevenDaysInMs) {
                return true; // Still within dismissal period
            } else {
                // Dismissal expired, clear it
                localStorage.removeItem('google-one-tap-dismissed');
            }
        }
    }

    // Allow on landing/marketing pages (/, /pricing, /features, etc.)
    return false;
}

export function GlobalStoreProvider({ children, userId }: GlobalStoreProviderProps) {
    const storeRef = useRef<GlobalStoreApi>(undefined);
    const pathname = usePathname();
    const [oneTapDisabled, setOneTapDisabled] = useState(true); // Start disabled for SSR

    // Create the store if it doesn't exist.
    if (!storeRef.current) {
        storeRef.current = createGlobalStore(userId);
    }

    // Update One Tap disabled state based on route
    useEffect(() => {
        setOneTapDisabled(shouldDisableOneTap(pathname, userId));
    }, [pathname, userId]);

    // Authentication Features:
    useHeartbeat();

    useGoogleOneTapLogin({
        auto_select: false, // ✅ Never auto-sign in without user action
        cancel_on_tap_outside: true, // ✅ Allow dismissal by clicking outside
        disabled: oneTapDisabled, // ✅ Smart route-based control
        onError: () => {
            toast.error(titleCase('Failed to sign in with Google One Tap'), {
                description: 'Please try again or use a different sign-in method.',
                duration: 3000,
                id: 'google-sign-in-error',
            });
        },
        onSuccess: async (response) => {
            if (response.credential) {
                await signInWithGoogleOneTap(response.credential);
            }
        },
        // Remember dismissal for 7 days when user clicks "X" or outside
        use_fedcm_for_prompt: true, // Use browser's native credential manager when available
    });

    // Handle manual dismissal (when user clicks X on One Tap)
    useEffect(() => {
        const handleDismiss = () => {
            if (typeof window !== 'undefined') {
                localStorage.setItem('google-one-tap-dismissed', Date.now().toString());
                setOneTapDisabled(true);
            }
        };

        // Listen for One Tap dismissal events
        window.addEventListener('google-one-tap-dismissed', handleDismiss);
        return () => window.removeEventListener('google-one-tap-dismissed', handleDismiss);
    }, []);

    return <GlobalStoreContext.Provider value={storeRef.current}>{children}</GlobalStoreContext.Provider>;
}

export const useGlobalStore = <T,>(selector: (store: GlobalStore) => T): T => {
    const globalStoreContext = useContext(GlobalStoreContext);

    if (!globalStoreContext) {
        throw new Error("The 'useGlobalStore' hook must be used within a 'GlobalStoreProvider'.");
    }

    return useStore(globalStoreContext, selector);
};
