/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { getAverageTranslationDuration } from '@actions/admin/analytics/metrics/get-average-translation-duration';
import { getNewSignUps } from '@actions/admin/analytics/metrics/get-new-sign-ups';
import type { ApiErrorType } from '@/types/rest/errors';
import type {
    AverageTranslationDurationData,
    AverageTranslationDurationResponse,
} from '@actions/admin/analytics/metrics/get-average-translation-duration';
import type {
    AdminNewSignUpsData,
    AdminNewSignUpsResponse,
} from '@actions/admin/analytics/metrics/get-new-sign-ups';

export const newSignUpsAnalyticsQueryOptions = (
    userId?: string | null | undefined,
    filters?: {
        startDate?: Date;
        endDate?: Date;
        selectedFilter?: string;
    },
) =>
    queryOptions<
        AdminNewSignUpsResponse,
        ApiErrorType,
        AdminNewSignUpsData,
        [
            'new-sign-ups-chart',
            string | null | undefined,
            Date | undefined,
            Date | undefined,
            string | undefined,
        ]
    >({
        queryFn: async () => {
            const response = await getNewSignUps({
                startDate: filters?.startDate,
                endDate: filters?.endDate,
                selectedFilter: filters?.selectedFilter,
            });

            if (response?.error || !response) {
                throw response;
            }

            return response;
        },
        queryKey: [
            'new-sign-ups-chart',
            userId,
            filters?.startDate,
            filters?.endDate,
            filters?.selectedFilter,
        ],
        refetchInterval: 60 * 60 * 1000 * 24,
        refetchOnMount: false,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
        retry: 3,
        retryDelay: (attempt) => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000),
        select: (information) =>
            information.data ??
            ({
                totalSignUps: 0,
                trend: 'up',
                trendDescription: 'The number of new sign-ups has increased since the previous period.',
                trendPercentage: 0,
            } as AdminNewSignUpsData),
        staleTime: 60 * 60 * 1000 * 24,
        enabled: !!userId,
        placeholderData: keepPreviousData,
    });

export const averageTranslationDurationQueryOptions = (
    userId?: string | null | undefined,
    filters?: {
        startDate?: Date;
        endDate?: Date;
        selectedFilter?: string;
    },
) =>
    queryOptions<
        AverageTranslationDurationResponse,
        ApiErrorType,
        AverageTranslationDurationData,
        [
            'average-translation-duration-chart',
            string | null | undefined,
            Date | undefined,
            Date | undefined,
            string | undefined,
        ]
    >({
        queryFn: async () => {
            const response = await getAverageTranslationDuration({
                startDate: filters?.startDate,
                endDate: filters?.endDate,
                selectedFilter: filters?.selectedFilter,
            });

            if (response?.error || !response) {
                throw response;
            }

            return response;
        },
        queryKey: [
            'average-translation-duration-chart',
            userId,
            filters?.startDate,
            filters?.endDate,
            filters?.selectedFilter,
        ],
        refetchInterval: 60 * 60 * 1000 * 24,
        refetchOnMount: false,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
        retry: 3,
        retryDelay: (attempt) => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000),
        select: (information) =>
            information.data ??
            ({
                totalAverageDuration: 0,
                trend: 'up',
                trendDescription: 'The average translation duration has increased since the previous period.',
                trendPercentage: 0,
            } as AverageTranslationDurationData),
        staleTime: 60 * 60 * 1000 * 24,
        enabled: !!userId,
        placeholderData: keepPreviousData,
    });
