/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getServerUserId } from '@/helpers/user';
import CustomersPageContent from '@/src/app/(protected)/app/customers/customers-page';
import { paginatedCustomersQueryOptions } from '@/src/queries/tanstack/customers-query-options';
import { getQueryClient } from '@/src/queries/tanstack/query-client';
import type { CustomerColumn } from '@/src/schemas/customer-schemas';
import type { SearchParams } from '@/types/rest/common';

export default async function CustomersPage(props: { searchParams: Promise<SearchParams> }) {
    const searchParams = await props.searchParams;
    const queryClient = getQueryClient();
    const userId = await getServerUserId();

    const queryPageIndex = searchParams.page ? parseInt(searchParams.page as string) : 1;
    const queryPageSize = searchParams.limit ? parseInt(searchParams.limit as string) : 10;
    const queryPageFilter: string | null = searchParams.keyword ? (searchParams.keyword as string) : null;
    const queryPageSortBy: CustomerColumn | null = searchParams.sortby
        ? (searchParams.sortby as CustomerColumn)
        : null;
    const queryPageSortDirection: 'asc' | 'desc' = searchParams.direction
        ? (searchParams.direction as 'asc' | 'desc')
        : 'asc';

    await queryClient.prefetchQuery(
        paginatedCustomersQueryOptions({
            userId,
            queryPageFilter,
            queryPageIndex,
            queryPageSize,
            queryPageSortBy,
            queryPageSortDirection,
        }),
    );

    return (
        <div className="flex w-full max-w-full flex-col gap-7">
            <HydrationBoundary state={dehydrate(queryClient)}>
                <CustomersPageContent />
            </HydrationBoundary>
        </div>
    );
}
