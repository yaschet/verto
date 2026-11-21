/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import type { ApiErrorType } from '@/types/rest/errors';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Fragment, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { signOut } from '@actions/auth/sign-out';
import { SidebarButton } from '@components/layout/sidebar-button';
import { Avatar, AvatarFallback, AvatarImage } from '@components/ui/avatar';
import { Button, type ButtonProps } from '@components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from '@components/ui/dropdown-menu';
import { Skeleton } from '@components/ui/skeleton';
import Spinner from '@components/ui/spinner';
import { NAVIGATION_SHORTCUTS } from '@constants/navigation';
import { useUserData } from '@hooks/queries/auth/use-user-data';
import { cn, getOS } from '@library/utils';
import { getQueryClient } from '@queries/tanstack/query-client';

type UserMenuVariant = 'compact' | 'full' | 'mobile';

type UserMenuProps = {
    variant?: UserMenuVariant;
    isAdmin?: boolean;
    isCollapsed?: boolean;
    className?: string;
    size?: ButtonProps['size'];
};

export function UserMenu({
    className,
    isAdmin = false,
    isCollapsed = false,
    variant = 'compact',
    size = 'icon-lg',
}: UserMenuProps) {
    const router = useRouter();
    const queryClient = getQueryClient();
    const [open, setOpen] = useState(false);
    const { data, isLoading } = useUserData();
    const { profile } = data ?? {};

    const [os, setOS] = useState<string>('Other');

    useEffect(() => {
        setOS(getOS());
    }, []);

    const { isPending: isSigningOut, mutate: mutateSignOut } = useMutation({
        mutationFn: async () => {
            const result = await signOut();

            if (result.error) {
                throw result;
            }

            return result;
        },
        onError: (error: Error & Partial<ApiErrorType>) => {
            toast.error(error?.title ?? error?.message ?? 'Unable to sign out.', {
                description: error?.description ?? 'Please try again.',
                id: 'sign-out-error',
            });
        },
        onSuccess: () => {
            toast.success('Successfully signed out.', {
                description: 'You have been signed out of your account.',
                id: 'sign-out-success',
            });
            router.push('/');
        },
        onSettled: async () => {
            queryClient.clear();
            await queryClient.resetQueries().then((r) => r);
        },
    });

    const avatarContent = (
        <Avatar className={variant === 'full' ? 'size-8 rounded-xl' : 'size-10'}>
            <AvatarImage
                alt={profile?.full_name ?? profile?.email ?? ''}
                className="object-cover"
                src={profile?.avatar_url ?? ''}
            />

            <AvatarFallback name={profile?.full_name} />
        </Avatar>
    );

    const trigger = {
        compact: (
            <Button
                asChild
                className={cn('cursor-pointer overflow-hidden p-0', className)}
                color="secondary"
                size={size}
                variant="plain"
            >
                {isLoading ? (
                    <Skeleton className="bg-surface-2 dark:bg-surface-2 aspect-square size-10 cursor-pointer rounded-xl" />
                ) : (
                    avatarContent
                )}
            </Button>
        ),
        full: !isLoading ? (
            <SidebarButton
                color="secondary"
                icon={avatarContent}
                isCollapsed={isCollapsed}
                label={
                    !isCollapsed ? (
                        <div className="flex max-w-32 flex-col flex-wrap items-start justify-center">
                            <p className="truncate-ellipsis truncate text-sm font-bold text-ellipsis">
                                {profile?.full_name}
                            </p>
                            <p className="text-muted truncate-ellipsis truncate text-xs leading-none text-ellipsis">
                                {profile?.email}
                            </p>
                        </div>
                    ) : undefined
                }
                variant="plain"
            />
        ) : (
            <SidebarButton
                color="secondary"
                icon={<Skeleton className="bg-surface-2 dark:bg-surface-2 size-6 rounded-full" />}
                isCollapsed={isCollapsed}
                variant="plain"
            />
        ),
        mobile: (
            <Button
                asChild
                className={cn('cursor-pointer overflow-hidden p-0', className)}
                color="secondary"
                size={size}
                variant="plain"
            >
                {isLoading ? (
                    <Skeleton className="bg-surface-2 dark:bg-surface-2 aspect-square size-10 cursor-pointer rounded-xl" />
                ) : (
                    avatarContent
                )}
            </Button>
        ),
    };

    const dropdownSideOffset = {
        compact: 8,
        full: 16,
        mobile: 8,
    };

    const dropdownSide = {
        compact: 'bottom' as const,
        full: 'right' as const,
        mobile: 'bottom' as const,
    };

    const dropdownAlign = {
        compact: 'end' as const,
        full: 'end' as const,
        mobile: 'end' as const,
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild className={variant === 'full' ? 'w-full' : undefined}>
                {variant === 'full' ? <div className="w-full">{trigger[variant]}</div> : trigger[variant]}
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align={dropdownAlign[variant]}
                className="w-56"
                side={dropdownSide[variant]}
                sideOffset={dropdownSideOffset[variant]}
            >
                <DropdownMenuLabel className="font-normal">
                    {!isLoading ? (
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm leading-none font-medium">
                                {profile?.full_name}
                                {isAdmin && (
                                    <>
                                        {' '}
                                        <span className="text-accent-500 text-xs leading-none font-bold uppercase">
                                            Admin
                                        </span>
                                    </>
                                )}
                            </p>

                            <p className="text-muted text-xs leading-none">{profile?.email}</p>
                        </div>
                    ) : (
                        <div className="flex flex-col space-y-1">
                            <Skeleton className="h-4 w-20 rounded-md" />
                            <Skeleton className="h-3 w-24 rounded-md" />
                        </div>
                    )}
                </DropdownMenuLabel>
                {!isAdmin && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <Link href="/app/translations/new">
                                <DropdownMenuItem className="text-accent-500 focus:bg-accent-500 focus:text-accent-50 dark:focus:bg-accent-500 dark:focus:text-accent-50 font-bold focus:font-bold">
                                    Translate
                                    <DropdownMenuShortcut>
                                        {os === 'macOS'
                                            ? NAVIGATION_SHORTCUTS.translate.mac
                                            : NAVIGATION_SHORTCUTS.translate.win}
                                    </DropdownMenuShortcut>
                                </DropdownMenuItem>
                            </Link>
                        </DropdownMenuGroup>
                    </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <Link href="/account">
                        <DropdownMenuItem>Account</DropdownMenuItem>
                    </Link>
                    {!isAdmin && (
                        <Link href="/account/billing">
                            <DropdownMenuItem>Billing</DropdownMenuItem>
                        </Link>
                    )}
                    {!isAdmin && (
                        <Link href="/account/settings">
                            <DropdownMenuItem>
                                Settings
                                <DropdownMenuShortcut>
                                    {os === 'macOS'
                                        ? NAVIGATION_SHORTCUTS.settings.mac
                                        : NAVIGATION_SHORTCUTS.settings.win}
                                </DropdownMenuShortcut>
                            </DropdownMenuItem>
                        </Link>
                    )}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="text-destructive-500 focus:bg-destructive-500 focus:text-destructive-50 dark:focus:bg-destructive-500 dark:focus:text-destructive-50 font-bold focus:font-bold"
                    onClick={() => {
                        mutateSignOut();
                    }}
                >
                    {isSigningOut ? (
                        <Fragment>
                            <Spinner className="mr-2 size-5" color="currentColor" />
                            <span>Signing Out</span>
                        </Fragment>
                    ) : (
                        'Sign Out'
                    )}
                    <DropdownMenuShortcut>
                        {os === 'macOS' ? NAVIGATION_SHORTCUTS.signOut.mac : NAVIGATION_SHORTCUTS.signOut.win}
                    </DropdownMenuShortcut>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
