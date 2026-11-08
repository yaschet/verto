/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { getCreditsBurnDownAnalytics } from '@actions/admin/analytics/statistics/get-credits-burn-down-analytics';
import { getRevenueTrends } from '@actions/admin/analytics/statistics/get-revenue-trends';
import { getTranslationPairsHistory } from '@actions/admin/analytics/statistics/get-translation-pairs-history';
import { getUserActivityReports } from '@actions/admin/analytics/statistics/get-user-activity-reports';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';
import type { AdminCreditTransaction } from '@actions/admin/analytics/statistics/get-credits-burn-down-analytics';
import type { RevenueTrend } from '@actions/admin/analytics/statistics/get-revenue-trends';
import type { AdminTranslationPair } from '@actions/admin/analytics/statistics/get-translation-pairs-history';
import type { UserActivityReport } from '@actions/admin/analytics/statistics/get-user-activity-reports';

export const translationPairsQueryOptions = (
    userId?: string | null | undefined,
    filters?: {
        startDate?: Date;
        endDate?: Date;
    },
) =>
    queryOptions<
        ApiResponseOrError<AdminTranslationPair[]>,
        ApiErrorType,
        AdminTranslationPair[],
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

export const creditsBurnDownAnalyticsQueryOptions = (
    userId?: string | null | undefined,
    filters?: {
        startDate?: Date;
        endDate?: Date;
    },
) =>
    queryOptions<
        ApiResponseOrError<AdminCreditTransaction[]>,
        ApiErrorType,
        AdminCreditTransaction[],
        ['credit-transactions-chart', string | null | undefined, Date | undefined, Date | undefined]
    >({
        queryFn: async () => {
            const response = await getCreditsBurnDownAnalytics({
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

export const revenueTrendsQueryOptions = (
    userId?: string | null | undefined,
    filters?: {
        startDate?: Date;
        endDate?: Date;
    },
) =>
    queryOptions<
        ApiResponseOrError<RevenueTrend[]>,
        ApiErrorType,
        RevenueTrend[],
        ['revenue-trends-chart', string | null | undefined, Date | undefined, Date | undefined]
    >({
        queryFn: async () => {
            const response = await getRevenueTrends({
                startDate: filters?.startDate,
                endDate: filters?.endDate,
            });

            if (response?.error || !response) {
                throw response;
            }

            return response;
        },
        queryKey: ['revenue-trends-chart', userId, filters?.startDate, filters?.endDate],
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

export const userActivityQueryOptions = (
    userId?: string | null | undefined,
    filters?: {
        startDate?: Date;
        endDate?: Date;
    },
) =>
    queryOptions<
        ApiResponseOrError<UserActivityReport[]>,
        ApiErrorType,
        UserActivityReport[],
        ['user-activity-chart', string | null | undefined, Date | undefined, Date | undefined]
    >({
        queryFn: async () => {
            const response = await getUserActivityReports({
                startDate: filters?.startDate,
                endDate: filters?.endDate,
            });

            if (response?.error || !response) {
                throw response;
            }

            return response;
        },
        queryKey: ['user-activity-chart', userId, filters?.startDate, filters?.endDate],
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
