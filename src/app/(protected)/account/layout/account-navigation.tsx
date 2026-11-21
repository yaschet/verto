/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { GearSixIcon, HouseSimpleIcon, InvoiceIcon, UserCircleDashedIcon } from '@phosphor-icons/react';
import { isMatch } from 'matcher';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { Button } from '@components/ui/button';
import type { ButtonProps } from '@components/ui/button';
import type { Icon as IconType } from '@phosphor-icons/react';

type AccountNavigationTabLinkType = {
    href: string;
    label: string;
    icon?: IconType;
    matcher: string | string[];
};

const Links: AccountNavigationTabLinkType[] = [
    {
        href: '/app/dashboard',
        icon: HouseSimpleIcon,
        label: 'Dashboard',
        matcher: ['/app/dashboard', '/app/dashboard/*'],
    },
    {
        href: '/account',
        icon: UserCircleDashedIcon,
        label: 'Account',
        matcher: ['/account'],
    },
    {
        href: '/account/billing',
        icon: InvoiceIcon,
        label: 'Billing',
        matcher: ['/account/billing', '/account/billing/*'],
    },
    {
        href: '/account/settings',
        icon: GearSixIcon,
        label: 'Settings',
        matcher: ['/account/settings', '/account/settings/*'],
    },
];

const AdminLinks: AccountNavigationTabLinkType[] = [
    {
        href: '/admin/dashboard',
        icon: HouseSimpleIcon,
        label: 'Dashboard',
        matcher: ['/admin/dashboard'],
    },
    {
        href: '/account',
        icon: UserCircleDashedIcon,
        label: 'Account',
        matcher: ['/account'],
    },
];

export default function AccountNavigationTabs({ isAdmin }: { isAdmin: boolean }) {
    const linksToRender = isAdmin ? AdminLinks : Links;

    return (
        <div className="bg-surface-2 w-full px-8 py-3">
            <ul className="mx-auto flex w-full max-w-screen-lg flex-row flex-wrap items-center justify-center gap-2 lg:items-center lg:justify-start">
                {linksToRender.map((link) => (
                    <AccountNavigationTab key={link.href} {...link} />
                ))}
            </ul>
        </div>
    );
}

function AccountNavigationTab({ href, icon, label, matcher }: AccountNavigationTabLinkType) {
    const pathname = usePathname();

    const buttonProps = useMemo(
        () =>
            ({
                className: 'flex items-center justify-center gap-2 w-full flex-1 sm:w-fit sm:flex-none',
                color: isMatch(pathname, matcher) ? 'default' : 'secondary',
                shape: 'rounded',
                size: 'md',
                variant: isMatch(pathname, matcher) ? 'solid' : 'soft',
            }) as ButtonProps,
        [matcher, pathname],
    );

    const IconComponent: IconType = icon ?? UserCircleDashedIcon;

    return (
        <li className="relative">
            <Button asChild {...buttonProps}>
                <Link href={href}>
                    {icon && (
                        <IconComponent
                            aria-hidden="true"
                            className="size-6"
                            color="currentColor"
                            weight="duotone"
                        />
                    )}
                    <span className="ml-2 hidden sm:block">{label}</span>
                </Link>
            </Button>
        </li>
    );
}
