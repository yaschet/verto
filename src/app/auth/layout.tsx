/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import MinimalFooter from '@components/layout/minimal-footer';
import MinimalNavbar from '@components/layout/minimal-navbar';
import DotPattern from '@components/ui/dot-pattern';
import { cn } from '@library/utils';
import type { ReactNode } from 'react';

export default async function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="relative z-10 flex size-full min-h-screen max-w-[100vw] min-w-full flex-col items-start justify-start overflow-x-hidden">
            <div
                className={cn(
                    'bg-surface flex h-full min-h-screen w-full flex-col items-center justify-between',
                )}
            >
                <DotPattern
                    className={cn('[mask-image:radial-gradient(300px_circle_at_top,white,transparent)]')}
                />
                {/* Logo Header */}
                <MinimalNavbar />

                <div
                    // Full Size Container
                    className="relative z-20 container mx-auto my-12 flex size-full max-w-full flex-col items-center justify-center gap-4 overflow-hidden px-4 sm:max-w-full sm:px-6 md:max-w-md lg:max-w-lg lg:px-8 xl:max-w-xl"
                >
                    {children}
                </div>

                {/* Footer */}
                <div className="w-full px-4 pb-5 text-center sm:px-6 lg:px-8">
                    <MinimalFooter />
                </div>
            </div>
        </div>
    );
}
