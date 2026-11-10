/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import {
    getPaginatedTranslations,
    getRecentTranslations,
} from '@/src/actions/services/translations/get-paginated-translations';
import { getTranslationDetail } from '@/src/actions/services/translations/get-translation-detail';
import { getTranslationForReview } from '@/src/actions/services/translations/get-translation-for-review';
import { getAssignableCustomers } from '@actions/services/translations/assign-customer';
import type { TranslationColumn, TranslationRow } from '@/src/schemas/translation-schemas';
import type { PaginatedResponse } from '@/types/rest/common';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';
import type { RawCustomerRow } from '@schemas/customer-schemas';
import type { UndefinedInitialDataOptions, UseQueryOptions } from '@tanstack/react-query';
import type { JSONContent } from '@tiptap/react';

// Translation detail data type (single translation with file metadata)
export type TranslationDetailData = {
    translation: TranslationRow;
    fileMetadata: {
        size: number | null;
        mimetype: string | null;
        lastModified: string | null;
    };
    templateName: string | null;
    customerName: string | null;
    customerEmail: string | null;
    creditsUsed: number;
    estimatedCost: number;
    pageCount: number | null;
    tokenUsage: number | null;
};

export const translationDetailQueryOptions = (translationId: string) =>
    queryOptions<ApiResponseOrError<TranslationDetailData>, ApiErrorType, TranslationDetailData>({
        queryKey: ['translation-detail', translationId],
        queryFn: async () => {
            const response = await getTranslationDetail(translationId);

            if (response?.error || !response?.data) {
                throw response;
            }

            return response;
        },
        select: (response) => response.data!,
        staleTime: 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000, // 5 minutes
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        retry: 3,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
        enabled: !!translationId,
    });

// Translation review data type (for review/edit page with TipTap)
export type TranslationReviewData = {
    translation: TranslationRow;
    signedPdfUrl: string | null;
    sanitizedContent: JSONContent | null;
    originalContent: JSONContent | null;
    fileMetadata: {
        size: number | null;
        mimetype: string | null;
    };
};

export const translationReviewQueryOptions = (translationId: string) =>
    queryOptions<ApiResponseOrError<TranslationReviewData>, ApiErrorType, TranslationReviewData>({
        queryKey: ['translation-review', translationId],
        queryFn: async () => {
            const response = await getTranslationForReview(translationId);

            if (response?.error || !response?.data) {
                throw response;
            }

            return response;
        },
        select: (response) => response.data!,
        staleTime: 60 * 1000, // 1 minute - signed URLs last 1 hour so this is safe
        gcTime: 5 * 60 * 1000, // 5 minutes
        refetchOnMount: true,
        refetchOnWindowFocus: true, // Refresh signed URL on window focus
        refetchOnReconnect: true,
        retry: 3,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
        enabled: !!translationId,
    });

export const recentTranslationsQueryOptions = (
    userId?: string | null | undefined,
    otherOptions: {
        queryPageSize: number;
    } = {
        queryPageSize: 5,
    },
) =>
    queryOptions<ApiResponseOrError<TranslationRow[]>, ApiErrorType, TranslationRow[]>({
        placeholderData: keepPreviousData,
        queryFn: async () => {
            const response = await getRecentTranslations(otherOptions.queryPageSize);

            if (response?.error || !response) {
                throw response;
            }

            return response;
        },
        queryKey: ['recent-translations', userId, otherOptions.queryPageSize],
        retry: 3,
        enabled: !!userId,
        retryDelay: (attempt) => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000),
        select: (information) => information.data ?? [],
    });

export const paginatedTranslationsQueryOptions = ({
    queryPageCustomer = null,
    queryPageFilter = null,
    queryPageIndex = 1,
    queryPageSize = 10,
    queryPageSortBy = null,
    queryPageSortDirection = 'asc',
    userId = null,
}: {
    userId?: string | null | undefined;
    queryPageIndex: number;
    queryPageSize: number;
    queryPageFilter: string | null;
    queryPageSortBy: TranslationColumn | null;
    queryPageSortDirection: 'asc' | 'desc';
    queryPageCustomer: string | null;
}) =>
    queryOptions<
        ApiResponseOrError<PaginatedResponse<TranslationRow>>,
        ApiResponseOrError<PaginatedResponse<TranslationRow>>,
        PaginatedResponse<TranslationRow>
    >({
        placeholderData: keepPreviousData,
        queryFn: async () => {
            const response = await getPaginatedTranslations({
                page: queryPageIndex - 1,
                pageCustomer: queryPageCustomer,
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
            'paginated-translations',
            userId,
            queryPageIndex,
            queryPageSize,
            queryPageFilter,
            queryPageSortBy,
            queryPageSortDirection,
            queryPageCustomer,
        ],
        retry: 3,
        enabled: !!userId,
        retryDelay: (attempt) => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000),
        select: (information) =>
            information.data ?? {
                results: [],
                total: 0,
            },
    });
// Define the types once
export type AssignableCustomerData = {
    id: RawCustomerRow['id'];
    display_name: RawCustomerRow['display_name'];
    email: RawCustomerRow['email'];
};

export type AssignableCustomersQueryResponse = ApiResponseOrError<AssignableCustomerData[]>;

export const assignableCustomersQueryOptions = (
    userId?: string | null | undefined,
    otherOptions?: Partial<
        UndefinedInitialDataOptions<AssignableCustomersQueryResponse, ApiErrorType, AssignableCustomerData[]>
    >,
): UseQueryOptions<AssignableCustomersQueryResponse, ApiErrorType, AssignableCustomerData[]> => {
    return queryOptions<AssignableCustomersQueryResponse, ApiErrorType, AssignableCustomerData[]>({
        networkMode: 'online',
        queryFn: async () => {
            const response = await getAssignableCustomers();

            if (response?.error || !response) {
                throw response;
            }

            return response;
        },
        enabled: !!userId,
        queryKey: ['assignable-customers', userId],
        retry: 3,
        retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 30000),
        select: (data) => data.data ?? [],
        ...otherOptions,
    });
};
