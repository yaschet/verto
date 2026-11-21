/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { endOfDay, endOfMonth, startOfDay, startOfMonth, subDays, subMonths } from 'date-fns';
import { validateUser } from '@/helpers/validate-user';
import { isApiError, standardizeError } from '@errors/api-errors';
import { getDateRange } from '@library/time';
import { getLogger } from '@services/logger';
import { createAdminClient } from '@utils/supabase/server';
import type { ApiResponseOrError } from '@/types/rest/response';

/** Interface for Average Translation Duration Statistics. */
export type AverageTranslationDurationData = {
    totalAverageDuration: number;
    trend: 'up' | 'down';
    trendPercentage: number;
    trendDescription: string;
};

export type AverageTranslationDurationResponse = ApiResponseOrError<AverageTranslationDurationData>;

/**
 * Get the total Average Translation Duration Statistics.
 *
 * @param {Object} filters - Optional filters for date ranges.
 * @param {Date} filters.startDate - The start date for filtering data (optional).
 * @param {Date} filters.endDate - The end date for filtering data (optional).
 * @param {string} filters.selectedFilter - The selected time filter.
 * @returns {Promise<ApiResponseOrError<AverageTranslationDurationData>>} - A promise that resolves to the average translation duration data or an error.
 */
export async function getAverageTranslationDuration(filters?: {
    startDate?: Date;
    endDate?: Date;
    selectedFilter?: string;
}): Promise<AverageTranslationDurationResponse> {
    const logger = getLogger('ACTIONS:ADMIN:ANALYTICS:GET_AVERAGE_TRANSLATION_DURATION');
    const supabase = await createAdminClient();

    try {
        await validateUser({ requiredRole: 'ADMIN' });

        const { selectedFilter } = filters || {};
        const now = new Date();
        const dateRange = getDateRange(selectedFilter || 'last_6_months', now);

        const startDate = dateRange.startDate || new Date('1970-01-01');
        const endDate = dateRange.endDate || now;

        const { data: translations, error: translationsError } = await supabase
            .from('translations')
            .select('started_at, completed_at, status, details')
            .gte('started_at', startDate.toISOString())
            .lte('completed_at', endDate.toISOString())
            .eq('status', 'ready');

        if (translationsError) {
            logger.error(['Error fetching translations:', JSON.stringify(translationsError)]);
            return {
                data: {
                    totalAverageDuration: 0,
                    trend: 'up',
                    trendPercentage: 0,
                    trendDescription:
                        'The average translation duration has increased since the previous period.',
                },
                description: 'Failed to retrieve translations.',
                message: 'Error fetching translations data.',
                status: 500,
                success: false,
            };
        }

        const totalDurations = translations.reduce((acc, translation) => {
            if (translation.started_at && translation.completed_at) {
                const duration =
                    new Date(translation.completed_at).getTime() - new Date(translation.started_at).getTime();
                return acc + duration;
            }
            return acc;
        }, 0);

        const totalAverageDuration = translations.length > 0 ? totalDurations / translations.length : 0;

        const previousDateRange = getPreviousDateRange(selectedFilter || 'all', startDate, endDate);
        const { data: previousTranslations, error: previousError } = await supabase
            .from('translations')
            .select('started_at, completed_at, status, details')
            .gte('started_at', previousDateRange.startDate.toISOString())
            .lte('completed_at', previousDateRange.endDate.toISOString())
            .eq('status', 'ready');

        if (previousError) {
            logger.error(['Error fetching previous period translations:', JSON.stringify(previousError)]);
            return {
                data: {
                    totalAverageDuration,
                    trend: 'up',
                    trendPercentage: 0,
                    trendDescription:
                        'The average translation duration has increased since the previous period.',
                },
                description:
                    'Average translation duration data retrieved successfully, but failed to calculate trend.',
                message: 'Average translation duration data retrieved successfully.',
                status: 200,
                success: true,
            };
        }

        const previousTotalDurations = previousTranslations.reduce((acc, translation) => {
            if (translation.started_at && translation.completed_at) {
                const duration =
                    new Date(translation.completed_at).getTime() - new Date(translation.started_at).getTime();
                return acc + duration;
            }
            return acc;
        }, 0);

        const previousAverageDuration =
            previousTranslations.length > 0 ? previousTotalDurations / previousTranslations.length : 0;

        const trendPercentage =
            previousAverageDuration > 0
                ? ((totalAverageDuration - previousAverageDuration) / previousAverageDuration) * 100
                : totalAverageDuration > 0
                  ? 100
                  : 0;

        const trend = trendPercentage >= 0 ? 'up' : 'down';
        const trendDescription =
            trend === 'up'
                ? 'The average translation duration has increased compared to the previous period.'
                : 'The average translation duration has decreased compared to the previous period.';

        return {
            data: {
                totalAverageDuration,
                trend,
                trendPercentage: Number(trendPercentage.toFixed(2)),
                trendDescription,
            },
            description: 'Average translation duration data retrieved successfully.',
            message: 'Average translation duration data successfully retrieved.',
            status: 200,
            success: true,
        };
    } catch (error) {
        const standardizedError = isApiError(error) ? error : standardizeError(error);
        logger.error(['Error fetching average translation duration:', JSON.stringify(standardizedError)]);
        return standardizedError;
    }
}

function getPreviousDateRange(
    selectedFilter: string,
    startDate: Date,
    endDate: Date,
): { startDate: Date; endDate: Date } {
    let previousStartDate: Date;
    let previousEndDate: Date;

    switch (selectedFilter) {
        case 'last_7_days':
            previousStartDate = startOfDay(subDays(startDate, 7));
            previousEndDate = endOfDay(subDays(startDate, 1));
            break;
        case 'last_month':
            previousStartDate = startOfMonth(subMonths(startDate, 1));
            previousEndDate = endOfMonth(subMonths(endDate, 1));
            break;
        case 'last_3_months':
            previousStartDate = startOfMonth(subMonths(startDate, 3));
            previousEndDate = endOfMonth(subMonths(endDate, 3));
            break;
        case 'last_6_months':
            previousStartDate = startOfMonth(subMonths(startDate, 6));
            previousEndDate = endOfMonth(subMonths(endDate, 6));
            break;
        case 'all':
            previousStartDate = new Date('1970-01-01');
            previousEndDate = startOfDay(subDays(startDate, 1));
            break;
        default:
            // Default to last 7 days
            previousStartDate = startOfDay(subDays(startDate, 7));
            previousEndDate = endOfDay(subDays(startDate, 1));
            break;
    }

    return {
        startDate: previousStartDate,
        endDate: previousEndDate,
    };
}
