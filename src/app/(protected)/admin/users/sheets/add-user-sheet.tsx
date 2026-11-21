/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { UserPlusIcon } from '@phosphor-icons/react';
import { toast } from 'sonner';
import AdminAddUserForm from '@/src/app/(protected)/admin/users/forms/admin-add-user-form';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/src/components/ui/sheet';
import type { ApiResponseOrError } from '@/types/rest/response';
import { useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import { useAdminStore } from '@components/providers/admin-store-provider';

export default function AddUserSheet() {
    const { isAddUserSheetOpen, setIsAddUserSheetOpen } = useAdminStore((state) => state);
    const queryClient = useQueryClient();
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (searchParams.get('create') === 'true') {
            setIsAddUserSheetOpen(true);
        }
    }, [searchParams, setIsAddUserSheetOpen]);

    const onOpenChange = (open: boolean) => {
        setIsAddUserSheetOpen(open);
        if (!open) {
            // Remove the query param when closing
            const params = new URLSearchParams(searchParams.toString());
            if (params.has('create')) {
                params.delete('create');
                router.replace(`${pathname}?${params.toString()}`, { scroll: false });
            }
        }
    };

    const onUserCreated = (data: ApiResponseOrError) => {
        if ('success' in data && data.success) {
            toast.success(data.title ?? 'User Created', {
                description: data.message ?? 'The user has been created successfully.',
            });
            setIsAddUserSheetOpen(false);
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
        } else {
            toast.error(data.title ?? 'Error', {
                description: data.message ?? 'Failed to create user.',
            });
        }
    };

    return (
        <Sheet onOpenChange={onOpenChange} open={isAddUserSheetOpen}>
            <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
                <SheetHeader className="mb-6 flex w-full flex-row items-center gap-4 space-y-0">
                    <div className="bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex size-12 shrink-0 items-center justify-center rounded-full">
                        <UserPlusIcon className="size-6" weight="duotone" />
                    </div>
                    <div className="flex flex-1 flex-col gap-1">
                        <SheetTitle>Add New User</SheetTitle>
                        <SheetDescription>
                            Create a new user account with complete profile information.
                        </SheetDescription>
                    </div>
                </SheetHeader>

                <AdminAddUserForm onUserCreated={onUserCreated} />
            </SheetContent>
        </Sheet>
    );
}
