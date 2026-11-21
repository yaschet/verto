/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

// src/actions/admin/analytics/get-new-sign-ups.ts

'use server';

import { endOfDay, endOfMonth, startOfDay, startOfMonth, subDays, subMonths } from 'date-fns';
import { validateUser } from '@/helpers/validate-user';
import { isApiError, standardizeError } from '@errors/api-errors';
import { getDateRange } from '@library/time';
import { getLogger } from '@services/logger';
import { createAdminClient } from '@utils/supabase/server';
import type { ApiResponseOrError } from '@/types/rest/response';

/** Interface for New Sign-Ups Statistics. */
export type AdminNewSignUpsData = {
    totalSignUps: number;
    totalUsers: number;
    trend: 'up' | 'down';
    trendPercentage: number;
    trendDescription: string;
};

export type AdminNewSignUpsResponse = ApiResponseOrError<AdminNewSignUpsData>;

/**
 * Get the total New Sign-Ups Statistics.
 *
 * @param {Object} filters - Optional filters for date ranges.
 * @param {Date} filters.startDate - The start date for filtering data (optional).
 * @param {Date} filters.endDate - The end date for filtering data (optional).
 * @param {string} filters.selectedFilter - The selected time filter.
 * @returns {Promise<ApiResponseOrError<AdminNewSignUpsData>>} - A promise that resolves to the new sign-ups data or an error.
 */
export async function getNewSignUps(filters?: {
    startDate?: Date;
    endDate?: Date;
    selectedFilter?: string;
}): Promise<AdminNewSignUpsResponse> {
    const logger = getLogger('ACTIONS:ADMIN:ANALYTICS:GET_ADMIN_NEW_SIGN_UPS');
    const supabase = await createAdminClient();

    try {
        // Validate the user and ensure they have the required role
        await validateUser({
            requiredRole: 'ADMIN',
        });

        const { selectedFilter } = filters || {};
        const now = new Date();
        const dateRange = getDateRange(selectedFilter || 'last_6_months', now); // Default to last 6 months

        const startDate = dateRange.startDate || new Date('1970-01-01');
        const endDate = dateRange.endDate || now;

        // Fetch total new sign-ups within the date range
        const { count: newSignUpsCount, error: newSignUpsError } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true }) // Use head: true for count without data
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());

        if (newSignUpsError) {
            logger.error(['Error fetching new sign-ups:', JSON.stringify(newSignUpsError)]);
            return {
                data: {
                    totalSignUps: 0,
                    totalUsers: 0,
                    trend: 'up',
                    trendPercentage: 0,
                    trendDescription: 'The number of new sign-ups has increased since the previous period.',
                },
                description: 'Failed to retrieve new sign-ups.',
                message: 'Error fetching new sign-ups data.',
                status: 500,
                success: false,
            };
        }

        const totalSignUps = newSignUpsCount ?? 0;

        // Fetch total users (assuming 'profiles' table holds all users)
        const { count: totalUsersCount, error: totalUsersError } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true });

        if (totalUsersError) {
            logger.error(['Error fetching total users:', JSON.stringify(totalUsersError)]);
            return {
                data: {
                    totalSignUps,
                    totalUsers: 0,
                    trend: 'up',
                    trendPercentage: 0,
                    trendDescription: 'The number of new sign-ups has increased since the previous period.',
                },
                description: 'Failed to retrieve total users.',
                message: 'Error fetching total users data.',
                status: 500,
                success: false,
            };
        }

        const totalUsers = totalUsersCount ?? 0;

        const previousDateRange = getPreviousDateRange(selectedFilter || 'all', startDate, endDate);
        const { count: previousSignUpsCount, error: previousError } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', previousDateRange.startDate.toISOString())
            .lte('created_at', previousDateRange.endDate.toISOString());

        if (previousError) {
            logger.error(['Error fetching previous period sign-ups:', JSON.stringify(previousError)]);
            // Handle as needed, possibly set trend to neutral
            return {
                data: {
                    totalSignUps,
                    totalUsers,
                    trend: 'up',
                    trendPercentage: 0,
                    trendDescription: 'The number of new sign-ups has increased since the previous period.',
                },
                description: 'New sign-ups data retrieved successfully, but failed to calculate trend.',
                message: 'New sign-ups data retrieved successfully.',
                status: 200,
                success: true,
            };
        }

        const previousSignUps = previousSignUpsCount ?? 0;

        // Calculate trend percentage
        const trendPercentage =
            previousSignUps > 0
                ? ((totalSignUps - previousSignUps) / previousSignUps) * 100
                : totalSignUps > 0
                  ? 100
                  : 0;

        const trend = trendPercentage >= 0 ? 'up' : 'down';
        const trendDescription =
            trend === 'up'
                ? 'The number of new sign-ups has increased compared to the previous period.'
                : 'The number of new sign-ups has decreased compared to the previous period.';

        return {
            data: {
                totalSignUps,
                totalUsers,
                trend,
                trendPercentage: Number(trendPercentage.toFixed(2)),
                trendDescription,
            },
            description: 'New sign-ups data retrieved successfully.',
            message: 'New sign-ups data successfully retrieved.',
            status: 200,
            success: true,
        };
    } catch (error) {
        const standardizedError = isApiError(error) ? error : standardizeError(error);
        logger.error(['Error fetching new sign-ups:', JSON.stringify(standardizedError)]);
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
