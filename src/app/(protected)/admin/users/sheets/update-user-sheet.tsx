/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { PencilSimpleIcon } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import AdminEditUserForm from '@/src/app/(protected)/admin/users/forms/admin-edit-user-form';
import type { AdminUserRow } from '@schemas/admin-user-schemas';
import type { QueryClient } from '@tanstack/react-query';
import type { ApiResponseOrError } from '@/types/rest/response';
import type { Dispatch, SetStateAction, JSX } from 'react';

export default function UpdateUserSheet({
    isUpdateSheetOpen,
    queryClient,
    selectedUser,
    setIsUpdateSheetOpen,
    setSelectedUser,
}: {
    isUpdateSheetOpen: boolean;
    selectedUser: AdminUserRow | null;
    setSelectedUser: Dispatch<SetStateAction<AdminUserRow | null>>;
    setIsUpdateSheetOpen: Dispatch<SetStateAction<boolean>>;
    queryClient: QueryClient;
}): JSX.Element {
    const onUserUpdated = (data: ApiResponseOrError) => {
        if ('success' in data && data.success) {
            toast.success(data.title ?? 'User Updated', {
                description: data.message ?? 'The user has been updated successfully.',
            });
            setIsUpdateSheetOpen(false);
            setSelectedUser(null);
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
        } else {
            toast.error(data.title ?? 'Error', {
                description: data.message ?? 'Failed to update user.',
            });
        }
    };

    return (
        <Sheet open={isUpdateSheetOpen} onOpenChange={setIsUpdateSheetOpen}>
            <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
                <SheetHeader className="mb-6 flex w-full flex-row items-center gap-4 space-y-0">
                    <div className="bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex size-12 shrink-0 items-center justify-center rounded-full">
                        <PencilSimpleIcon className="size-6" weight="duotone" />
                    </div>
                    <div className="flex flex-1 flex-col gap-1">
                        <SheetTitle>Update User</SheetTitle>
                        <SheetDescription>Update the user's complete profile information.</SheetDescription>
                    </div>
                </SheetHeader>
                {selectedUser && (
                    <AdminEditUserForm
                        userId={selectedUser.id}
                        initialData={selectedUser}
                        onUserUpdated={onUserUpdated}
                    />
                )}
            </SheetContent>
        </Sheet>
    );
}
