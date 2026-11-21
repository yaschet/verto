/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import MinimalNavbar from '@components/layout/minimal-navbar';
import type { ReactNode } from 'react';

export default async function MinimalLayout({ children }: { children: ReactNode }) {
    return (
        <div className="mx-auto flex min-h-full w-full flex-1 flex-col justify-between">
            {/* Logo Header */}
            <MinimalNavbar showHome={true} />

            {/*Children*/}
            <div className="container mx-auto flex w-full flex-1 flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
                {children}
            </div>

            <footer className="text-muted w-full px-4 py-4 text-center text-sm leading-7 sm:px-6 sm:py-8 lg:px-8">
                If you require assistance, our{' '}
                <strong>
                    <a
                        className="text-info-500 dark:text-info-400 font-semibold hover:underline"
                        href="mailto:sample@example.com"
                        rel="noopener noreferrer"
                        target="_blank"
                    >
                        Support Team
                    </a>
                </strong>{' '}
                is available to help. Please contact us at{' '}
                <a
                    className="text-info-500 dark:text-info-400 font-semibold hover:underline"
                    href="mailto:sample@example.com"
                    rel="noopener noreferrer"
                    target="_blank"
                >
                    sample@example.com
                </a>
                .
            </footer>
        </div>
    );
}
