/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import {
    CoinsIcon,
    PencilSimpleIcon,
    KeyIcon,
    LockKeyIcon,
    LockKeyOpenIcon,
    ShieldCheckIcon,
    TrashIcon,
    DotsThreeIcon,
} from '@phosphor-icons/react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@components/ui/dropdown-menu';
import { useState } from 'react';
import AdjustCreditsModal from '@/src/app/(protected)/admin/users/modals/adjust-credits-modal';
import SuspendUserModal from '@/src/app/(protected)/admin/users/modals/suspend-user-modal';
import ReactivateUserModal from '@/src/app/(protected)/admin/users/modals/reactivate-user-modal';
import ResetPasswordModal from '@/src/app/(protected)/admin/users/modals/reset-password-modal';
import DeleteUserModal from '@/src/app/(protected)/admin/users/modals/delete-user-modal';
import UpdateUserSheet from '@/src/app/(protected)/admin/users/sheets/update-user-sheet';
import { ManageMfaDialog } from './manage-mfa-dialog';
import type { AdminUserDetails } from '@/src/actions/admin/users/get-user';
import type { AdminUserRow } from '@/src/schemas/admin-user-schemas';
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { DefaultCard } from '@/src/components/ui/card';
import { Separator } from '@/src/components/ui/separator';
import { getQueryClient } from '@/src/queries/tanstack/query-client';
import { generateGravatarUrl } from '@/src/library/utils';
import { format } from 'date-fns';

interface UserProfileHeaderProps {
    user: AdminUserDetails;
}

export function UserProfileHeader({ user }: UserProfileHeaderProps) {
    const queryClient = getQueryClient();
    const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null);

    // Modals & Sheets State
    const [isUpdateSheetOpen, setIsUpdateSheetOpen] = useState<boolean>(false);
    const [isDeletionModalOpen, setIsDeletionModalOpen] = useState<boolean>(false);
    const [isAdjustCreditsModalOpen, setIsAdjustCreditsModalOpen] = useState<boolean>(false);
    const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState<boolean>(false);
    const [isReactivationModalOpen, setIsReactivationModalOpen] = useState<boolean>(false);
    const [isPermanentDeletionModalOpen, setIsPermanentDeletionModalOpen] = useState<boolean>(false);
    const [isMfaDialogOpen, setIsMfaDialogOpen] = useState<boolean>(false);

    const triggerUserUpdate = () => {
        setSelectedUser(user);
        setIsUpdateSheetOpen(true);
    };

    const triggerUserSuspension = () => {
        setSelectedUser(user);
        setIsDeletionModalOpen(true);
    };

    const triggerPermanentDeleteUser = () => {
        setSelectedUser(user);
        setIsPermanentDeletionModalOpen(true);
    };

    const triggerAdjustCredits = () => {
        setSelectedUser(user);
        setIsAdjustCreditsModalOpen(true);
    };

    const triggerResetPassword = () => {
        setSelectedUser(user);
        setIsResetPasswordModalOpen(true);
    };

    const triggerUserReactivation = () => {
        setSelectedUser(user);
        setIsReactivationModalOpen(true);
    };

    const triggerManageMfa = () => {
        setIsMfaDialogOpen(true);
    };

    const statusColor =
        user.account_status === 'SUSPENDED'
            ? 'destructive'
            : user.status?.toUpperCase() === 'ONLINE'
              ? 'success'
              : 'warning';

    const roleColor = user.role === 'ADMIN' ? 'primary' : 'secondary';

    return (
        <DefaultCard className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="flex flex-row items-center gap-4">
                    <Avatar className="h-20 w-20 border-2 border-white shadow-sm dark:border-zinc-800">
                        <AvatarImage
                            alt={user.full_name ?? user.email}
                            src={user.avatar_url ?? generateGravatarUrl(user.email)}
                        />
                        <AvatarFallback className="text-xl font-bold" name={user.full_name || user.email} />
                    </Avatar>
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                            {user.full_name || 'No Name'}
                        </h1>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">{user.email}</p>
                        <div className="mt-1 flex flex-row gap-2">
                            <Badge variant="soft" color={roleColor} className="capitalize">
                                {user.role?.toLowerCase() ?? 'User'}
                            </Badge>
                            <Badge variant="soft" color={statusColor} className="capitalize">
                                {user.account_status === 'SUSPENDED'
                                    ? 'Suspended'
                                    : user.status?.toLowerCase() || 'Unknown'}
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button className="h-8" size="sm" variant="outlined" onClick={triggerUserUpdate}>
                        <PencilSimpleIcon className="h-4 w-4" />
                        Edit Profile
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="icon-sm" variant="outlined">
                                <DotsThreeIcon className="size-5" weight="bold" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64">
                            <DropdownMenuGroup>
                                <DropdownMenuItem className="cursor-pointer" onClick={triggerAdjustCredits}>
                                    <div className="flex w-full items-start gap-3 py-1">
                                        <CoinsIcon
                                            className="mt-0.5 size-5 shrink-0 opacity-70"
                                            weight="duotone"
                                        />
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-semibold">Adjust Credits</span>
                                            <span className="text-xs opacity-60">Manage user balance</span>
                                        </div>
                                    </div>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer" onClick={triggerManageMfa}>
                                    <div className="flex w-full items-start gap-3 py-1">
                                        <ShieldCheckIcon
                                            className="mt-0.5 size-5 shrink-0 opacity-70"
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
                                <DropdownMenuItem className="cursor-pointer" onClick={triggerResetPassword}>
                                    <div className="flex w-full items-start gap-3 py-1">
                                        <KeyIcon
                                            className="mt-0.5 size-5 shrink-0 opacity-70"
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

                                {user.account_status === 'SUSPENDED' ? (
                                    <DropdownMenuItem
                                        className="cursor-pointer text-success-600 dark:text-success-400 focus:bg-success-100 dark:focus:bg-success-900/40 focus:text-success-700 dark:focus:text-success-300"
                                        onClick={triggerUserReactivation}
                                    >
                                        <div className="flex w-full items-start gap-3 py-1">
                                            <LockKeyOpenIcon
                                                className="mt-0.5 size-5 shrink-0"
                                                weight="duotone"
                                                color="currentColor"
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
                                        onClick={triggerUserSuspension}
                                    >
                                        <div className="flex w-full items-start gap-3 py-1">
                                            <LockKeyIcon
                                                className="mt-0.5 size-5 shrink-0"
                                                weight="duotone"
                                                color="currentColor"
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
                                    onClick={triggerPermanentDeleteUser}
                                >
                                    <div className="flex w-full items-start gap-3 py-1">
                                        <TrashIcon
                                            className="mt-0.5 size-5 shrink-0"
                                            weight="duotone"
                                            color="currentColor"
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
            </div>

            <Separator />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-zinc-500 uppercase dark:text-zinc-400">
                        Credits Balance
                    </span>
                    <span className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                        {user.credits.toLocaleString()}
                    </span>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-zinc-500 uppercase dark:text-zinc-400">
                        Last Active
                    </span>
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {user.last_active_at
                            ? format(new Date(user.last_active_at), 'MMM d, yyyy h:mm a')
                            : 'Never'}
                    </span>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-zinc-500 uppercase dark:text-zinc-400">
                        Joined On
                    </span>
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {user.created_at ? format(new Date(user.created_at), 'MMM d, yyyy') : 'Unknown'}
                    </span>
                </div>
            </div>

            {/* Modals */}
            <UpdateUserSheet
                isUpdateSheetOpen={isUpdateSheetOpen}
                queryClient={queryClient}
                selectedUser={selectedUser}
                setIsUpdateSheetOpen={setIsUpdateSheetOpen}
                setSelectedUser={setSelectedUser}
            />
            <SuspendUserModal
                isDeletionModalOpen={isDeletionModalOpen}
                queryClient={queryClient}
                selectedUser={selectedUser}
                setIsDeletionModalOpen={setIsDeletionModalOpen}
                setSelectedUser={setSelectedUser}
            />
            <AdjustCreditsModal
                isModalOpen={isAdjustCreditsModalOpen}
                queryClient={queryClient}
                selectedUser={selectedUser}
                setIsModalOpen={setIsAdjustCreditsModalOpen}
                setSelectedUser={setSelectedUser}
                currentBalance={user.credits}
            />
            <ResetPasswordModal
                isResetModalOpen={isResetPasswordModalOpen}
                queryClient={queryClient}
                selectedUser={selectedUser}
                setIsResetModalOpen={setIsResetPasswordModalOpen}
                setSelectedUser={setSelectedUser}
            />
            <ReactivateUserModal
                isReactivationModalOpen={isReactivationModalOpen}
                queryClient={queryClient}
                selectedUser={selectedUser}
                setIsReactivationModalOpen={setIsReactivationModalOpen}
                setSelectedUser={setSelectedUser}
            />
            <DeleteUserModal
                isDeletionModalOpen={isPermanentDeletionModalOpen}
                queryClient={queryClient}
                selectedUser={selectedUser}
                setIsDeletionModalOpen={setIsPermanentDeletionModalOpen}
                setSelectedUser={setSelectedUser}
            />
            <ManageMfaDialog
                open={isMfaDialogOpen}
                onOpenChange={setIsMfaDialogOpen}
                userId={user.id}
                userName={user.full_name || user.email}
            />
        </DefaultCard>
    );
}
