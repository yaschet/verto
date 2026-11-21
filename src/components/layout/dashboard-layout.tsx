/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { useEffect, useState } from 'react';
import DashboardHeader from '@components/layout/dashboard-header';
import Sidebar from '@components/layout/sidebar';
import { cn } from '@library/utils';
import type { ReactNode } from 'react';

export default function DashboardLayoutProvider({
    children,
    initialIsCollapsed = false,
    isAdmin = false,
    withSidebar = true,
}: {
    children: ReactNode;
    withSidebar?: boolean;
    isAdmin?: boolean;
    initialIsCollapsed?: boolean;
}) {
    const [isCollapsed, setIsCollapsed] = useState<boolean>(initialIsCollapsed);

    useEffect(() => {
        if (!withSidebar) return;
        if (typeof window === 'undefined') return;

        const serialized = isCollapsed ? 'true' : 'false';
        localStorage.setItem('dashboard-sidebar-collapsed', serialized);
        document.cookie = `dashboard-sidebar-collapsed=${serialized}; path=/; max-age=31536000`;
    }, [isCollapsed, withSidebar]);

    return (
        <div className="bg-surface-0 flex min-h-screen w-full">
            {/* Sidebar (fixed on left, z-indexed above content) */}
            {withSidebar && <Sidebar isAdmin={isAdmin} isCollapsed={isCollapsed} />}

            {/* Main content area - takes remaining space */}
            <div
                className={cn(
                    'flex w-full flex-1 flex-col transition-[padding-left] duration-300 ease-out',
                    withSidebar && (isCollapsed ? 'lg:pl-24' : 'lg:pl-56'),
                )}
            >
                <DashboardHeader
                    isAdmin={isAdmin}
                    isCollapsed={isCollapsed}
                    withSidebar={withSidebar}
                    onToggleSidebar={() => setIsCollapsed(!isCollapsed)}
                />
                <main className="bg-surface-100 dark:bg-surface-900/50 flex-1">
                    <div className="w-full px-4 py-6 sm:px-6 lg:px-8">{children}</div>
                </main>
            </div>
        </div>
    );
}
