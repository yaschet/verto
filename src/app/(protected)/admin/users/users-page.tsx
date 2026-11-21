/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { PlusIcon, UsersIcon } from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Fragment, useEffect, useState } from 'react';
import { SectionTitle } from '@/src/app/(protected)/app/components/common';
import AdjustCreditsModal from '@/src/app/(protected)/admin/users/modals/adjust-credits-modal';
import DeleteUserModal from '@/src/app/(protected)/admin/users/modals/delete-user-modal';
import ReactivateUserModal from '@/src/app/(protected)/admin/users/modals/reactivate-user-modal';
import ResetPasswordModal from '@/src/app/(protected)/admin/users/modals/reset-password-modal';
import SuspendUserModal from '@/src/app/(protected)/admin/users/modals/suspend-user-modal';
import UpdateUserSheet from '@/src/app/(protected)/admin/users/sheets/update-user-sheet';
import { ManageMfaDialog } from '@/src/app/(protected)/admin/users/[id]/components/manage-mfa-dialog';
import { UsersTable } from '@/src/app/(protected)/admin/users/table/users-table';
import { useAdminStore } from '@components/providers/admin-store-provider';
import { Button } from '@components/ui/button';
import { DefaultCard } from '@components/ui/card';
import { useUserData } from '@hooks/queries/auth/use-user-data';
import { paginatedUsersQueryOptions, usersQueryKeys } from '@/src/queries/tanstack/admin/users-query-options';
import { getQueryClient } from '@/src/queries/tanstack/query-client';
import { createBrowserClient } from '@utils/supabase/client';
import type { AdminUserRow } from '@/src/schemas/admin-user-schemas';
import type { PaginatedResponse } from '@/types/rest/common';
import type { ApiResponseOrError } from '@/types/rest/response';
import type { PaginationState, SortingState } from '@tanstack/react-table';

export default function UsersPageContent() {
    const searchParams = useSearchParams();
    useRouter();
    usePathname();
    const queryClient = getQueryClient();
    const { data: userData } = useUserData();
    const { user } = userData ?? {};
    const _userId = user?.id ?? '';

    const queryPageIndex: number = searchParams.get('page')
        ? parseInt(searchParams.get('page') as string)
        : 1;
    const queryPageSize: number = searchParams.get('limit')
        ? parseInt(searchParams.get('limit') as string)
        : 10;
    const queryPageFilter: string | null = searchParams.get('keyword') ?? null;
    const queryPageRole: string | null = searchParams.get('role') ?? null;
    const queryPageStatus: string | null = searchParams.get('status') ?? null;
    const queryPageSortBy: string | null = searchParams.get('sortby') ?? null;
    const queryPageSortDirection: 'asc' | 'desc' = searchParams.get('direction')
        ? (searchParams.get('direction') as 'asc' | 'desc')
        : 'asc';

    const { data, isLoading, refetch } = useQuery<
        ApiResponseOrError<PaginatedResponse<AdminUserRow>>,
        ApiResponseOrError<PaginatedResponse<AdminUserRow>>,
        PaginatedResponse<AdminUserRow>
    >(
        paginatedUsersQueryOptions({
            direction: queryPageSortDirection,
            keyword: queryPageFilter,
            limit: queryPageSize,
            page: queryPageIndex - 1,
            role: queryPageRole,
            sortby: queryPageSortBy,
            status: queryPageStatus,
        }),
    );

    useEffect(() => {
        refetch().then((r) => r);
    }, [refetch, searchParams]);

    const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null);

    // Modals & Sheets State
    const [isUpdateSheetOpen, setIsUpdateSheetOpen] = useState<boolean>(false);
    const [isDeletionModalOpen, setIsDeletionModalOpen] = useState<boolean>(false); // This is Suspend
    const [isPermanentDeletionModalOpen, setIsPermanentDeletionModalOpen] = useState<boolean>(false); // This is Delete
    const [isAdjustCreditsModalOpen, setIsAdjustCreditsModalOpen] = useState<boolean>(false);
    const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState<boolean>(false);
    const [isReactivationModalOpen, setIsReactivationModalOpen] = useState<boolean>(false);
    const [isMfaDialogOpen, setIsMfaDialogOpen] = useState<boolean>(false);

    const setIsAddUserSheetOpen = useAdminStore((state) => state.setIsAddUserSheetOpen);

    // Trigger Functions
    const triggerUserCreation = () => {
        setIsAddUserSheetOpen(true);
    };

    const triggerUserUpdate = (user: AdminUserRow) => {
        setSelectedUser(user);
        setIsUpdateSheetOpen(true);
    };

    const triggerUserDeletion = (user: AdminUserRow) => {
        // This is Suspend
        setSelectedUser(user);
        setIsDeletionModalOpen(true);
    };

    const triggerPermanentUserDeletion = (user: AdminUserRow) => {
        // This is Hard Delete
        setSelectedUser(user);
        setIsPermanentDeletionModalOpen(true);
    };

    const triggerAdjustCredits = (user: AdminUserRow) => {
        setSelectedUser(user);
        setIsAdjustCreditsModalOpen(true);
    };

    const triggerResetPassword = (user: AdminUserRow) => {
        setSelectedUser(user);
        setIsResetPasswordModalOpen(true);
    };

    const triggerUserReactivation = (user: AdminUserRow) => {
        setSelectedUser(user);
        setIsReactivationModalOpen(true);
    };

    const triggerManageMFA = (user: AdminUserRow) => {
        setSelectedUser(user);
        setIsMfaDialogOpen(true);
    };

    // Table State derived from URL
    const pagination: PaginationState = {
        pageIndex: queryPageIndex - 1,
        pageSize: queryPageSize,
    };
    const sorting: SortingState = queryPageSortBy
        ? [{ id: queryPageSortBy, desc: queryPageSortDirection === 'desc' }]
        : [];

    useEffect(() => {
        const supabase = createBrowserClient();
        const channel = supabase
            .channel('realtime:admin:users')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
                queryClient.invalidateQueries({ queryKey: usersQueryKeys.all });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);

    return (
        <Fragment>
            <div className="flex w-full max-w-full flex-col items-start justify-start gap-3">
                <SectionTitle icon={UsersIcon} title="User Management">
                    <Button
                        className="flex items-center justify-center"
                        color="primary"
                        variant="solid"
                        onClick={triggerUserCreation}
                    >
                        <PlusIcon className="size-5" color="currentColor" weight="bold" />
                        <span className="hidden font-bold md:block">Add User</span>
                    </Button>
                </SectionTitle>

                <div className="relative flex h-auto w-full max-w-full flex-row items-center justify-start gap-4">
                    <DefaultCard>
                        <UsersTable
                            data={
                                data ?? {
                                    results: [],
                                    total: 0,
                                    pagination: {
                                        pagesCount: 0,
                                        pageIndex: 0,
                                        pageSize: 10,
                                        nextPage: null,
                                        prevPage: null,
                                    },
                                }
                            }
                            isLoading={isLoading}
                            pagination={pagination}
                            sorting={sorting}
                            triggerAdjustCredits={triggerAdjustCredits}
                            triggerPermanentUserDeletion={triggerPermanentUserDeletion}
                            triggerResetPassword={triggerResetPassword}
                            triggerUserReactivation={triggerUserReactivation}
                            triggerUserSuspension={triggerUserDeletion}
                            triggerUserUpdate={triggerUserUpdate}
                            triggerManageMFA={triggerManageMFA}
                        />
                    </DefaultCard>

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

                    <DeleteUserModal
                        isDeletionModalOpen={isPermanentDeletionModalOpen}
                        queryClient={queryClient}
                        selectedUser={selectedUser}
                        setIsDeletionModalOpen={setIsPermanentDeletionModalOpen}
                        setSelectedUser={setSelectedUser}
                    />

                    <AdjustCreditsModal
                        isModalOpen={isAdjustCreditsModalOpen}
                        queryClient={queryClient}
                        selectedUser={selectedUser}
                        setIsModalOpen={setIsAdjustCreditsModalOpen}
                        setSelectedUser={setSelectedUser}
                        currentBalance={selectedUser?.credits ?? 0}
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

                    <ManageMfaDialog
                        open={isMfaDialogOpen}
                        onOpenChange={setIsMfaDialogOpen}
                        userId={selectedUser?.id ?? ''}
                        userName={selectedUser?.full_name ?? selectedUser?.email ?? 'User'}
                    />
                </div>
            </div>
        </Fragment>
    );
}
