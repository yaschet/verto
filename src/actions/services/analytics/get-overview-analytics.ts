/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { formatDuration, intervalToDuration, subDays } from 'date-fns';
import { isApiError, standardizeError } from '@/errors/api-errors';
import { validateUser } from '@/helpers/validate-user';
import { getLogger } from '@/services/logger';
import { createServerClient } from '@/src/utils/supabase/server';
import type { ApiResponseOrError } from '@/types/rest/response';
import type { QueryData } from '@supabase/supabase-js';

/** Interface for Overview Statistics. */
export type OverviewInsight = {
    id: string;
    value: number | string;
    label: string;
    trend?: number;
    trendLabel?: string;
    data?: { value: number }[];
};

/**
 * Get the Overview Statistics, such as **Total Time Saved**, **Total Credits**, and **Total Translations**.
 *
 * @returns {Promise<ApiResponseOrError<OverviewInsight[]>>} - A promise that resolves to the overview statistics data or an error.
 */
export async function getOverviewInsights(): Promise<ApiResponseOrError<OverviewInsight[]>> {
    const logger = getLogger('SERVICES:STATISTICS:GET_OVERVIEW_STATS');
    const supabase = await createServerClient();

    try {
        const { profile } = await validateUser();
        const now = new Date();
        const oneWeekAgo = subDays(now, 7).toISOString();
        const twoWeeksAgo = subDays(now, 14).toISOString();
        const thirtyDaysAgo = subDays(now, 30).toISOString();

        // Helper to generate daily history
        const generateHistory = <K extends string, T extends Record<K, string | number | Date | null>>(
            items: T[],
            dateKey: K,
            valueFn: (item: T) => number = () => 1,
            aggregator: 'sum' | 'avg' = 'sum',
        ) => {
            const days = 30;
            const map = new Map<string, { sum: number; count: number }>();

            items.forEach((item) => {
                const dateVal = item[dateKey];
                if (!dateVal) return;
                const dateStr = new Date(dateVal).toISOString().split('T')[0];
                const val = valueFn(item);
                const current = map.get(dateStr) || { sum: 0, count: 0 };
                map.set(dateStr, { sum: current.sum + val, count: current.count + 1 });
            });

            const history = [];
            for (let i = days - 1; i >= 0; i--) {
                const d = subDays(now, i);
                const dateStr = d.toISOString().split('T')[0];
                const entry = map.get(dateStr) || { sum: 0, count: 0 };
                let value = 0;
                if (aggregator === 'sum') {
                    value = entry.sum;
                } else if (aggregator === 'avg') {
                    value = entry.count > 0 ? entry.sum / entry.count : 0;
                }
                history.push({ value });
            }
            return history;
        };

        // Fetch the total number of customers (All Time)
        const { count: totalCustomers, error: customersError } = await supabase
            .from('customers')
            .select('*', { count: 'exact', head: true })
            .eq('profile_id', profile.id);

        if (customersError) {
            const errorResponse = standardizeError(customersError);
            logger.error(['Error fetching total customers:', errorResponse]);
            return errorResponse;
        }

        // Fetch customers for last 30 days (for trends and sparkline)
        const { data: recentCustomers, error: recentCustomersError } = await supabase
            .from('customers')
            .select('created_at')
            .eq('profile_id', profile.id)
            .gte('created_at', thirtyDaysAgo);

        if (recentCustomersError) {
            const errorResponse = standardizeError(recentCustomersError);
            logger.error(['Error fetching recent customers:', errorResponse]);
            return errorResponse;
        }

        const newCustomers = recentCustomers.filter((c) => c.created_at >= oneWeekAgo).length;
        const prevCustomers = recentCustomers.filter(
            (c) => c.created_at >= twoWeeksAgo && c.created_at < oneWeekAgo,
        ).length;
        const customersHistory = generateHistory(recentCustomers, 'created_at');

        // Fetch the total number of translations (All Time)
        const { count: totalTranslations, error: translationsError } = await supabase
            .from('translations')
            .select('*', { count: 'exact', head: true })
            .eq('profile_id', profile.id);

        if (translationsError) {
            const errorResponse = standardizeError(translationsError);
            logger.error(['Error fetching total translations:', errorResponse]);
            return errorResponse;
        }

        // Fetch translations for last 30 days (for trends and sparkline)
        const { data: recentTranslations, error: recentTranslationsError } = await supabase
            .from('translations')
            .select('created_at')
            .eq('profile_id', profile.id)
            .gte('created_at', thirtyDaysAgo);

        if (recentTranslationsError) {
            const errorResponse = standardizeError(recentTranslationsError);
            logger.error(['Error fetching recent translations:', errorResponse]);
            return errorResponse;
        }

        const newTranslations = recentTranslations.filter((t) => t.created_at >= oneWeekAgo).length;
        const prevTranslations = recentTranslations.filter(
            (t) => t.created_at >= twoWeeksAgo && t.created_at < oneWeekAgo,
        ).length;
        const translationsHistory = generateHistory(recentTranslations, 'created_at');

        // Fetch translations with credits info to calculate accurate time saved based on page count
        const translationsMetricsQuery = supabase
            .from('translations')
            .select(
                `
                started_at,
                completed_at,
                created_at,
                credits_transactions (
                    details
                )
            `,
            )
            .eq('profile_id', profile.id)
            .not('started_at', 'is', null)
            .not('completed_at', 'is', null);

        type TranslationMetricsData = QueryData<typeof translationsMetricsQuery>;

        const { data: translationsMetricsData, error: translationsMetricsError } =
            await translationsMetricsQuery;

        if (translationsMetricsError) {
            const errorResponse = standardizeError(translationsMetricsError);
            logger.error(['Error fetching translation metrics:', errorResponse]);
            return errorResponse;
        }

        const translationsMetrics: TranslationMetricsData = translationsMetricsData;

        // Calculate average translation speed (in seconds)
        // Re-using the fetched data for both Speed and Time Saved to reduce DB calls
        const calculateAverageSpeed = (translations: TranslationMetricsData) => {
            if (translations.length === 0) return 0;

            const totalDuration = translations.reduce((acc, translation) => {
                const startedAt = new Date(translation.started_at!).getTime();
                const completedAt = new Date(translation.completed_at!).getTime();
                const duration = Math.max(0, completedAt - startedAt); // in milliseconds
                return acc + duration;
            }, 0);

            return totalDuration / translations.length / 1000; // Convert to seconds
        };

        // Calculate average speed for all time
        const avgSpeedAllTime = calculateAverageSpeed(translationsMetrics);

        // Calculate average speed for last 7 days
        const newTranslationsMetrics = translationsMetrics.filter((t) =>
            t.created_at ? t.created_at >= oneWeekAgo : false,
        );
        const avgSpeedLastWeek = calculateAverageSpeed(newTranslationsMetrics);

        const prevTranslationsMetrics = translationsMetrics.filter((t) => {
            if (!t.created_at) return false;
            return t.created_at >= twoWeeksAgo && t.created_at < oneWeekAgo;
        });
        const avgSpeedPrevWeek = calculateAverageSpeed(prevTranslationsMetrics);

        // Speed history (Avg speed per day)
        const recentSpeedData = translationsMetrics.filter(
            (t) => t.created_at && t.created_at >= thirtyDaysAgo,
        );
        const speedHistory = generateHistory(
            recentSpeedData,
            'created_at',
            (t) => {
                const startedAt = new Date(t.started_at!).getTime();
                const completedAt = new Date(t.completed_at!).getTime();
                return Math.max(0, completedAt - startedAt) / 1000; // seconds
            },
            'avg',
        );

        // Format speed display (e.g., "2.5s", "1m 30s", "5m 12s")
        const formatSpeed = (seconds: number): string => {
            if (seconds === 0) return '0s';
            if (seconds < 60) return `${parseFloat(seconds.toFixed(1))}s`;

            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = Math.round(seconds % 60);

            if (minutes < 60) {
                return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
            }

            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
        };

        // Constants for Time Saved Calculation
        const AVERAGE_MANUAL_TIME_PER_PAGE_MS = 20 * 60 * 1000; // 20 minutes per page
        const FALLBACK_MANUAL_TIME_PER_DOC_MS = 60 * 60 * 1000; // 1 hour fallback if no page count

        // Calculate the time saved helper:
        const calculateTimeSaved = (translations: TranslationMetricsData) => {
            return translations.reduce((acc, translation) => {
                const startedAt = translation.started_at ? new Date(translation.started_at).getTime() : 0;
                const completedAt = translation.completed_at
                    ? new Date(translation.completed_at).getTime()
                    : 0;
                const actualTranslationTime = Math.max(0, completedAt - startedAt);

                // Try to get page count from linked credit transaction
                let manualTimeEstimate = FALLBACK_MANUAL_TIME_PER_DOC_MS;

                // Check if we have credit transaction details with page_count
                // credits_transactions is an array (one-to-many), we take the first valid one
                if (
                    translation.credits_transactions &&
                    Array.isArray(translation.credits_transactions) &&
                    translation.credits_transactions.length > 0
                ) {
                    const details = translation.credits_transactions[0].details as { page_count?: number };
                    if (details && typeof details.page_count === 'number') {
                        manualTimeEstimate = details.page_count * AVERAGE_MANUAL_TIME_PER_PAGE_MS;
                    }
                }

                const timeSaved = Math.max(0, manualTimeEstimate - actualTranslationTime);
                return acc + timeSaved;
            }, 0);
        };

        const totalTimeSaved = calculateTimeSaved(translationsMetrics);
        const newTimeSaved = calculateTimeSaved(newTranslationsMetrics);
        const prevTimeSaved = calculateTimeSaved(prevTranslationsMetrics);

        // Time saved history
        const recentTimeSavedData = translationsMetrics.filter(
            (t) => t.started_at && t.started_at >= thirtyDaysAgo,
        );
        const timeSavedHistory = generateHistory(
            recentTimeSavedData,
            'started_at',
            (t) => {
                const startedAt = t.started_at ? new Date(t.started_at).getTime() : 0;
                const completedAt = t.completed_at ? new Date(t.completed_at).getTime() : 0;
                const actualTranslationTime = Math.max(0, completedAt - startedAt);

                let manualTimeEstimate = FALLBACK_MANUAL_TIME_PER_DOC_MS;
                if (
                    t.credits_transactions &&
                    Array.isArray(t.credits_transactions) &&
                    t.credits_transactions.length > 0
                ) {
                    const details = t.credits_transactions[0].details as { page_count?: number };
                    if (details && typeof details.page_count === 'number') {
                        manualTimeEstimate = details.page_count * AVERAGE_MANUAL_TIME_PER_PAGE_MS;
                    }
                }

                return Math.max(0, manualTimeEstimate - actualTranslationTime);
            },
            'sum',
        );

        const formatTimeSaved = (milliseconds: number): string => {
            if (milliseconds <= 0) {
                return '0s';
            }

            const duration = intervalToDuration({ end: milliseconds, start: 0 });

            // Only show top 2 significant units
            const priorities = ['years', 'months', 'weeks', 'days', 'hours', 'minutes', 'seconds'] as const;
            const nonZeroUnits = priorities.filter((unit) => duration[unit] && duration[unit] > 0);
            const displayUnits = nonZeroUnits.slice(0, 2);

            if (displayUnits.length === 0) return '0s';

            const formattedDuration = formatDuration(duration, {
                delimiter: ' ',
                format: displayUnits,
                zero: false,
            });

            return formattedDuration
                .replace(/ years?/, 'y')
                .replace(/ months?/, 'mo')
                .replace(/ weeks?/, 'w')
                .replace(/ days?/, 'd')
                .replace(/ hours?/, 'h')
                .replace(/ minutes?/, 'm')
                .replace(/ seconds?/, 's');
        };

        const finalDisplay = formatTimeSaved(totalTimeSaved);

        // Calculate Week-over-Week Trend
        const calculateTrend = (current: number, previous: number) => {
            if (previous === 0) {
                return current > 0 ? 100 : 0;
            }
            return ((current - previous) / previous) * 100;
        };

        const timeSavedTrend = calculateTrend(newTimeSaved, prevTimeSaved);
        const customersTrend = calculateTrend(newCustomers ?? 0, prevCustomers ?? 0);
        const translationsTrend = calculateTrend(newTranslations ?? 0, prevTranslations ?? 0);
        // Note: For speed, we invert the trend logic - lower speed is better (faster)
        const speedTrend = avgSpeedPrevWeek > 0 ? -calculateTrend(avgSpeedLastWeek, avgSpeedPrevWeek) : 0;

        // Helper to determine trend label based on data points
        const getTrendLabel = (current: number, previous: number) => {
            if (current === 0 && previous === 0) return 'No change from last week';
            if (current > 0 && previous === 0) return 'from last week'; // 100% increase
            if (current === 0 && previous > 0) return 'from last week'; // 100% decrease
            return 'from last week';
        };

        // Create the overview statistics array
        const overviewCards: OverviewInsight[] = [
            {
                id: 'total-time-saved',
                label: 'Total Time Saved',
                trend: timeSavedTrend,
                trendLabel: getTrendLabel(newTimeSaved, prevTimeSaved),
                value: finalDisplay,
                data: timeSavedHistory,
            },
            {
                id: 'total-customers',
                label: 'Total Customers',
                trend: customersTrend,
                trendLabel: getTrendLabel(newCustomers ?? 0, prevCustomers ?? 0),
                value: totalCustomers ?? 0,
                data: customersHistory,
            },
            {
                id: 'total-translations',
                label: 'Total Translations',
                trend: translationsTrend,
                trendLabel: getTrendLabel(newTranslations ?? 0, prevTranslations ?? 0),
                value: totalTranslations ?? 0,
                data: translationsHistory,
            },
            {
                id: 'avg-translation-speed',
                label: 'Avg Translation Speed',
                trend: speedTrend,
                trendLabel: getTrendLabel(avgSpeedLastWeek, avgSpeedPrevWeek),
                value: formatSpeed(avgSpeedAllTime),
                data: speedHistory,
            },
        ];

        return {
            data: overviewCards,
            description: 'All overview statistics have been successfully retrieved.',
            message: 'Overview statistics successfully retrieved.',
            status: 200,
            success: true,
        };
    } catch (error) {
        logger.error([
            'Error fetching Overview Statistics from the API:',
            (error as Error)?.message || error,
            (error as Error)?.stack,
        ]);
        return isApiError(error) ? error : standardizeError(error);
    }
}
