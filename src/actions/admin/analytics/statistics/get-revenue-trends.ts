/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { validateUser } from '@/helpers/validate-user';
import { isApiError, standardizeError } from '@errors/api-errors';
import { getLogger } from '@services/logger';
import { createAdminClient } from '@utils/supabase/server';
import type { ApiResponseOrError } from '@/types/rest/response';

// Define the types of revenue trends:
export type RevenueTrendType =
    | 'adjustment'
    | 'charge'
    | 'payment'
    | 'refund'
    | 'payout'
    | 'topup'
    | 'stripe_fee';

export type RevenueTrend = {
    amount: number;
    type: RevenueTrendType;
    time: number;
};

/**
 * Get the Overview Statistics, such as **Total Users**, **Total Translations**, and **Stripe Balance**.
 *
 * @param {Object} filters - Optional filters for date ranges.
 * @param {Date} filters.startDate - The start date for filtering data (optional).
 * @param {Date} filters.endDate - The end date for filtering data (optional).
 * @returns {Promise<ApiResponseOrError<AdminOverviewInsight[]>>} - A promise that resolves to the revenue trends data or an error.
 */
export async function getRevenueTrends(filters?: {
    startDate?: Date;
    endDate?: Date;
}): Promise<ApiResponseOrError<RevenueTrend[]>> {
    const logger = getLogger('ACTIONS:ADMIN:ANALYTICS:GET_REVENUE_TRENDS');

    try {
        // Validate the user and ensure they have the required role:
        await validateUser({
            requiredRole: 'ADMIN', // Ensures only admins can proceed.
        });

        // Fetch the revenue trends data:
        const revenueTrends = await getStripeRevenueTrends(filters);

        return {
            data: revenueTrends,
            description: `${revenueTrends.length} revenue trend data points retrieved.`,
            message: 'Revenue trends successfully retrieved.',
            title: 'Revenue Trends Retrieved',
            status: 200,
            success: true,
        };
    } catch (error) {
        const standardizedError = isApiError(error) ? error : standardizeError(error);
        logger.error(['Error fetching Overview Statistics from the API:', JSON.stringify(standardizedError)]);
        return standardizedError;
    }
}

/**
 * Retrieves the Stripe Revenue Trends for the specified date range.
 *
 * - If both `startDate` and `endDate` filters are provided, calculates the revenue within that range by aggregating `stripe_balance_transactions`.
 * - If only `endDate` is provided, calculates the revenue up to that date.
 * - If no filters are provided, calculates the revenue for all available data.
 *
 * @param {Object} filters - Optional filters for date ranges.
 * @param {Date} filters.startDate - The start date for filtering transactions (optional).
 * @param {Date} filters.endDate - The end date for filtering transactions (optional).
 * @returns {Promise<RevenueTrend[]>} - A promise that resolves to the revenue trends data.
 */
async function getStripeRevenueTrends(filters?: {
    startDate?: Date;
    endDate?: Date;
}): Promise<RevenueTrend[]> {
    const logger = getLogger('ACTIONS:ADMIN:ANALYTICS:GET_STRIPE_REVENUE_TRENDS');

    try {
        const supabase = await createAdminClient();

        // Build the query:
        let query = supabase
            .from('stripe_balance_transactions')
            .select('net, type, created')
            .order('created', { ascending: true })
            .eq('currency', 'usd')
            .in('type', ['charge', 'payment', 'refund', 'adjustment', 'payout', 'topup', 'stripe_fee']);

        // Apply date filters if provided:
        if (filters?.startDate) {
            query = query.gte('created', filters.startDate.toISOString());
        }

        if (filters?.endDate) {
            query = query.lte('created', filters.endDate.toISOString());
        }

        // Increase the limit and sort by most recent first
        const { data, error } = await query.order('created', { ascending: false }).range(0, 9999);

        if (error) {
            const response = standardizeError(error);
            logger.error(['Error fetching Stripe revenue trends:', response]);
            return [];
        }

        if (!data) {
            return [];
        }

        // Map the transactions to the format required for the line chart:
        return data.map((transaction) => ({
            amount: transaction.net,
            type: transaction.type,
            time: new Date(transaction.created).getTime(),
        }));
    } catch (error) {
        const standardizedError = isApiError(error) ? error : standardizeError(error);
        logger.error(['Error retrieving Stripe revenue trends:', JSON.stringify(standardizedError)]);
        return [];
    }
}
