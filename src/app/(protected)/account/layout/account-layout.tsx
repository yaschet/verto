/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { getServerUserId, getUserRole } from '@/helpers/user';
import AccountNavigationTabs from '@app/(protected)/account/layout/account-navigation';
import DashboardHeader from '@components/layout/dashboard-header';
import type { ReactNode } from 'react';

export default async function AccountLayout({ children }: { children: ReactNode }) {
    const userId = await getServerUserId();

    const isAdmin = (await getUserRole(userId)) === 'ADMIN';

    return (
        <div className="bg-surface flex min-h-screen w-full flex-col items-center justify-center">
            <DashboardHeader isAdmin={isAdmin} withSidebar={false} />
            <main className="flex w-full flex-1 flex-col items-stretch justify-stretch">
                <div className="flex flex-1 flex-col items-center justify-center self-stretch">
                    <AccountNavigationTabs isAdmin={isAdmin} />
                    <div className="relative container flex flex-1 flex-col items-center justify-start px-4 sm:px-6 lg:px-8">
                        {children}
                    </div>
                </div>
            </main>
            {/* Footer */}
            <footer className="bg-surface-2 w-full py-6">
                <div className="container mx-auto flex w-full flex-col items-start justify-start px-4 sm:px-6 lg:px-8">
                    <p className="text-surface-600 dark:text-surface-400 text-sm font-medium">
                        &copy; {new Date().getFullYear()} Verto. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
