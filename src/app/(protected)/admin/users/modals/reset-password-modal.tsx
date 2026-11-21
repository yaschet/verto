/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { KeyIcon, XIcon } from '@phosphor-icons/react';
import { useMutation } from '@tanstack/react-query';
import { type JSX } from 'react';
import { toast } from 'sonner';
import { titleCase } from 'title-case';
import { resetPassword } from '@/src/actions/admin/users/reset-password';
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

export default function ResetPasswordModal({
    isResetModalOpen,
    selectedUser,
    setIsResetModalOpen,
    setSelectedUser,
}: {
    isResetModalOpen: boolean;
    selectedUser: AdminUserRow | null;
    setSelectedUser: Dispatch<SetStateAction<AdminUserRow | null>>;
    setIsResetModalOpen: Dispatch<SetStateAction<boolean>>;
    queryClient: QueryClient;
}): JSX.Element {
    const { isPending, mutateAsync } = useMutation({
        mutationFn: async ({ email, id }: { id: string; email: string }) => {
            const response = await resetPassword({
                email,
                id,
            });

            if (response?.error || !response) {
                throw response;
            }

            return response;
        },
        onError: (error: (Error & Partial<ApiErrorType>) | ApiErrorType) => {
            toast.error(error.title ?? error.message ?? 'Error', {
                description: error.description ?? 'An error occurred while resetting the password.',
            });
        },
        onSuccess: async (data: ApiResponseOrError) => {
            setIsResetModalOpen(false);
            setSelectedUser(null);
            // No need to invalidate queries as password reset doesn't change user list data
            toast.success(data.message ?? 'Password Reset Sent', {
                description: data.description ?? 'A password reset email has been sent.',
            });
        },
        retry: 3,
        retryDelay: (attempt) => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000),
    });

    const handleResetPassword = async (id: string, email: string) => {
        await mutateAsync({ email, id });
    };

    return (
        <AlertDialog open={isResetModalOpen} onOpenChange={setIsResetModalOpen}>
            <AlertDialogContent>
                <AlertDialogHeader className="text-start text-lg font-semibold">
                    <AlertDialogTitle>{titleCase('Confirm Password Reset')}</AlertDialogTitle>
                </AlertDialogHeader>

                <div className="text-foreground dark:text-foreground-500 text-start text-sm">
                    Are you sure you want to send a password reset email to <b>{selectedUser?.email}</b>?
                </div>

                <AlertDialogFooter>
                    <Button color="default" variant="soft" onClick={() => setIsResetModalOpen(false)}>
                        <XIcon className="size-4" color="currentColor" weight="duotone" />
                        Cancel
                    </Button>
                    {!isPending && (
                        <Button
                            color="primary"
                            variant="solid"
                            onClick={async () => {
                                if (!selectedUser?.id || !selectedUser?.email) return;
                                await handleResetPassword(selectedUser.id, selectedUser.email);
                            }}
                        >
                            <KeyIcon className="size-4" color="currentColor" />
                            <span>Send Reset Link</span>
                        </Button>
                    )}
                    {isPending && (
                        <Button disabled loading color="primary" variant="solid">
                            Sending
                        </Button>
                    )}
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
