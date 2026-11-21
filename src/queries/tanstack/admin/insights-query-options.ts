/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { getOverviewInsights } from '@actions/admin/analytics/insights/get-overview-insights';
import { standardizeError } from '@errors/api-errors';
import { getIcon } from 'src/app/(protected)/app/dashboard/components/overview/partials/overview-card';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';
import type { AdminOverviewInsight } from '@actions/admin/analytics/insights/get-overview-insights';

export const insightsQueryOptions = (
    userId?: string,
    filters?: {
        startDate?: Date;
        endDate?: Date;
    },
) =>
    queryOptions<
        ApiResponseOrError<AdminOverviewInsight[]>,
        ApiErrorType,
        AdminOverviewInsight[],
        ['overview-insights', string | undefined, Date | undefined, Date | undefined]
    >({
        queryFn: async () => {
            const response = await getOverviewInsights({
                startDate: filters?.startDate,
                endDate: filters?.endDate,
            });

            if (response?.error || !response) {
                throw response;
            }

            const validateOverviewStatistics = (
                data: AdminOverviewInsight[],
            ): data is AdminOverviewInsight[] => {
                if (!Array.isArray(data)) return false;

                const requiredKeys = ['id', 'label', 'value'];
                return data.every((item) => requiredKeys.every((key) => key in item));
            };

            if (!response.data || !validateOverviewStatistics(response.data)) {
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
        queryKey: ['overview-insights', userId, filters?.startDate, filters?.endDate],
        refetchInterval: 3 * 60 * 1000,
        refetchIntervalInBackground: false,
        refetchOnMount: true,
        refetchOnReconnect: true,
        refetchOnWindowFocus: true,
        retry: 3,
        retryOnMount: true,
        retryDelay(failureCount: number) {
            return Math.min(1000 * 2 ** failureCount, 30000);
        },
        select: (information) => {
            return (
                information.data?.map((overview: AdminOverviewInsight) => ({
                    icon: getIcon(overview.id),
                    id: overview.id,
                    label: overview.label,
                    value: overview.value,
                    trend: overview.trend,
                    trendLabel: overview.trendLabel,
                    data: overview.data,
                })) ?? []
            );
        },
        enabled: !!userId,
        staleTime: 60 * 60 * 1000,
        placeholderData: keepPreviousData,
    });
