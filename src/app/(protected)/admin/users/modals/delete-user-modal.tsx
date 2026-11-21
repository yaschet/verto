/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { TrashIcon, XIcon, WarningOctagonIcon } from '@phosphor-icons/react';
import { useMutation } from '@tanstack/react-query';
import { type JSX } from 'react';
import { toast } from 'sonner';
import { titleCase } from 'title-case';
import { deleteUser } from '@/src/actions/admin/users/delete-user';
import { useRouter, usePathname } from 'next/navigation';
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

export default function DeleteUserModal({
    isDeletionModalOpen, // keeping prop name consistent with usage for now, or rename to isPermanentDeleteModalOpen if prefer
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
    const router = useRouter();
    const pathname = usePathname();

    const { isPending, mutateAsync } = useMutation({
        mutationFn: async ({ id }: { id: string }) => {
            const response = await deleteUser({
                id: id ?? '',
            });

            if (response?.error || !response) {
                throw response;
            }

            return response;
        },
        onError: (error: (Error & Partial<ApiErrorType>) | ApiErrorType) => {
            toast.error(error.title ?? error.message ?? 'Error', {
                description: error.description ?? 'An error occurred while deleting the user account.',
            });
        },
        onSuccess: async (data: ApiResponseOrError) => {
            setIsDeletionModalOpen(false);
            const deletedUserId = selectedUser?.id;

            // If we are on the user's detail page, redirect to the users list
            if (deletedUserId && pathname.includes(deletedUserId)) {
                router.push('/admin/users');
            } else {
                // Otherwise just invalidate the list
                await queryClient.invalidateQueries({
                    queryKey: ['admin', 'users'],
                });
            }

            setSelectedUser(null);

            toast.success(data.message ?? 'User Deleted', {
                description: data.description ?? 'The user account has been permanently deleted.',
            });
        },
        retry: 0,
    });

    const handleDeleteUser = async (id: string) => {
        await mutateAsync({ id });
    };

    return (
        <AlertDialog open={isDeletionModalOpen} onOpenChange={setIsDeletionModalOpen}>
            <AlertDialogContent>
                <AlertDialogHeader className="text-start text-lg font-semibold">
                    <AlertDialogTitle>{titleCase('Permanently Delete User')}</AlertDialogTitle>
                </AlertDialogHeader>

                <div className="text-foreground dark:text-foreground-500 text-start text-sm">
                    <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-red-600 dark:bg-red-900/20 dark:text-red-400">
                        <WarningOctagonIcon className="size-5 shrink-0" weight="fill" />
                        <span className="font-semibold">Warning: This action is irreversible.</span>
                    </div>
                    Are you sure you want to delete{' '}
                    <span className="font-semibold">{selectedUser?.full_name || selectedUser?.email}</span>?
                    <ul
                        className="text-surface-500 marker:text-destructive mt-2 list-disc space-y-1 px-4 text-start text-sm marker:font-bold"
                        role="list"
                    >
                        <li>All user data will be permanently removed.</li>
                        <li>This user cannot log in after deletion.</li>
                        <li>Associated records (e.g. credits) will be deleted.</li>
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
                            <TrashIcon className="size-4" color="currentColor" weight="fill" />
                            <span>Delete User</span>
                        </Button>
                    )}
                    {isPending && (
                        <Button disabled loading color="destructive" variant="solid">
                            Deleting
                        </Button>
                    )}
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
