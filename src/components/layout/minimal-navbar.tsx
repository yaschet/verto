/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { HouseSimple } from '@phosphor-icons/react/dist/ssr/HouseSimple';
import Link from 'next/link';
import { Fragment } from 'react';
import { PrivacyBlurWrapper } from '@/components/layout/privacy-blur-wrapper';
import BackButton from '@components/common/back-button';
import BalanceDisplay from '@components/layout/core/balance-display';
import { NotificationBell } from '@components/layout/core/notification-bell';
import ThemeDropdown from '@components/layout/core/theme-dropdown';
import { UserMenu } from '@components/layout/user-menu';
import { Button } from '@components/ui/button';
import { useUserData } from '@hooks/queries/auth/use-user-data';
import { Logo } from '@components/ui/logo';

export default function MinimalNavbar({ showHome = true }: { showHome?: boolean }) {
    const { data: userData } = useUserData();
    const { user } = userData ?? {};

    return (
        <div className="container mx-auto flex h-auto w-full flex-row items-center justify-between px-4 py-5 text-center sm:px-6 lg:px-8">
            <div className="flex flex-1 flex-row items-center justify-start gap-3">
                <BackButton className="size-10" size="icon-md" />
                {showHome && user?.id && (
                    <Link href="/app/dashboard">
                        <Button
                            className="size-10"
                            color="primary"
                            size="icon-md"
                            tooltipContent="Navigate Home"
                            variant="solid"
                        >
                            <HouseSimple className="size-5" color="currentColor" weight="duotone" />
                            <span className="sr-only">Home</span>
                        </Button>
                    </Link>
                )}
            </div>
            <div className="hidden h-auto w-full flex-1 items-center justify-center md:flex">
                <Link href="/">
                    <PrivacyBlurWrapper>
                        <Logo variant="icon" mode="auto" priority size="sm" className="md:hidden" />
                        <Logo variant="full" mode="auto" priority size="md" className="hidden md:block" />
                    </PrivacyBlurWrapper>
                </Link>
            </div>
            <div className="flex flex-1 flex-row items-center justify-end gap-2">
                <ThemeDropdown className="size-10" size="icon-md" />

                <NotificationBell className="size-10" size="icon-md" />
                {user?.id && (
                    <Fragment>
                        <BalanceDisplay />
                        <UserMenu className="size-10" size="icon-md" variant="compact" />
                    </Fragment>
                )}
            </div>
        </div>
    );
}
