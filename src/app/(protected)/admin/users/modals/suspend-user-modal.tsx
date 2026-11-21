/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { LockKeyIcon, XIcon } from '@phosphor-icons/react';
import { useMutation } from '@tanstack/react-query';
import { type JSX } from 'react';
import { toast } from 'sonner';
import { titleCase } from 'title-case';
import { suspendUser } from '@/src/actions/admin/users/suspend-user';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/src/components/ui/alert-dialog';
import { Button } from '@components/ui/button';
import type { AdminUserRow } from '@schemas/admin-user-schemas';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';
import type { QueryClient } from '@tanstack/react-query';
import type { Dispatch, SetStateAction } from 'react';

export default function SuspendUserModal({
    isDeletionModalOpen,
    queryClient,
    selectedUser,
    setIsDeletionModalOpen,
    setSelectedUser,
}: {
    isDeletionModalOpen: boolean;
    selectedUser: AdminUserRow | null;
    setSelectedUser: Dispatch<SetStateAction<AdminUserRow | null>>;
    setIsDeletionModalOpen: Dispatch<SetStateAction<boolean>>;
    queryClient: QueryClient;
}): JSX.Element {
    const { isPending, mutateAsync } = useMutation({
        mutationFn: async ({ id }: { id: string }) => {
            const response = await suspendUser({
                id: id ?? '',
            });

            if (response?.error || !response) {
                throw response;
            }

            return response;
        },
        onError: (error: (Error & Partial<ApiErrorType>) | ApiErrorType) => {
            toast.error(error.title ?? error.message ?? 'Error', {
                description: error.description ?? 'An error occurred while suspending the user account.',
            });
        },
        onSuccess: async (data: ApiResponseOrError) => {
            setIsDeletionModalOpen(false);
            setSelectedUser(null);
            await queryClient.invalidateQueries({
                queryKey: ['admin', 'users'],
            });
            toast.success(data.message ?? 'Account Suspended', {
                description: data.description ?? 'The user account has been successfully suspended.',
            });
        },
        retry: 3,
        retryDelay: (attempt) => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000),
    });

    const handleDeleteUser = async (id: string) => {
        await mutateAsync({ id });
    };

    return (
        <AlertDialog open={isDeletionModalOpen} onOpenChange={setIsDeletionModalOpen}>
            <AlertDialogContent>
                <AlertDialogHeader className="text-start text-lg font-semibold">
                    <AlertDialogTitle>{titleCase('Confirm Account Suspension')}</AlertDialogTitle>
                </AlertDialogHeader>

                <div className="text-foreground dark:text-foreground-500 text-start text-sm">
                    Before proceeding with suspending the account, please consider:
                    <ul
                        className="text-surface-500 marker:text-destructive list-disc space-y-1 px-4 py-2 text-start text-sm marker:font-bold"
                        role="list"
                    >
                        <li>The user will be marked as SUSPENDED.</li>
                        <li>They will lose access to the platform immediately.</li>
                        <li>This action can be reversed by an admin.</li>
                    </ul>
                </div>

                <AlertDialogFooter>
                    <Button color="default" variant="soft" onClick={() => setIsDeletionModalOpen(false)}>
                        <XIcon className="size-4" color="currentColor" weight="duotone" />
                        Cancel
                    </Button>
                    {!isPending && (
                        <Button
                            color="destructive"
                            variant="solid"
                            onClick={async () => {
                                if (!selectedUser?.id) return;
                                await handleDeleteUser(selectedUser.id);
                            }}
                        >
                            <LockKeyIcon className="size-4" color="currentColor" weight="fill" />
                            <span>Suspend Account</span>
                        </Button>
                    )}
                    {isPending && (
                        <Button disabled loading color="destructive" variant="solid">
                            Suspending
                        </Button>
                    )}
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
