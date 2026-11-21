/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { CoinsIcon, WalletIcon } from '@phosphor-icons/react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@components/ui/dialog';
import { AdjustCreditsForm } from '@/src/app/(protected)/admin/users/forms/adjust-credits-form';
import type { AdminUserRow } from '@schemas/admin-user-schemas';
import type { QueryClient } from '@tanstack/react-query';
import type { Dispatch, SetStateAction, JSX } from 'react';

export default function AdjustCreditsModal({
    isModalOpen,
    queryClient,
    selectedUser,
    setIsModalOpen,
    setSelectedUser,
    currentBalance,
}: {
    isModalOpen: boolean;
    selectedUser: AdminUserRow | null;
    setSelectedUser: Dispatch<SetStateAction<AdminUserRow | null>>;
    setIsModalOpen: Dispatch<SetStateAction<boolean>>;
    queryClient: QueryClient;
    currentBalance?: number;
}): JSX.Element {
    const handleClose = () => {
        setIsModalOpen(false);
    };

    return (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-lg">
                {/* Custom Header Layout - matches MFA dialog pattern */}
                <DialogHeader className="flex w-full flex-row items-center gap-4 space-y-0">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400">
                        <CoinsIcon className="size-6" weight="duotone" />
                    </div>
                    <div className="flex flex-1 flex-col gap-1">
                        <DialogTitle>Adjust Credits</DialogTitle>
                        <DialogDescription>
                            Modify credit balance for{' '}
                            {selectedUser?.full_name || selectedUser?.email || 'user'}
                        </DialogDescription>
                    </div>
                </DialogHeader>

                {/* Current Balance Display - Simplified */}
                <div className="mt-4 flex items-center gap-3 rounded-2xl bg-surface-100 p-4 dark:bg-surface-900">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-200 dark:bg-surface-800">
                        <WalletIcon
                            className="size-5 text-surface-600 dark:text-surface-400"
                            weight="duotone"
                        />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-medium text-surface-500">Current Balance</span>
                        <span className="text-xl font-bold text-surface-900 dark:text-surface-100">
                            {(currentBalance ?? 0).toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* Form */}
                <AdjustCreditsForm
                    selectedUser={selectedUser}
                    currentBalance={currentBalance ?? 0}
                    setIsModalOpen={setIsModalOpen}
                    onClose={handleClose}
                    onCreditsAdjusted={() => {
                        setSelectedUser(null);
                        queryClient
                            .invalidateQueries({
                                queryKey: ['admin', 'users'],
                            })
                            .then((r) => r);
                        queryClient
                            .invalidateQueries({
                                queryKey: ['admin', 'user'],
                            })
                            .then((r) => r);
                    }}
                />
            </DialogContent>
        </Dialog>
    );
}
