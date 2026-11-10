/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import Footer from '@components/layout/footer';
import NavigationBar from '@components/layout/navbar';
import type { ReactNode } from 'react';

export default async function LegalLayout({ children }: { children: ReactNode }) {
    return (
        <div className="bg-surface-50 dark:bg-surface-950 relative flex min-h-screen w-full flex-col">
            <NavigationBar />

            <main className="container relative z-10 mx-auto flex flex-1 flex-col items-center justify-start px-4 py-12 md:px-6 lg:py-24">
                <div className="bg-surface-0/70 border-surface-200 dark:border-surface-800 dark:bg-surface-900/50 w-full max-w-4xl rounded-2xl border p-6 shadow-sm backdrop-blur-xl md:p-12">
                    {children}
                </div>
            </main>

            <Footer />
        </div>
    );
}
