/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { redirect } from 'next/navigation';
import { getServerUserId, getUserRole } from '@/helpers/user';
import UsersPageContent from '@/src/app/(protected)/admin/users/users-page';
import { paginatedUsersQueryOptions } from '@/src/queries/tanstack/admin/users-query-options';
import { getQueryClient } from '@/src/queries/tanstack/query-client';
import type { SearchParams } from '@/types/rest/common';

export default async function AdminUsersPage(props: { searchParams: Promise<SearchParams> }) {
    const searchParams = await props.searchParams;
    const queryClient = getQueryClient();
    const userId = await getServerUserId();

    const userRole = await getUserRole(userId);
    if (userRole !== 'ADMIN') {
        redirect('/app');
    }

    const queryPageIndex = searchParams.page ? parseInt(searchParams.page as string) : 1;
    const queryPageSize = searchParams.limit ? parseInt(searchParams.limit as string) : 10;
    const queryPageFilter: string | null = searchParams.keyword ? (searchParams.keyword as string) : null;
    const queryPageSortBy: string | null = searchParams.sortby ? (searchParams.sortby as string) : null;
    const queryPageSortDirection: 'asc' | 'desc' = searchParams.direction
        ? (searchParams.direction as 'asc' | 'desc')
        : 'asc';

    await queryClient.prefetchQuery(
        paginatedUsersQueryOptions({
            direction: queryPageSortDirection,
            keyword: queryPageFilter,
            limit: queryPageSize,
            page: queryPageIndex - 1,
            sortby: queryPageSortBy,
        }),
    );

    return (
        <div className="flex w-full max-w-full flex-col gap-7">
            <HydrationBoundary state={dehydrate(queryClient)}>
                <UsersPageContent />
            </HydrationBoundary>
        </div>
    );
}
