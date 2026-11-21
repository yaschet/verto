/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/* - Info */
import '@app/globals.css';
import localFont from 'next/font/local';
import { DegradedModeBanner } from '@components/common/degraded-mode-banner';
import RootProvider from '@components/providers/root-provider';
import { Suspense } from 'react';
import {
    APP_COLOR_SCHEME,
    APP_DESCRIPTION,
    APP_KEYWORDS,
    APP_NAME,
    APP_OG_IMAGES,
    APP_REFERRER,
    APP_ROBOTS,
    APP_SITENAME,
    APP_THEME_COLOR,
    APP_TITLE,
    APP_TYPE,
    APP_URL,
} from '@library/app';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import LoadingPage from '@/src/app/loading';

export const metadata: Metadata = {
    alternates: {
        canonical: APP_URL,
        languages: {
            en: APP_URL,
        },
    },
    appleWebApp: {
        statusBarStyle: 'black-translucent',
        title: APP_TITLE,
    },
    applicationName: APP_NAME,
    icons: { icon: '/brand/verto-logo-mark-light.svg' },
    authors: [
        {
            name: APP_NAME,
            url: APP_URL,
        },
    ],
    creator: APP_NAME,
    description: APP_DESCRIPTION,
    formatDetection: {
        address: true,
        email: true,
        telephone: true,
    },
    keywords: APP_KEYWORDS,
    metadataBase: new URL(APP_URL),
    openGraph: {
        description: APP_DESCRIPTION,
        images: APP_OG_IMAGES[0].url,
        locale: 'en_US',
        siteName: APP_SITENAME,
        title: APP_TITLE,
        type: APP_TYPE,
        url: APP_URL,
    },
    publisher: APP_NAME,
    referrer: APP_REFERRER,
    robots: APP_ROBOTS,
    title: {
        default: APP_TITLE,
        template: `%s | ${APP_NAME}`,
    },
};

export const viewport = {
    colorScheme: APP_COLOR_SCHEME,
    initialScale: 1,
    themeColor: APP_THEME_COLOR,
    viewportFit: 'cover',
    width: 'device-width',
};

const fontSans = localFont({
    src: '../../public/fonts/cairo.ttf',
    display: 'swap',
    variable: '--font-app-sans',
});

export default async function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html suppressHydrationWarning lang="en" className={`${fontSans.variable}`}>
            <head>
                <meta content="Verto" name="apple-mobile-web-app-title" />
            </head>
            <body className="relative min-h-screen font-sans antialiased" suppressHydrationWarning={true}>
                <RootProvider>
                    <DegradedModeBanner />
                    <div id="vaul-drawer-wrapper" vaul-drawer-wrapper="">
                        <div
                            className="z-10 flex size-full min-h-screen max-w-[100vw] min-w-full flex-col items-start justify-start"
                            id="app"
                        >
                            <div className="flex min-h-screen w-full flex-col items-center justify-center gap-0 p-0">
                                <Suspense fallback={<LoadingPage />}>{children}</Suspense>
                            </div>
                        </div>
                    </div>
                </RootProvider>
            </body>
        </html>
    );
}
