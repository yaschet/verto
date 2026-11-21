/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';
import { AppProgressBar as ProgressBar, useRouter } from 'next-nprogress-bar';
import { ThemeProvider } from 'next-themes';
import React, { Fragment } from 'react';
import { usePathname } from 'next/navigation';
import { GlobalStoreProvider } from './global-store-provider';
import { FilteringStoreProvider } from './filtering-store-provider';
import { useHotkeys } from 'react-hotkeys-hook';
import TanstackQueryProvider from '@/src/components/providers/tanstack-query-provider';
import { NAVIGATION_SHORTCUTS } from '@/src/constants/navigation';
import { env } from '@/src/env';
import { Toaster } from '@components/ui/sonner';

export default function RootProvider({ children }: Readonly<{ children: React.ReactNode }>) {
    const pathname = usePathname();
    if (pathname === '/' || pathname.startsWith('/preview')) return <>{children}</>;
    return <ApplicationProviders>{children}</ApplicationProviders>;
}

function ApplicationProviders({ children }: Readonly<{ children: React.ReactNode }>) {
    const router = useRouter();
    const pathname = usePathname();
    const protectedRoute = /^\/(app|account|admin)(?:\/|$)/.test(pathname);

    useHotkeys(
        [NAVIGATION_SHORTCUTS.translate.win, NAVIGATION_SHORTCUTS.translate.mac],
        () => router.push(NAVIGATION_SHORTCUTS.translate.link),
        {
            description: NAVIGATION_SHORTCUTS.translate.description,
        },
    );
    useHotkeys(
        [NAVIGATION_SHORTCUTS.account.win, NAVIGATION_SHORTCUTS.account.mac],
        () => router.push(NAVIGATION_SHORTCUTS.account.link),
        {
            description: NAVIGATION_SHORTCUTS.account.description,
        },
    );
    useHotkeys(
        [NAVIGATION_SHORTCUTS.billing.win, NAVIGATION_SHORTCUTS.billing.mac],
        () => router.push(NAVIGATION_SHORTCUTS.billing.link),
        {
            description: NAVIGATION_SHORTCUTS.billing.description,
        },
    );
    useHotkeys(
        [NAVIGATION_SHORTCUTS.settings.win, NAVIGATION_SHORTCUTS.settings.mac],
        () => router.push(NAVIGATION_SHORTCUTS.settings.link),
        {
            description: NAVIGATION_SHORTCUTS.settings.description,
        },
    );
    useHotkeys(
        [NAVIGATION_SHORTCUTS.signOut.win, NAVIGATION_SHORTCUTS.signOut.mac],
        () => router.push(NAVIGATION_SHORTCUTS.signOut.link),
        {
            description: NAVIGATION_SHORTCUTS.signOut.description,
        },
    );

    return (
        <TanstackQueryProvider>
            <GoogleOAuthProvider
                clientId={env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}
                onScriptLoadError={() => {
                    console.error('Google OAuth script failed to load.');
                }}
                onScriptLoadSuccess={() => {
                    console.log('Google OAuth script loaded successfully.');
                }}
            >
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true}>
                    <Fragment>
                        {protectedRoute ? (
                            children
                        ) : (
                            <GlobalStoreProvider>
                                <FilteringStoreProvider>{children}</FilteringStoreProvider>
                            </GlobalStoreProvider>
                        )}

                        <ProgressBar
                            color="var(--accent)"
                            delay={0}
                            disableSameURL={true}
                            height="0.3rem"
                            options={{ easing: 'easeInOutCubic', showSpinner: false, speed: 500 }}
                            shallowRouting={true}
                            startPosition={0.3}
                            stopDelay={0}
                        />
                        <Toaster
                            closeButton={true}
                            expand={false}
                            pauseWhenPageIsHidden={true}
                            position="top-center"
                            richColors={false}
                        />
                    </Fragment>
                </ThemeProvider>
            </GoogleOAuthProvider>
        </TanstackQueryProvider>
    );
}
