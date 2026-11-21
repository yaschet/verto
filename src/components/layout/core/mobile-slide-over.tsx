/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import type { Icon } from '@phosphor-icons/react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import {
    GearSixIcon,
    InvoiceIcon,
    MoonIcon,
    SignInIcon,
    SignOutIcon,
    SunIcon,
    UserCircleDashedIcon,
    UsersIcon,
    XIcon,
} from '@phosphor-icons/react';
import { useMutation } from '@tanstack/react-query';
import { useTheme } from 'next-themes';
import { Fragment, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { signOut } from '@actions/auth/sign-out';
import { DynamicSlideoverLink } from '@components/layout/core/dynamic-link';
import { navLinks } from '@components/layout/navbar';
import { Button } from '@components/ui/button';
import Spinner from '@components/ui/spinner';
import { useUserData } from '@hooks/queries/auth/use-user-data';
import type { ApiErrorType } from '@/types/rest/errors';

export default function MobileSlideOver({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    return (
        <Transition as={Fragment} show={isOpen}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <TransitionChild
                    as={Fragment}
                    enter="ease-in-out duration-500"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-500"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="bg-surface-500/75 dark:bg-surface-950/75 fixed inset-0 size-full max-h-screen max-w-full backdrop-blur transition-opacity dark:backdrop-blur" />
                </TransitionChild>

                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                            <TransitionChild
                                as={Fragment}
                                enter="transform transition ease-in-out duration-500 sm:duration-700"
                                enterFrom="translate-x-full"
                                enterTo="translate-x-0"
                                leave="transform transition ease-in-out duration-500 sm:duration-700"
                                leaveFrom="translate-x-0"
                                leaveTo="translate-x-full"
                            >
                                <DialogPanel className="pointer-events-auto relative w-screen max-w-md">
                                    <div className="border-l-border bg-surface-0 flex h-full flex-col overflow-y-scroll border-l">
                                        <div className="flex h-auto w-full items-center justify-between gap-4 p-4 sm:px-6">
                                            <DialogTitle className="text-surface-600 dark:text-surface-500 text-base leading-6 font-semibold">
                                                Menu
                                            </DialogTitle>
                                            <Button
                                                showTooltip
                                                color="primary"
                                                size="icon"
                                                tooltipContent="Close Menu"
                                                type="button"
                                                variant="soft"
                                                onClick={onClose}
                                            >
                                                <XIcon
                                                    className="size-5"
                                                    color="currentColor"
                                                    weight="regular"
                                                />
                                            </Button>
                                        </div>
                                        <div className="relative mt-6 flex flex-1 flex-col items-start justify-start gap-10 p-4 text-start sm:px-6">
                                            {/* Navigation Content - Pages & CTAs */}

                                            {/* Pages */}
                                            <div className="relative flex h-auto w-full flex-col gap-2">
                                                <p className="text-surface-600 dark:text-surface-300 py-2 text-sm font-semibold">
                                                    Pages
                                                </p>
                                                {navLinks.map((link, index) => {
                                                    const LeadingIcon: Icon | null = link.icon ?? null;

                                                    return (
                                                        <DynamicSlideoverLink
                                                            key={index}
                                                            href={link.href}
                                                            icon={
                                                                LeadingIcon && (
                                                                    <LeadingIcon
                                                                        aria-hidden="true"
                                                                        className="size-5"
                                                                    />
                                                                )
                                                            }
                                                            title={link.title}
                                                            onClick={onClose}
                                                        />
                                                    );
                                                })}
                                            </div>

                                            {/* CTAs */}
                                            <div className="relative flex h-auto w-full flex-col gap-2">
                                                <p className="text-surface-600 dark:text-surface-300 py-2 text-sm font-semibold">
                                                    Account
                                                </p>
                                                <UserMenu onClose={onClose} />
                                            </div>

                                            {/* Theme Changer */}
                                            <div className="relative flex h-auto w-full flex-col gap-2">
                                                <p className="text-surface-600 dark:text-surface-300 py-2 text-sm font-semibold">
                                                    Theme
                                                </p>

                                                <ThemeMenu />
                                            </div>
                                        </div>
                                    </div>
                                </DialogPanel>
                            </TransitionChild>
                        </div>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

function ThemeMenu() {
    const { setTheme, theme } = useTheme();
    const [ThemeState, setThemeState] = useState<string>('');

    useEffect(() => {
        if (theme === 'light') {
            setThemeState('light');
        } else if (theme === 'dark') {
            setThemeState('dark');
        } else if (theme === 'system') {
            setThemeState('system');
        }
    }, [theme]);

    function ThemeButton({
        icon,
        label,
        themeName,
    }: {
        themeName: string;
        icon: React.ReactNode;
        label: string;
    }) {
        return (
            <Button
                className="w-full justify-start"
                color={ThemeState === themeName ? 'primary' : 'secondary'}
                shape="pill"
                size="lg"
                type="button"
                variant={ThemeState === themeName ? 'solid' : 'plain'}
                onClick={() => {
                    setTheme(themeName);
                }}
            >
                {icon}
                {label}
            </Button>
        );
    }

    return (
        <Fragment>
            <ThemeButton
                icon={<SunIcon className="size-5" color="currentColor" weight="duotone" />}
                label="Light"
                themeName="light"
            />

            <ThemeButton
                icon={<MoonIcon className="size-5" color="currentColor" weight="duotone" />}
                label="Dark"
                themeName="dark"
            />

            <ThemeButton
                icon={<GearSixIcon className="size-5" color="currentColor" weight="duotone" />}
                label="System"
                themeName="system"
            />
        </Fragment>
    );
}

function UserMenu({ onClose }: { onClose: () => void }) {
    const { data: userData } = useUserData();
    const { user } = userData ?? {};

    const { isPending, mutate } = useMutation({
        mutationFn: async () => {
            const result = await signOut();

            if (result.error) {
                throw result;
            }

            return result;
        },
        onError: (error: (Error & Partial<ApiErrorType>) | ApiErrorType) => {
            toast.error(error.title ?? error.message ?? 'Unable to sign out.', {
                description: error.description ?? 'Please try again.',
                id: 'sign-out-error',
            });
        },
        onSuccess: () => {
            onClose();
            toast.success('Successfully signed out.', {
                description: 'You have been signed out of your account.',
                id: 'sign-out-success',
            });
        },
    });

    return (
        <div className="relative flex h-auto w-full flex-col gap-2">
            {user?.id && (
                <Fragment>
                    <DynamicSlideoverLink
                        href="/account"
                        icon={
                            <UserCircleDashedIcon
                                aria-hidden="true"
                                className="size-5"
                                color="currentColor"
                                weight="duotone"
                            />
                        }
                        title="Account"
                        onClick={onClose}
                    />
                    <DynamicSlideoverLink
                        href="/account/billing"
                        icon={
                            <InvoiceIcon
                                aria-hidden="true"
                                className="size-5"
                                color="currentColor"
                                weight="duotone"
                            />
                        }
                        title="Billing"
                        onClick={onClose}
                    />
                    <DynamicSlideoverLink
                        href="/account/settings"
                        icon={
                            <GearSixIcon
                                aria-hidden="true"
                                className="size-5"
                                color="currentColor"
                                weight="duotone"
                            />
                        }
                        title="Settings"
                        onClick={onClose}
                    />
                    <DynamicSlideoverLink
                        isSignOut
                        href=""
                        icon={
                            isPending ? (
                                <Spinner aria-hidden="true" className="size-5" color="currentColor" />
                            ) : (
                                <SignOutIcon
                                    aria-hidden="true"
                                    className="size-5"
                                    color="currentColor"
                                    weight="duotone"
                                />
                            )
                        }
                        title="Sign Out"
                        onClick={() => {
                            mutate();
                        }}
                    />
                </Fragment>
            )}

            {!user?.id && (
                <Fragment>
                    <DynamicSlideoverLink
                        href="/auth/sign-in"
                        icon={
                            <SignInIcon
                                aria-hidden="true"
                                className="size-5"
                                color="currentColor"
                                weight="duotone"
                            />
                        }
                        title="Sign In"
                        onClick={onClose}
                    />
                    <DynamicSlideoverLink
                        href="/auth/sign-up"
                        icon={
                            <UsersIcon
                                aria-hidden="true"
                                className="size-5"
                                color="currentColor"
                                weight="duotone"
                            />
                        }
                        title="Sign Up"
                        onClick={onClose}
                    />
                </Fragment>
            )}
        </div>
    );
}
