/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import MinimalFooter from '@components/layout/minimal-footer';
import MinimalNavbar from '@components/layout/minimal-navbar';
import { cn } from '@library/utils';
import type { ReactNode } from 'react';

export default async function CreditsLayout({ children }: { children: ReactNode }) {
    return (
        <div className="relative z-10 flex size-full min-h-screen max-w-[100vw] min-w-full flex-col items-start justify-start overflow-hidden">
            <div
                className={cn(
                    'relative z-10 flex h-full min-h-screen w-full flex-col items-center justify-between',
                )}
            >
                {/* Logo Header */}
                <MinimalNavbar showHome={true} />

                <div
                    // Full Size Container
                    className="container mx-auto my-12 flex size-full max-w-full flex-col items-center justify-center gap-4 px-4 sm:px-6 lg:px-8"
                >
                    {children}
                </div>

                {/* Footer */}
                <MinimalFooter />
            </div>
        </div>
    );
}
