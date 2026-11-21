/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { infiniteQueryOptions, keepPreviousData, queryOptions } from '@tanstack/react-query';
import getActiveUsersCount from '@actions/admin/analytics/insights/get-active-users';
import { getAdminInfiniteCreditsTransactions } from '@/src/actions/admin/users/get-admin-credit-transactions';
import { getPaginatedUsers } from '@/src/actions/admin/users/get-paginated-users';
import { isApiError } from '@errors/api-errors';
import type { AdminUserRow } from '@/src/schemas/admin-user-schemas';
import type { ActiveUsersResponse } from '@actions/admin/analytics/insights/get-active-users';
import type {
    CreditsTransactionsQueryData,
    CreditsTransactionsQueryResponse,
} from '@actions/billing/credits/get-infinite-credits-transactions';
import type { TransactionsHistoryFilterState } from '@stores/filtering-store';
import type { PaginatedResponse } from '@/types/rest/common';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';
import { getUser } from '@/src/actions/admin/users/get-user';
import type { AdminUserDetails } from '@/src/actions/admin/users/get-user';

export const activeUsersQueryOptions = (userId?: string | null | undefined) =>
    queryOptions<
        ActiveUsersResponse,
        ApiErrorType,
        number,
        ['active-users-count', string | null | undefined]
    >({
        queryFn: async () => {
            const response = await getActiveUsersCount();

            if (response?.error || !response) {
                console.error('Error fetching active users count:', response);
                throw response;
            }

            return response;
        },
        queryKey: ['active-users-count', userId],
        refetchInterval: 60 * 1000, // 1 minute.
        refetchOnMount: true,
        refetchOnReconnect: true,
        refetchOnWindowFocus: true,
        refetchIntervalInBackground: false,
        retry: 3,
        retryDelay: (attempt) => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000),
        select: (information) => information.data?.activeUsersCount ?? 0,
        staleTime: 60 * 1000 * 5, // 5 minutes.
        enabled: !!userId,
        placeholderData: keepPreviousData,
    });

export const usersQueryKeys = {
    all: ['admin', 'users'] as const,
    list: (params: unknown) => [...usersQueryKeys.all, 'list', params] as const,
    detail: (userId: string) => [...usersQueryKeys.all, 'detail', userId] as const,
    transactions: (userId: string, filters?: unknown) =>
        [...usersQueryKeys.all, 'transactions', userId, filters] as const,
};

export const userQueryOptions = (userId: string) => {
    return queryOptions<
        ApiResponseOrError<AdminUserDetails>,
        ApiResponseOrError<AdminUserDetails>,
        AdminUserDetails
    >({
        queryFn: async () => {
            const response = await getUser(userId);

            if (response?.error || !response) {
                throw response;
            }

            return response;
        },
        queryKey: usersQueryKeys.detail(userId),
        enabled: !!userId,
        select: (response) => response.data as AdminUserDetails,
    });
};

export const adminCreditsTransactionsQueryOptions = (
    userId: string,
    filters?: TransactionsHistoryFilterState | undefined,
) =>
    infiniteQueryOptions<
        CreditsTransactionsQueryResponse,
        ApiErrorType,
        {
            pages: CreditsTransactionsQueryData[];
            pageParams: number[];
        }
    >({
        queryFn: async ({ pageParam }): Promise<CreditsTransactionsQueryResponse> => {
            const response = await getAdminInfiniteCreditsTransactions(userId, {
                pageParam: pageParam ? parseInt(pageParam as string) : undefined,
                pageSize: 10,
                filters: filters ?? undefined,
            });

            if (isApiError(response)) {
                console.error('Error fetching admin credits transactions:', response);
                throw response;
            }

            return response;
        },
        getNextPageParam: (lastPage) => {
            if (isApiError(lastPage)) {
                return undefined;
            }
            const nextCursor = (lastPage as { nextCursor?: number | null })?.nextCursor;
            return nextCursor !== null && nextCursor !== undefined ? nextCursor : undefined;
        },
        initialPageParam: 0,
        maxPages: undefined,
        placeholderData: keepPreviousData,
        getPreviousPageParam: (firstPage) => {
            if (isApiError(firstPage)) {
                return undefined;
            }
            const prevCursor = (firstPage as { prevCursor?: number | null })?.prevCursor;
            return prevCursor !== null && prevCursor !== undefined ? prevCursor : undefined;
        },
        queryKey: usersQueryKeys.transactions(userId, filters),
        refetchOnWindowFocus: false,
        enabled: !!userId,
    });

export const paginatedUsersQueryOptions = (options: {
    page: number;
    limit: number;
    keyword?: string | null;
    role?: string | null;
    status?: string | null;
    sortby?: string | null;
    direction?: 'asc' | 'desc';
}) => {
    return queryOptions<
        ApiResponseOrError<PaginatedResponse<AdminUserRow>>,
        ApiResponseOrError<PaginatedResponse<AdminUserRow>>,
        PaginatedResponse<AdminUserRow>
    >({
        queryFn: async () => {
            const response = await getPaginatedUsers({
                page: options.page,
                pageFilter: options.keyword,
                pageRole: options.role,
                pageStatus: options.status,
                pageSize: options.limit,
                pageSortBy: options.sortby as keyof AdminUserRow | null,
                pageSortOrder: options.direction ?? 'desc',
            });

            if (response?.error || !response) {
                throw response;
            }

            return response;
        },
        queryKey: usersQueryKeys.list({
            direction: options.direction,
            keyword: options.keyword,
            limit: options.limit,
            page: options.page,
            role: options.role,
            sortby: options.sortby,
            status: options.status,
        }),
        placeholderData: keepPreviousData,
        select: (information) =>
            information.data ?? {
                results: [],
                total: 0,
                pagination: {
                    pagesCount: 0,
                    pageIndex: 0,
                    pageSize: 10,
                    nextPage: null,
                    prevPage: null,
                },
            },
    });
};
