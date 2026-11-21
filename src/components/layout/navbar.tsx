/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import {
    CardsIcon,
    CubeIcon,
    HouseSimpleIcon,
    ListIcon,
    PaperPlaneTiltIcon,
    SignInIcon,
    UsersIcon,
} from '@phosphor-icons/react';
import Link from 'next/link';
import { Fragment, useEffect, useState } from 'react';
import { PrivacyBlurWrapper } from '@/components/layout/privacy-blur-wrapper';
import DynamicLink from '@components/layout/core/dynamic-link';
import MobileSlideOver from '@components/layout/core/mobile-slide-over';
import ThemeDropdown from '@components/layout/core/theme-dropdown';
import { UserMenu } from '@components/layout/user-menu';
import { Button } from '@components/ui/button';
import { useUserData } from '@hooks/queries/auth/use-user-data';
import { Logo } from '@components/ui/logo';
import type { Icon } from '@phosphor-icons/react';
import type { JSX } from 'react';

export const navLinks: {
    icon?: Icon;
    title: string;
    href: string;
}[] = [
    {
        href: '/',
        icon: HouseSimpleIcon,
        title: 'Home',
    },
    {
        href: '/#features',
        icon: CubeIcon,
        title: 'Features',
    },
    {
        href: '/#pricing',
        icon: CardsIcon,
        title: 'Pricing',
    },
    {
        href: '/contact',
        icon: PaperPlaneTiltIcon,
        title: 'Contact',
    },
];

export default function NavigationBar(): JSX.Element {
    // Get the Display Size of the Screen
    const [isMobile, setIsMobile] = useState<boolean>(false);
    const [isMounted, setMounted] = useState<boolean>(false);

    useEffect(() => {
        setMounted(true);
    }, []);

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

    return isMounted ? (
        !isMobile ? (
            <NavigationForDesktop />
        ) : (
            <NavigationForMobile />
        )
    ) : (
        <Fragment>
            <NavigationForDesktop />
            <NavigationForMobile />
        </Fragment>
    );
}

function NavigationForDesktop() {
    // Get the current session:
    const { data: userData } = useUserData();
    const { user } = userData ?? {};

    return (
        <Fragment>
            {/* - Navigation Bar Container (Desktop): */}
            <div className="relative z-50 mx-auto hidden h-auto w-full max-w-screen-xl flex-row items-center justify-center px-4 py-8 text-center lg:flex lg:px-6">
                {/* - Logo and Links: */}
                <div className="flex size-auto h-full min-h-[24px] flex-1 flex-row items-center justify-start gap-3">
                    <Link className="relative flex items-center justify-start" href="/">
                        <PrivacyBlurWrapper>
                            <Logo variant="full" mode="auto" priority size="md" />
                        </PrivacyBlurWrapper>
                    </Link>
                    <div className="flex items-center gap-1 px-5 py-0">
                        {navLinks.map((link, index) => (
                            <DynamicLink key={index} href={link.href} icon={link.icon} title={link.title} />
                        ))}
                    </div>
                </div>
                {/* - Buttons: */}
                <div className="flex flex-row items-center justify-end gap-3">
                    <ThemeDropdown size="icon" />
                    {user?.id ? (
                        <UserMenu variant="compact" />
                    ) : (
                        <div className="flex flex-row items-center justify-end gap-1">
                            <Link href="/auth/sign-up">
                                <Button color="default" shape="rounded" variant="soft">
                                    <UsersIcon className="size-5" color="currentColor" weight="duotone" />
                                    <span className="hidden md:block">Sign up</span>
                                </Button>
                            </Link>
                            <Link href="/auth/sign-in">
                                <Button color="accent" shape="rounded" variant="solid">
                                    <SignInIcon className="size-5" color="currentColor" weight="duotone" />
                                    <span className="hidden md:block">Log in</span>
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </Fragment>
    );
}

function NavigationForMobile() {
    const [isMobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

    const { data: userData } = useUserData();
    const { user } = userData ?? {};

    return (
        <Fragment>
            {/* - Navigation Bar Container (Mobile): */}
            <div className="flex h-auto w-full flex-row items-center justify-center gap-3 p-5 text-center lg:hidden">
                {/* - Logo and Links: */}
                <div className="flex size-auto flex-1 flex-row items-center justify-start gap-3">
                    <div className="flex size-auto items-center justify-start bg-none">
                        <Link className="flex size-auto items-center justify-start bg-none" href="/">
                            <PrivacyBlurWrapper>
                                <Logo variant="full" mode="auto" priority size="md" />
                            </PrivacyBlurWrapper>
                        </Link>
                    </div>
                </div>
                {/* - Action Buttons: */}
                <div className="flex gap-2 md:order-2">
                    {!user?.id && (
                        <Button asChild color="primary" type="button" variant="solid">
                            <Link href="/auth/sign-in">
                                <SignInIcon className="size-5" color="currentColor" weight="duotone" />
                                <span className="text-sm font-semibold md:block">Sign In</span>
                            </Link>
                        </Button>
                    )}
                    {user?.id && <UserMenu variant="compact" />}
                    <Button
                        className="p-2"
                        color="primary"
                        size="icon"
                        type="button"
                        variant="soft"
                        onClick={() => setMobileMenuOpen(true)}
                    >
                        <ListIcon className="size-6" color="currentColor" weight="regular" />
                    </Button>
                </div>
            </div>
            <MobileSlideOver isOpen={isMobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        </Fragment>
    );
}
