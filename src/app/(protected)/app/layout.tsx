/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { cookies } from 'next/headers';
import DashboardLayoutProvider from '@components/layout/dashboard-layout';
import type { ReactNode } from 'react';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
    const cookieStore = await cookies();
    const isCollapsed = cookieStore.get('dashboard-sidebar-collapsed')?.value === 'true';

    return <DashboardLayoutProvider initialIsCollapsed={isCollapsed}>{children}</DashboardLayoutProvider>;
}
