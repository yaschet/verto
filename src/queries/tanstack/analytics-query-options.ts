/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { getCreditTransactionHistory } from '@actions/services/analytics/get-credit-transaction-history';
import { getOverviewInsights } from '@actions/services/analytics/get-overview-analytics';
import { getTranslationPairsHistory } from '@actions/services/analytics/get-translation-pairs-history';
import { standardizeError } from '@errors/api-errors';
import { getIcon } from 'src/app/(protected)/app/dashboard/components/overview/partials/overview-card';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';
import type { CreditTransaction } from '@actions/services/analytics/get-credit-transaction-history';
import type { OverviewInsight } from '@actions/services/analytics/get-overview-analytics';
import type { TranslationPair } from '@actions/services/analytics/get-translation-pairs-history';

export const overviewInsightsQueryOptions = (userId?: string) =>
    queryOptions<ApiResponseOrError<OverviewInsight[]>, ApiErrorType, OverviewInsight[]>({
        queryFn: async () => {
            const response = await getOverviewInsights();

            if (response?.error || !response) {
                throw response;
            }

            const validateOverviewInsights = (data: OverviewInsight[]): data is OverviewInsight[] => {
                if (!Array.isArray(data)) return false;

                const requiredKeys = ['id', 'label', 'value'];
                return data.every((item) => requiredKeys.every((key) => key in item));
            };

            if (!response.data || !validateOverviewInsights(response.data)) {
                throw standardizeError({
                    code: 'INVALID_OVERVIEW_STATS',
                    description: 'The overview statistics are invalid, please try again.',
                    message: 'Invalid overview statistics.',
                    status: 500,
                    title: 'Invalid Overview Statistics',
                });
            }

            return response;
        },
        queryKey: ['overview-cards', userId],
        refetchInterval: 3 * 60 * 1000,
        refetchIntervalInBackground: false,
        refetchOnMount: true,
        refetchOnReconnect: true,
        refetchOnWindowFocus: true,
        retry: 3,
        retryDelay(failureCount: number, _error: unknown) {
            return Math.min(1000 * 2 ** failureCount, 30000);
        },
        retryOnMount: true,
        select: (information) => {
            return (
                information.data?.map((overview: OverviewInsight) => ({
                    icon: getIcon(overview.id),
                    id: overview.id,
                    label: overview.label,
                    trend: overview.trend,
                    trendLabel: overview.trendLabel,
                    value: overview.value,
                    data: overview.data,
                })) ?? []
            );
        },
    });

export const analyticsCreditTransactionsQueryOptions = (
    userId?: string | null | undefined,
    filters?: {
        startDate?: Date;
        endDate?: Date;
    },
) =>
    queryOptions<
        ApiResponseOrError<CreditTransaction[]>,
        ApiErrorType,
        CreditTransaction[],
        ['credit-transactions-chart', string | null | undefined, Date | undefined, Date | undefined]
    >({
        queryFn: async () => {
            const response = await getCreditTransactionHistory({
                startDate: filters?.startDate,
                endDate: filters?.endDate,
            });

            if (response?.error || !response) {
                throw response;
            }

            return response;
        },
        queryKey: ['credit-transactions-chart', userId, filters?.startDate, filters?.endDate],
        refetchInterval: 60 * 60 * 1000 * 24,
        refetchOnMount: false,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
        retry: 3,
        retryDelay: (attempt) => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000),
        select: (information) => information.data ?? [],
        staleTime: 60 * 60 * 1000 * 24,
        enabled: !!userId,
        placeholderData: keepPreviousData,
    });

export const analyticsTranslationPairsQueryOptions = (
    userId?: string | null | undefined,
    filters?: {
        startDate?: Date;
        endDate?: Date;
    },
) =>
    queryOptions<
        ApiResponseOrError<TranslationPair[]>,
        ApiErrorType,
        TranslationPair[],
        ['translation-pairs-chart', string | null | undefined, Date | undefined, Date | undefined]
    >({
        queryFn: async () => {
            const response = await getTranslationPairsHistory({
                startDate: filters?.startDate,
                endDate: filters?.endDate,
            });

            if (response?.error || !response) {
                throw response;
            }

            return response;
        },
        queryKey: ['translation-pairs-chart', userId, filters?.startDate, filters?.endDate],
        refetchInterval: 60 * 60 * 1000 * 24,
        refetchOnMount: false,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
        retry: 3,
        retryDelay: (attempt) => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000),
        select: (information) => information.data ?? [],
        staleTime: 60 * 60 * 1000 * 24,
        enabled: !!userId,
        placeholderData: keepPreviousData,
    });
