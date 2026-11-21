/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import {
    FilesIcon,
    GearSixIcon,
    HouseSimpleIcon,
    MoonIcon,
    SunIcon,
    TranslateIcon,
    UserListIcon,
    UsersIcon,
    XIcon,
} from '@phosphor-icons/react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Fragment, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { DynamicSlideoverLink } from '@components/layout/core/dynamic-link';
import { Button } from '@components/ui/button';
import { Logo } from '@components/ui/logo';

export default function MobileNavigation({
    isAdmin = false,
    isOpen,
    onClose,
}: {
    isOpen: boolean;
    onClose: () => void;
    isAdmin?: boolean;
}) {
    const navLinks = [
        { href: '/app/dashboard', icon: HouseSimpleIcon, title: 'Dashboard' },
        {
            href: '/app/translations',
            icon: TranslateIcon,
            title: 'Translations',
        },
        {
            href: '/app/customers',
            icon: UsersIcon,
            title: 'Customers',
        },
        {
            href: '/app/templates',
            icon: FilesIcon,
            title: 'Templates',
        },
    ];

    const adminLinks = [
        {
            href: '/admin/dashboard',
            icon: HouseSimpleIcon,
            title: 'Dashboard',
        },
        {
            href: '/admin/users',
            icon: UserListIcon,
            title: 'Users',
        },
    ];

    return (
        <Transition as={Fragment} show={isOpen}>
            <Dialog as="div" className="relative z-50 lg:hidden" onClose={onClose}>
                {/* Backdrop */}
                <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="bg-surface-950/40 dark:bg-surface-950/60 fixed inset-0 backdrop-blur-sm" />
                </TransitionChild>

                {/* Slide-out sidebar panel */}
                <div className="fixed inset-0 flex">
                    <TransitionChild
                        as={Fragment}
                        enter="transition ease-out duration-300 transform"
                        enterFrom="-translate-x-full"
                        enterTo="translate-x-0"
                        leave="transition ease-in duration-200 transform"
                        leaveFrom="translate-x-0"
                        leaveTo="-translate-x-full"
                    >
                        <DialogPanel className="bg-surface-50 dark:bg-surface-950 relative flex w-full max-w-xs flex-col overflow-hidden shadow-2xl">
                            {/* Header with logo and close button */}
                            <div className="border-border flex items-center justify-between border-b px-5 py-4">
                                <Link className="flex items-center" href="/app/dashboard" onClick={onClose}>
                                    <Logo variant="icon" mode="auto" size="sm" />
                                </Link>

                                <Button
                                    aria-label="Close navigation"
                                    color="secondary"
                                    size="icon-sm"
                                    variant="plain"
                                    onClick={onClose}
                                >
                                    <XIcon className="size-5" weight="bold" />
                                </Button>
                            </div>

                            {/* Navigation content */}
                            <div className="flex flex-1 flex-col overflow-y-auto">
                                <div className="flex flex-col gap-8 px-5 py-6">
                                    {/* Main navigation */}
                                    <div className="flex flex-col gap-3">
                                        <p className="text-surface-500 dark:text-surface-400 px-2 text-xs font-semibold tracking-wider uppercase">
                                            Navigation
                                        </p>

                                        {!isAdmin &&
                                            navLinks.map((link, index) => (
                                                <DynamicSlideoverLink
                                                    key={index}
                                                    href={link.href}
                                                    icon={
                                                        <link.icon
                                                            className="size-5"
                                                            color="currentColor"
                                                            weight="duotone"
                                                        />
                                                    }
                                                    title={link.title}
                                                />
                                            ))}

                                        {isAdmin &&
                                            adminLinks.map((link, index) => (
                                                <DynamicSlideoverLink
                                                    key={index}
                                                    href={link.href}
                                                    icon={
                                                        <link.icon
                                                            className="size-5"
                                                            color="currentColor"
                                                            weight="duotone"
                                                        />
                                                    }
                                                    title={link.title}
                                                />
                                            ))}
                                    </div>

                                    {/* Theme switcher */}
                                    <div className="flex flex-col gap-3">
                                        <p className="text-surface-500 dark:text-surface-400 px-2 text-xs font-semibold tracking-wider uppercase">
                                            Theme
                                        </p>

                                        <ThemeMenu />
                                    </div>
                                </div>
                            </div>
                        </DialogPanel>
                    </TransitionChild>
                </div>
            </Dialog>
        </Transition>
    );
}

function ThemeMenu() {
    const { resolvedTheme, setTheme, systemTheme, theme } = useTheme();
    const [ThemeState, setThemeState] = useState<string>('');
    const triggerRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (theme === 'light') {
            setThemeState('light');
        } else if (theme === 'dark') {
            setThemeState('dark');
        } else if (theme === 'system') {
            setThemeState('system');
        }
    }, [theme]);

    const toggleTheme = async (newTheme: string) => {
        if (resolvedTheme === 'dark') {
            document.documentElement.classList.add('transition-bg-dark');
        } else if (resolvedTheme === 'light') {
            document.documentElement.classList.add('transition-bg-light');
        } else {
            if (systemTheme === 'dark') {
                document.documentElement.classList.add('transition-bg-light');
            } else if (systemTheme === 'light') {
                document.documentElement.classList.add('transition-bg-dark');
            }
        }

        if (
            !triggerRef.current ||
            !document.startViewTransition ||
            window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ) {
            setTheme(newTheme);
            return;
        }

        await document.startViewTransition(() => {
            flushSync(() => {
                setTheme(newTheme);
            });
        }).ready;

        // Calculate animation properties
        const { height, left, top, width } = triggerRef.current.getBoundingClientRect();
        const x = left + width / 2;
        const y = top + height / 2;
        const right = window.innerWidth - left;
        const bottom = window.innerHeight - top;
        const maxRadius = Math.hypot(Math.max(left, right), Math.max(top, bottom));

        document.documentElement.animate(
            {
                clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${maxRadius}px at ${x}px ${y}px)`],
            },
            {
                duration: 700,
                easing: 'ease-in-out',
                pseudoElement: '::view-transition-new(root)',
            },
        ).onfinish = () => {
            document.documentElement.classList.remove('transition-bg-light', 'transition-bg-dark');
        };
    };

    const themes = [
        {
            icon: SunIcon,
            label: 'Light',
            name: 'light',
        },
        {
            icon: MoonIcon,
            label: 'Dark',
            name: 'dark',
        },
        {
            icon: GearSixIcon,
            label: 'System',
            name: 'system',
        },
    ];

    return (
        <div className="flex flex-col gap-2">
            {themes.map((themeItem) => {
                const ThemeIcon = themeItem.icon;

                return (
                    <Button
                        key={themeItem.name}
                        ref={themeItem.name === ThemeState ? triggerRef : null}
                        className="flex w-full items-center justify-start gap-3"
                        color={themeItem.name === ThemeState ? 'primary' : 'secondary'}
                        size="lg"
                        variant={themeItem.name === ThemeState ? 'solid' : 'soft'}
                        onClick={() => toggleTheme(themeItem.name)}
                    >
                        <ThemeIcon className="size-5" color="currentColor" weight="duotone" />
                        {themeItem.label}
                    </Button>
                );
            })}
        </div>
    );
}
