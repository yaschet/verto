/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import {
    FilesIcon,
    GearIcon,
    HouseSimpleIcon,
    TranslateIcon,
    UserListIcon,
    UserPlusIcon,
    UsersIcon,
} from '@phosphor-icons/react';
import { isMatch } from 'matcher';
import { usePathname } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import { SidebarButton } from '@components/layout/sidebar-button';
import { SidebarLogo } from '@components/layout/sidebar-logo';
import { cn } from '@library/utils';
import type { ReactNode } from 'react';

// Static sidebar links (defined outside component to prevent recreation)
const SIDEBAR_LINKS: { href: string; icon: ReactNode; label: string; matcher: string | string[] }[] = [
    {
        href: '/app/dashboard',
        icon: <HouseSimpleIcon className="size-5" color="currentColor" weight="duotone" />,
        label: 'Dashboard',
        matcher: ['/app/dashboard', '/auth/mfa/challenge', '/auth/mfa/*'],
    },
    {
        href: '/app/translations',
        icon: <TranslateIcon className="size-5" color="currentColor" weight="duotone" />,
        label: 'Translations',
        matcher: ['/app/translations', '/app/translations/*', '/app/translations/new'],
    },
    {
        href: '/app/customers',
        icon: <UsersIcon className="size-5" color="currentColor" weight="duotone" />,
        label: 'Customers',
        matcher: ['/app/customers', '/app/customers/*'],
    },
    {
        href: '/app/templates',
        icon: <FilesIcon className="size-5" color="currentColor" weight="duotone" />,
        label: 'Templates',
        matcher: ['/app/templates', '/app/templates/*'],
    },
];

const ADMIN_SIDEBAR_LINKS: { href: string; icon: ReactNode; label: string; matcher: string | string[] }[] = [
    {
        href: '/admin/dashboard',
        icon: <HouseSimpleIcon className="size-5" color="currentColor" weight="duotone" />,
        label: 'Dashboard',
        matcher: ['/admin/dashboard', '/admin/dashboard/*'],
    },
    {
        href: '/admin/users',
        icon: <UserListIcon className="size-5" color="currentColor" weight="duotone" />,
        label: 'Users',
        matcher: ['/admin/users', '/admin/users/*'],
    },
];

// Memoized sidebar link component
const SidebarLink = React.memo(
    ({
        currentRoute,
        isCollapsed,
        link,
    }: {
        link: (typeof SIDEBAR_LINKS)[0];
        currentRoute: string;
        isCollapsed: boolean;
    }) => {
        const isActive = useMemo(() => isMatch(currentRoute, link.matcher), [currentRoute, link.matcher]);

        return (
            <SidebarButton
                active={isActive}
                color="secondary"
                href={link.href}
                icon={link.icon}
                isCollapsed={isCollapsed}
                label={link.label}
                variant="plain"
            />
        );
    },
);

SidebarLink.displayName = 'SidebarLink';

export default function Sidebar({
    isAdmin = false,
    isCollapsed,
}: {
    isAdmin?: boolean;
    isCollapsed: boolean;
}) {
    const pathname: string = usePathname();
    const [currentRoute, setCurrentRoute] = useState<string>(pathname);

    // Update current route
    useEffect(() => {
        setCurrentRoute(pathname);
    }, [pathname]);

    // Memoize the links to render
    const linksToRender = useMemo(() => (isAdmin ? ADMIN_SIDEBAR_LINKS : SIDEBAR_LINKS), [isAdmin]);

    return (
        <aside
            className={cn(
                'fixed top-0 left-0 z-30 hidden h-screen max-h-screen shrink-0 flex-row items-center justify-center overflow-hidden pr-0 shadow-md lg:flex',
                'transition-[width] duration-280 ease-[cubic-bezier(0.22,0.08,0.25,1)]',
                'will-change-[width]',
            )}
            style={{
                width: isCollapsed ? '6rem' : '14rem',
            }}
        >
            <div className="bg-surface-0 border-border relative flex h-full w-full flex-col overflow-hidden border-r">
                <div className="border-border bg-surface flex h-[3.8125rem] w-full items-center justify-start gap-0 px-5">
                    <SidebarLogo isCollapsed={isCollapsed} />
                </div>

                <div className="flex flex-1 flex-col overflow-hidden">
                    <div className="flex-1 overflow-x-hidden overflow-y-auto px-5 py-6">
                        <div className="flex w-full flex-col items-center justify-start gap-2">
                            {linksToRender.map((link, index) => (
                                <SidebarLink
                                    key={index}
                                    currentRoute={currentRoute}
                                    isCollapsed={isCollapsed}
                                    link={link}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="border-border bg-surface">
                        <div className="flex w-full flex-col items-center justify-start gap-2 px-5 py-5">
                            {isAdmin && (
                                <SidebarButton
                                    color="accent"
                                    href="/admin/users?create=true"
                                    icon={
                                        <UserPlusIcon
                                            className="size-5"
                                            color="currentColor"
                                            weight="duotone"
                                        />
                                    }
                                    isCollapsed={isCollapsed}
                                    label="Create User"
                                    variant="solid"
                                />
                            )}

                            {!isAdmin && (
                                <SidebarButton
                                    active={isMatch(currentRoute, '/account/settings')}
                                    color="secondary"
                                    href="/account/settings"
                                    icon={
                                        <GearIcon className="size-5" color="currentColor" weight="duotone" />
                                    }
                                    isCollapsed={isCollapsed}
                                    label="Settings"
                                    variant="plain"
                                />
                            )}

                            {!isAdmin && (
                                <SidebarButton
                                    color="accent"
                                    href="/app/translations/new"
                                    icon={
                                        <TranslateIcon
                                            className="size-5"
                                            color="currentColor"
                                            weight="duotone"
                                        />
                                    }
                                    isCollapsed={isCollapsed}
                                    label="Translate"
                                    variant="solid"
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
