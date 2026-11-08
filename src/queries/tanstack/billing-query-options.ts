/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { infiniteQueryOptions, keepPreviousData, queryOptions } from '@tanstack/react-query';
import { getCreditsBalance } from '@actions/billing/credits/get-credits-balance';
import { getInfiniteCreditsTransactions } from '@actions/billing/credits/get-infinite-credits-transactions';
import { isApiError } from '@errors/api-errors';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';
import type {
    CreditsTransactionsQueryData,
    CreditsTransactionsQueryResponse,
} from '@actions/billing/credits/get-infinite-credits-transactions';
import type { TransactionsHistoryFilterState } from '@stores/filtering-store';

export type CreditsBalanceQueryResponse = ApiResponseOrError<{
    balance: CreditsBalanceQueryData;
}>;

export type CreditsBalanceQueryData = number | null;

export const balanceDataQueryOptions = (userId?: string | undefined) =>
    queryOptions<number, ApiErrorType, number, ['zustand-balance-store', string | undefined]>({
        gcTime: 30 * 60 * 1000,
        placeholderData: keepPreviousData,
        refetchOnMount: 'always',
        refetchOnReconnect: 'always',
        refetchOnWindowFocus: true,
        queryFn: async () => {
            const response = await getCreditsBalance();

            if (!response || response.error) {
                throw {
                    error: {
                        message: response.message || 'Unknown error',
                        code: response.code,
                        status: response.status,
                    },
                } as unknown as ApiErrorType;
            }

            return response?.data?.balance ?? 0;
        },
        queryKey: ['zustand-balance-store', userId],
        staleTime: 0,
        enabled: !!userId,
    });

export const creditsTransactionsQueryOptions = (
    userId?: string | undefined,
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
            const response = await getInfiniteCreditsTransactions({
                pageParam: pageParam ? parseInt(pageParam as string) : undefined,
                pageSize: 10,
                filters: filters ?? undefined,
            });

            if (isApiError(response)) {
                console.error('Error fetching credits transactions:', response);
                throw {
                    error: {
                        message: response.message || 'Unknown error',
                        code: response.code,
                        status: response.status,
                    },
                } as unknown as ApiErrorType;
            }

            return response;
        },
        getNextPageParam: (lastPage) => {
            if (isApiError(lastPage)) {
                return undefined; // Stop fetching more pages if there's an error
            }
            const nextCursor = (lastPage as { nextCursor?: number | null })?.nextCursor;
            // Ensure we only fetch if there's actually a next page
            return nextCursor !== null && nextCursor !== undefined ? nextCursor : undefined;
        },
        initialPageParam: 0,
        maxPages: undefined,
        placeholderData: keepPreviousData,
        getPreviousPageParam: (firstPage) => {
            if (isApiError(firstPage)) {
                return undefined; // Stop fetching more pages if there's an error
            }
            const prevCursor = (firstPage as { prevCursor?: number | null })?.prevCursor;

            return prevCursor !== null && prevCursor !== undefined ? prevCursor : undefined;
        },
        queryKey: ['credits-transactions', userId, filters],
        refetchOnWindowFocus: false,
        enabled: !!userId,
    });
