/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { getPaginatedCustomers } from '@/src/actions/services/customers/get-paginated-customers';
import type { CustomerColumn, CustomerRow } from '@/src/schemas/customer-schemas';
import type { PaginatedResponse } from '@/types/rest/common';
import type { ApiResponseOrError } from '@/types/rest/response';

export const paginatedCustomersQueryOptions = ({
    queryPageFilter,
    queryPageIndex,
    queryPageSize,
    queryPageSortBy,
    queryPageSortDirection,
    userId,
}: {
    userId?: string | null | undefined;
    queryPageIndex: number;
    queryPageSize: number;
    queryPageFilter: string | null;
    queryPageSortBy: CustomerColumn | null;
    queryPageSortDirection: 'asc' | 'desc';
}) =>
    queryOptions<
        ApiResponseOrError<PaginatedResponse<CustomerRow>>,
        ApiResponseOrError<PaginatedResponse<CustomerRow>>,
        PaginatedResponse<CustomerRow>
    >({
        enabled: !!userId,
        networkMode: 'online',
        placeholderData: keepPreviousData,
        queryFn: async () => {
            const response = await getPaginatedCustomers({
                page: queryPageIndex - 1,
                pageFilter: queryPageFilter,
                pageSize: queryPageSize,
                pageSortBy: queryPageSortBy,
                pageSortOrder: queryPageSortDirection,
            });

            if (response?.error || !response) {
                throw response;
            }

            return response;
        },
        queryKey: [
            'paginated-customers',
            userId,
            queryPageIndex,
            queryPageSize,
            queryPageFilter,
            queryPageSortBy,
            queryPageSortDirection,
        ],
        refetchInterval: 1000 * 60 * 20,
        refetchIntervalInBackground: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
        retry: 3,
        retryDelay: (attempt) => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000),
        retryOnMount: true,
        select: (information) => information.data ?? { results: [], total: 0 },
    });
