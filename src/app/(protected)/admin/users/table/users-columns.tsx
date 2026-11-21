/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import {
    KeyIcon,
    PencilSimpleIcon,
    TrashIcon,
    CoinsIcon,
    LockKeyIcon,
    LockKeyOpenIcon,
    ShieldCheckIcon,
    DotsThreeIcon,
    ShieldSlashIcon,
    CheckCircleIcon,
    XCircleIcon,
    SealCheckIcon,
    SealWarningIcon,
    CoinIcon,
} from '@phosphor-icons/react';
import { capitalCase } from 'change-case';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { TableHeader } from '@/src/app/(protected)/app/components/common';
import { generateGravatarUrl } from '@/src/library/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@components/ui/avatar';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Checkbox } from '@components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@components/ui/dropdown-menu';
import type { AdminUserRow } from '@/src/schemas/admin-user-schemas';
import type { ColumnDef } from '@tanstack/react-table';

// Define the meta type for the table actions
export type UsersTableMetaType = {
    triggerUserUpdate?: (user: AdminUserRow) => void;
    triggerUserSuspension?: (user: AdminUserRow) => void;
    triggerUserReactivation?: (user: AdminUserRow) => void;
    triggerPermanentUserDeletion?: (user: AdminUserRow) => void;
    triggerAdjustCredits?: (user: AdminUserRow) => void;
    triggerResetPassword?: (user: AdminUserRow) => void;
    triggerManageMFA?: (user: AdminUserRow) => void;
};

function CreditsCell({ row }: { row: { original: AdminUserRow } }) {
    const credits = row.original.credits ?? 0;
    return (
        <Badge variant="soft" color="warning" className="gap-1.5 pl-1.5 font-mono">
            <CoinIcon className="size-3.5" weight="fill" />
            <span className="lining-nums">{credits.toLocaleString()}</span>
        </Badge>
    );
}

function SecurityCell({ row }: { row: { original: AdminUserRow } }) {
    const isMfaEnabled = row.original.mfa_enabled;
    const isEmailVerified = !!row.original.email;

    return (
        <div className="flex flex-col gap-1">
            {isEmailVerified ? (
                <div className="flex items-center gap-1.5 text-success-600 dark:text-success-400">
                    <CheckCircleIcon className="size-3.5" weight="fill" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Verified</span>
                </div>
            ) : (
                <div className="flex items-center gap-1.5 text-destructive-600 dark:text-destructive-400">
                    <XCircleIcon className="size-3.5" weight="fill" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Unverified</span>
                </div>
            )}

            {isMfaEnabled ? (
                <div className="flex items-center gap-1.5 text-primary-600 dark:text-primary-400">
                    <ShieldCheckIcon className="size-3.5" weight="fill" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">MFA On</span>
                </div>
            ) : (
                <div className="flex items-center gap-1.5 text-surface-400 dark:text-surface-500 opacity-60">
                    <ShieldSlashIcon className="size-3.5" weight="duotone" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">MFA Off</span>
                </div>
            )}
        </div>
    );
}

function LastActiveCell({ row }: { row: { original: AdminUserRow } }) {
    const lastActive = row.original.last_active_at;

    if (!lastActive) {
        return <span className="text-xs text-surface-400 font-medium">Never Active</span>;
    }

    const timeAgo = formatDistanceToNow(new Date(lastActive), { addSuffix: true });

    // Check if it's very recent (e.g. less than a minute) to show "Online Now"
    const isOnlineNow = new Date().getTime() - new Date(lastActive).getTime() < 60000; // 1 min

    if (isOnlineNow) {
        return <span className="text-xs font-bold text-success-600 dark:text-success-400">Online Now</span>;
    }

    return (
        <span className="text-xs text-surface-600 dark:text-surface-400 font-medium whitespace-nowrap">
            {timeAgo}
        </span>
    );
}

function ProfileStatusCell({ row }: { row: { original: AdminUserRow } }) {
    const isComplete = row.original.is_profile_complete;

    return (
        <div
            className={
                isComplete
                    ? 'text-success-600 dark:text-success-400'
                    : 'text-warning-600 dark:text-warning-400'
            }
        >
            {isComplete ? (
                <div className="flex items-center gap-1.5" title="Profile Complete">
                    <SealCheckIcon className="size-4" weight="fill" />
                    <span className="hidden text-xs font-semibold lg:inline-block">Complete</span>
                </div>
            ) : (
                <div className="flex items-center gap-1.5" title="Profile Incomplete">
                    <SealWarningIcon className="size-4" weight="fill" />
                    <span className="hidden text-xs font-semibold lg:inline-block">Incomplete</span>
                </div>
            )}
        </div>
    );
}

export const USER_COLUMNS: ColumnDef<AdminUserRow>[] = [
    {
        accessorFn: (row) => String(row.id),
        accessorKey: 'select',
        cell: ({ row }) => (
            <Checkbox
                aria-label="Select row"
                aria-readonly={row.getIsSelected() && !row.getCanSelect()}
                checked={row.getIsSelected()}
                color="primary"
                isDisabled={!row.getCanSelect()}
                isSelected={row.getIsSelected()}
                required={false}
                onValueChange={(value) => row.toggleSelected(!!value)}
            />
        ),
        enableColumnFilter: true,
        enableHiding: false,
        enableSorting: false,
        header: ({ table }) => (
            <Checkbox
                aria-label="Select all"
                checked={table.getIsAllPageRowsSelected()}
                color="primary"
                defaultChecked={table.getIsAllPageRowsSelected()}
                indeterminate={table.getIsSomePageRowsSelected()}
                onValueChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            />
        ),
        id: 'select',
    },
    {
        accessorFn: (row) => String(row.full_name),
        accessorKey: 'full_name',
        cell: ({ row }) => {
            let userName: string = row.original.full_name ?? '';
            userName = capitalCase(userName);
            const userEmail: string = row.original.email ?? '';
            const userAvatar: string = generateGravatarUrl(userEmail);

            return (
                <Link href={`/admin/users/${row.original.id}`} className="block h-full w-auto">
                    <div className="flex h-full w-auto items-center gap-3 hover:opacity-80 transition-opacity">
                        <Avatar className="aspect-square h-auto w-10">
                            <AvatarImage alt={userName} src={userAvatar} />
                            <AvatarFallback name={userName} />
                        </Avatar>
                        <div className="flex w-auto flex-col items-start justify-start gap-1">
                            <span className="text-sm font-bold whitespace-nowrap text-current">
                                {userName}
                            </span>
                            <span className="text-surface-400 text-xs whitespace-nowrap">{userEmail}</span>
                        </div>
                    </div>
                </Link>
            );
        },
        enableColumnFilter: true,
        header: ({ column }) => {
            return <TableHeader column={column}>User</TableHeader>;
        },
        id: 'full_name',
    },
    {
        accessorKey: 'role',
        cell: ({ row }) => {
            const role = row.original.role ?? 'USER';
            const color = role === 'ADMIN' ? 'primary' : 'secondary';
            return (
                <Badge className="text-xs whitespace-nowrap" color={color} variant="soft">
                    <b>{role}</b>
                </Badge>
            );
        },
        enableColumnFilter: true,
        header: ({ column }) => {
            return <TableHeader column={column}>Role</TableHeader>;
        },
        id: 'role',
    },
    {
        accessorKey: 'status',
        cell: ({ row }) => {
            const accountStatus = row.original.account_status;
            const connectionStatus = row.original.status ?? 'OFFLINE';

            let displayStatus = connectionStatus;
            let color: 'success' | 'secondary' | 'destructive' | 'warning' = 'secondary';

            if (accountStatus === 'SUSPENDED') {
                displayStatus = 'SUSPENDED';
                color = 'destructive';
            } else if (connectionStatus === 'ONLINE') {
                color = 'success';
            }

            return (
                <Badge className="text-xs whitespace-nowrap" color={color} variant="soft">
                    <b>{displayStatus}</b>
                </Badge>
            );
        },
        enableColumnFilter: true,
        header: ({ column }) => {
            return <TableHeader column={column}>Status</TableHeader>;
        },
        id: 'status',
    },
    {
        accessorKey: 'credits',
        cell: CreditsCell,
        header: ({ column }) => <TableHeader column={column}>Credits</TableHeader>,
        id: 'credits',
    },
    {
        accessorKey: 'security',
        cell: SecurityCell,
        header: () => <span className="text-xs font-semibold text-surface-500 uppercase">Security</span>,
        id: 'security',
        // meta: {
        //     className: "w-[120px]"
        // }
    },
    {
        accessorKey: 'is_profile_complete',
        cell: ProfileStatusCell,
        header: () => (
            <span className="hidden text-xs font-semibold text-surface-500 uppercase lg:block">Profile</span>
        ),
        id: 'is_profile_complete',
        size: 100,
    },
    {
        accessorKey: 'last_active_at',
        cell: LastActiveCell,
        header: ({ column }) => <TableHeader column={column}>Last Active</TableHeader>,
        id: 'last_active_at',
        size: 140,
    },
    {
        accessorKey: 'created_at',
        cell: ({ row }) => {
            const createdDate: string = row.original.created_at ?? new Date().toISOString();
            const createdDateFormatted: string = new Date(createdDate).toLocaleString('en-US', {
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                month: 'short',
                year: 'numeric',
            });

            return <span className="text-surface-400 text-sm whitespace-nowrap">{createdDateFormatted}</span>;
        },
        enableColumnFilter: true,
        header: ({ column }) => {
            return <TableHeader column={column}>Joined</TableHeader>;
        },
        id: 'created_at',
    },
    {
        accessorKey: 'actions',
        cell: ({ row, table }) => {
            const accountStatus = row.original.account_status;
            const meta = table?.options?.meta as UsersTableMetaType;

            return (
                <div className="flex w-full flex-row items-center justify-end gap-2">
                    <Button
                        aria-label="Edit User"
                        color="primary"
                        size="icon-md"
                        tooltipContent="Edit User"
                        type="button"
                        variant="soft"
                        onClick={() => meta?.triggerUserUpdate?.(row.original)}
                    >
                        <PencilSimpleIcon className="size-5" color="currentColor" weight="regular" />
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button aria-label="More Actions" color="primary" size="icon-md" variant="soft">
                                <DotsThreeIcon className="size-5" color="currentColor" weight="bold" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64">
                            <DropdownMenuGroup>
                                <DropdownMenuItem
                                    className="cursor-pointer"
                                    onClick={() => meta?.triggerAdjustCredits?.(row.original)}
                                >
                                    <div className="flex w-full items-start gap-3 py-1">
                                        <CoinsIcon
                                            className="mt-0.5 size-5 shrink-0 opacity-70"
                                            color="currentColor"
                                            weight="duotone"
                                        />
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-semibold">Adjust Credits</span>
                                            <span className="text-xs opacity-60">Manage user balance</span>
                                        </div>
                                    </div>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="cursor-pointer"
                                    onClick={() => meta?.triggerManageMFA?.(row.original)}
                                >
                                    <div className="flex w-full items-start gap-3 py-1">
                                        <ShieldCheckIcon
                                            className="mt-0.5 size-5 shrink-0 opacity-70"
                                            color="currentColor"
                                            weight="duotone"
                                        />
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-semibold">Manage MFA</span>
                                            <span className="text-xs opacity-60">
                                                Two-factor authentication
                                            </span>
                                        </div>
                                    </div>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="cursor-pointer"
                                    onClick={() => meta?.triggerResetPassword?.(row.original)}
                                >
                                    <div className="flex w-full items-start gap-3 py-1">
                                        <KeyIcon
                                            className="mt-0.5 size-5 shrink-0 opacity-70"
                                            color="currentColor"
                                            weight="duotone"
                                        />
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-semibold">Reset Password</span>
                                            <span className="text-xs opacity-60">
                                                Send password reset email
                                            </span>
                                        </div>
                                    </div>
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                {accountStatus === 'SUSPENDED' ? (
                                    <DropdownMenuItem
                                        className="cursor-pointer text-success-600 dark:text-success-400 focus:bg-success-100 dark:focus:bg-success-900/40 focus:text-success-700 dark:focus:text-success-300"
                                        onClick={() => meta?.triggerUserReactivation?.(row.original)}
                                    >
                                        <div className="flex w-full items-start gap-3 py-1">
                                            <LockKeyOpenIcon
                                                className="mt-0.5 size-5 shrink-0"
                                                color="currentColor"
                                                weight="duotone"
                                            />
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-semibold">Reactivate Account</span>
                                                <span className="text-xs opacity-80">Restore access</span>
                                            </div>
                                        </div>
                                    </DropdownMenuItem>
                                ) : (
                                    <DropdownMenuItem
                                        className="cursor-pointer text-destructive-600 dark:text-destructive-400 focus:bg-destructive-100 dark:focus:bg-destructive-900/40 focus:text-destructive-700 dark:focus:text-destructive-300"
                                        onClick={() => meta?.triggerUserSuspension?.(row.original)}
                                    >
                                        <div className="flex w-full items-start gap-3 py-1">
                                            <LockKeyIcon
                                                className="mt-0.5 size-5 shrink-0"
                                                color="currentColor"
                                                weight="duotone"
                                            />
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-semibold">Suspend Account</span>
                                                <span className="text-xs opacity-80">
                                                    Temporarily disable access
                                                </span>
                                            </div>
                                        </div>
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                    className="cursor-pointer font-bold text-destructive-600 dark:text-destructive-400 focus:bg-destructive-600 focus:text-white dark:focus:bg-destructive-600 dark:focus:text-white"
                                    onClick={() => meta?.triggerPermanentUserDeletion?.(row.original)}
                                >
                                    <div className="flex w-full items-start gap-3 py-1">
                                        <TrashIcon
                                            className="mt-0.5 size-5 shrink-0"
                                            color="currentColor"
                                            weight="duotone"
                                        />
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-bold">Delete Permanently</span>
                                            <span className="text-xs opacity-80">Irreversible action</span>
                                        </div>
                                    </div>
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            );
        },
        enableColumnFilter: false,
        enableGlobalFilter: false,
        enableSorting: false,
        header: () => (
            <div className="flex flex-row items-center justify-end">
                <TableHeader column={undefined}>Actions</TableHeader>
            </div>
        ),
        id: 'actions',
        size: 160,
    },
];
