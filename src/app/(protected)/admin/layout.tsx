/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { cookies } from 'next/headers';
import DashboardLayoutProvider from '@components/layout/dashboard-layout';
import type { ReactNode } from 'react';

import { AdminStoreProvider } from '@components/providers/admin-store-provider';
import AddUserSheet from './users/sheets/add-user-sheet';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
    const cookieStore = await cookies();
    const isCollapsed = cookieStore.get('dashboard-sidebar-collapsed')?.value === 'true';

    return (
        <AdminStoreProvider>
            <DashboardLayoutProvider initialIsCollapsed={isCollapsed} isAdmin={true}>
                {children}
            </DashboardLayoutProvider>
            <AddUserSheet />
        </AdminStoreProvider>
    );
}
