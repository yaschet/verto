/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { ListIcon, SidebarIcon, XIcon } from '@phosphor-icons/react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import ActiveUsersDisplay from '@components/layout/core/active-users-display';
import BalanceDisplay from '@components/layout/core/balance-display';
import MobileNavigation from '@components/layout/core/dashboard-mobile-navigation';
import { NotificationBell } from '@components/layout/core/notification-bell';
import ThemeDropdown from '@components/layout/core/theme-dropdown';
import { PrivacyBlurWrapper } from '@components/layout/privacy-blur-wrapper';
import { UserMenu } from '@components/layout/user-menu';
import { Button } from '@components/ui/button';
import { cn } from '@library/utils';
import { Logo } from '@components/ui/logo';

function Actions({ className, isAdmin = false }: { className?: string; isAdmin?: boolean }) {
    return (
        <div
            className={cn(
                'relative flex h-full w-auto max-w-full flex-row items-center justify-end gap-3',
                className,
            )}
        >
            <ThemeDropdown />
            {!isAdmin && (
                <>
                    <NotificationBell />
                    <BalanceDisplay />
                </>
            )}
            {isAdmin && <ActiveUsersDisplay />}
            <UserMenu isAdmin={isAdmin} variant="compact" />
        </div>
    );
}

function DesktopHeader({
    className,
    isAdmin = false,
    isCollapsed = false,
    onToggleSidebar,
    withSidebar = true,
}: {
    className?: string;
    isAdmin?: boolean;
    withSidebar?: boolean;
    isCollapsed?: boolean;
    onToggleSidebar?: () => void;
}) {
    return (
        <div
            className={cn(
                'border-b-border bg-surface dark:bg-surface sticky top-0 z-20 flex h-15.25 w-full max-w-full min-w-full flex-row items-center gap-4 border-b p-0 px-4 shadow-md lg:px-5',
                className,
            )}
        >
            {/* SidebarIcon toggle - only show on desktop when sidebar is present */}
            {withSidebar && onToggleSidebar && (
                <button
                    aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    className={cn(
                        'hidden size-8 shrink-0 items-center justify-center rounded-lg lg:flex',
                        'text-surface-600 hover:bg-surface-100 hover:text-surface-900',
                        'dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-100',
                        'transition-colors duration-200',
                        'focus-visible:ring-primary-500 focus:outline-none focus-visible:ring-2',
                    )}
                    onClick={onToggleSidebar}
                >
                    <SidebarIcon className="size-5" color="currentColor" weight="duotone" />
                </button>
            )}

            {/* Logo - only show on mobile/tablet when sidebar is hidden */}
            <div
                className={cn(
                    'relative flex h-auto w-auto max-w-full flex-row place-items-start items-center justify-start gap-3 place-self-start self-center justify-self-start',
                    withSidebar && 'lg:hidden',
                )}
            >
                <Link className="flex size-auto items-center justify-start bg-none" href="/app/dashboard">
                    <PrivacyBlurWrapper>
                        <Logo variant="full" mode="auto" priority size="md" />
                    </PrivacyBlurWrapper>
                </Link>
            </div>
            {/* Actions - pushed to the right */}
            <div className="ml-auto flex h-full w-auto max-w-full flex-row items-center justify-end">
                <Actions isAdmin={isAdmin} />
            </div>
        </div>
    );
}

function MobileHeader({ className, isAdmin = false }: { className?: string; isAdmin?: boolean }) {
    const [isMobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

    return (
        <React.Fragment>
            {/* Navigation Bar Container (Mobile) */}
            <div
                className={cn(
                    'bg-surface-0/95 supports-backdrop-filter:bg-surface-0/60 sticky top-0 z-50 flex h-auto w-full max-w-full min-w-full flex-row items-center justify-end gap-4 p-0 px-4 py-2.5 shadow-md backdrop-blur',
                    className,
                )}
            >
                {/* Logo and Links */}
                <div className="flex size-auto flex-1 flex-row items-center justify-start gap-3">
                    <div className="flex size-auto items-center justify-start gap-4 bg-none">
                        <Button
                            color="secondary"
                            size="icon-lg"
                            type="button"
                            variant="soft"
                            onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {!isMobileMenuOpen && (
                                <ListIcon className="size-5" color="currentColor" weight="regular" />
                            )}
                            {isMobileMenuOpen && (
                                <XIcon className="size-5" color="currentColor" weight="regular" />
                            )}
                        </Button>
                        <Link className="flex size-auto items-center justify-start bg-none" href="/">
                            <PrivacyBlurWrapper>
                                <Logo variant="icon" mode="auto" priority size="sm" className="md:hidden" />
                                <Logo
                                    variant="full"
                                    mode="auto"
                                    priority
                                    size="md"
                                    className="hidden md:block"
                                />
                            </PrivacyBlurWrapper>
                        </Link>
                    </div>
                </div>
                {/* Buttons */}
                <div className="flex items-center justify-end gap-2 md:order-2">
                    {!isAdmin && <BalanceDisplay />}
                    <UserMenu isAdmin={isAdmin} variant="mobile" />
                </div>
            </div>
            <MobileNavigation
                isAdmin={isAdmin}
                isOpen={isMobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
            />
        </React.Fragment>
    );
}

export default function DashboardHeader({
    className,
    isAdmin = false,
    isCollapsed = false,
    onToggleSidebar,
    withSidebar = true,
}: {
    className?: string;
    isAdmin?: boolean;
    withSidebar?: boolean;
    isCollapsed?: boolean;
    onToggleSidebar?: () => void;
}) {
    const [isMobile, setIsMobile] = useState<boolean>(false);

    useEffect(() => {
        if (window) {
            setIsMobile(window.innerWidth <= 1024);
        }
    }, []);

    useEffect(() => {
        if (window) {
            window.addEventListener('resize', () => {
                setIsMobile(window.innerWidth <= 1024);
            });
        }
    }, []);

    return isMobile ? (
        <MobileHeader className={className} isAdmin={isAdmin} />
    ) : (
        <DesktopHeader
            className={className}
            isAdmin={isAdmin}
            isCollapsed={isCollapsed}
            withSidebar={withSidebar}
            onToggleSidebar={onToggleSidebar}
        />
    );
}
