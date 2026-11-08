/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { subDays } from 'date-fns';
import { validateUser } from '@/helpers/validate-user';
import { isApiError, standardizeError } from '@errors/api-errors';
import { getLogger } from '@services/logger';
import { createAdminClient } from '@utils/supabase/server';
import type { ApiResponseOrError } from '@/types/rest/response';

/** Interface for Overview Statistics. */
export type AdminOverviewInsight = {
    id: string;
    value: number | string;
    label: string;
    trend?: number;
    trendLabel?: string;
    data?: { value: number }[];
};

/**
 * Get the Overview Statistics, such as **Total Users**, **Total Translations**, and **Stripe Balance**.
 *
 * @param {Object} filters - Optional filters for date ranges.
 * @param {Date} filters.startDate - The start date for filtering data (optional).
 * @param {Date} filters.endDate - The end date for filtering data (optional).
 * @returns {Promise<ApiResponseOrError<AdminOverviewInsight[]>>} - A promise that resolves to the overview statistics data or an error.
 */
export async function getOverviewInsights(filters?: {
    startDate?: Date;
    endDate?: Date;
}): Promise<ApiResponseOrError<AdminOverviewInsight[]>> {
    const logger = getLogger('ACTIONS:ADMIN:ANALYTICS:GET_ADMIN_OVERVIEW_INSIGHTS');
    const supabase = await createAdminClient();

    try {
        // Validate the user and ensure they have the required role:
        await validateUser({
            requiredRole: 'ADMIN', // Ensures only admins can proceed.
        });

        // Helper to generate daily history (last 30 days)
        const generateHistory = <K extends string, T extends Record<K, string | number | Date | null>>(
            items: T[],
            dateKey: K,
        ) => {
            const days = 30;
            const now = new Date();
            const map = new Map<string, number>();

            items.forEach((item) => {
                const dateVal = item[dateKey];
                if (!dateVal) return;
                const dateStr = new Date(dateVal).toISOString().split('T')[0];
                map.set(dateStr, (map.get(dateStr) || 0) + 1);
            });

            const history = [];
            for (let i = days - 1; i >= 0; i--) {
                const d = subDays(now, i);
                const dateStr = d.toISOString().split('T')[0];
                history.push({ value: map.get(dateStr) || 0 });
            }
            return history;
        };

        const now = new Date();
        const oneWeekAgo = subDays(now, 7).toISOString();
        const twoWeeksAgo = subDays(now, 14).toISOString();
        const thirtyDaysAgo = subDays(now, 30).toISOString();

        // Fetch the total number of users from Supabase:
        let usersQuery = supabase.from('profiles').select('id', { count: 'exact', head: true });

        if (filters?.startDate) {
            usersQuery = usersQuery.gte('created_at', filters.startDate.toISOString());
        }
        if (filters?.endDate) {
            usersQuery = usersQuery.lte('created_at', filters.endDate.toISOString());
        }

        const { count: usersCount, error: usersError } = await usersQuery;

        if (usersError) {
            logger.error(['Error fetching user count:', JSON.stringify(usersError)]);
        }

        // Fetch users for trends and sparkline
        const { data: recentUsers, error: recentUsersError } = await supabase
            .from('profiles')
            .select('created_at')
            .gte('created_at', thirtyDaysAgo);

        if (recentUsersError) {
            logger.error(['Error fetching recent users:', JSON.stringify(recentUsersError)]);
        }

        const newUsers = recentUsers?.filter((u) => u.created_at >= oneWeekAgo).length || 0;
        const prevUsers =
            recentUsers?.filter((u) => u.created_at >= twoWeeksAgo && u.created_at < oneWeekAgo).length || 0;
        const usersHistory = generateHistory(recentUsers || [], 'created_at');

        // Fetch the total number of translations from Supabase:
        let transQuery = supabase.from('translations').select('id', { count: 'exact', head: true });

        if (filters?.startDate) {
            transQuery = transQuery.gte('created_at', filters.startDate.toISOString());
        }
        if (filters?.endDate) {
            transQuery = transQuery.lte('created_at', filters.endDate.toISOString());
        }

        const { count: translationsCount, error: translationsError } = await transQuery;

        if (translationsError) {
            logger.error(['Error fetching translation count:', JSON.stringify(translationsError)]);
        }

        // Fetch translations for trends and sparkline
        const { data: recentTranslations, error: recentTranslationsError } = await supabase
            .from('translations')
            .select('created_at')
            .gte('created_at', thirtyDaysAgo);

        if (recentTranslationsError) {
            logger.error(['Error fetching recent translations:', JSON.stringify(recentTranslationsError)]);
        }

        const newTranslations = recentTranslations?.filter((t) => t.created_at >= oneWeekAgo).length || 0;
        const prevTranslations =
            recentTranslations?.filter((t) => t.created_at >= twoWeeksAgo && t.created_at < oneWeekAgo)
                .length || 0;
        const translationsHistory = generateHistory(recentTranslations || [], 'created_at');

        // Fetch Stripe balance transactions for trends and sparkline
        // We need 'stripe_balance_transactions' table (or view)
        const { data: recentStripeTransactions, error: stripeTransactionsError } = await supabase
            .from('stripe_balance_transactions')
            .select('amount, created')
            .eq('currency', 'usd')
            .gte('created', thirtyDaysAgo);

        if (stripeTransactionsError) {
            logger.error([
                'Error fetching recent stripe transactions:',
                JSON.stringify(stripeTransactionsError),
            ]);
        }

        const stripeHistory = (() => {
            const days = 30;
            const now = new Date();
            const map = new Map<string, number>();

            recentStripeTransactions?.forEach((t) => {
                const dateStr = new Date(t.created).toISOString().split('T')[0];
                map.set(dateStr, (map.get(dateStr) || 0) + Number(t.amount));
            });

            const history = [];
            for (let i = days - 1; i >= 0; i--) {
                const d = subDays(now, i);
                const dateStr = d.toISOString().split('T')[0];
                history.push({ value: (map.get(dateStr) || 0) / 100 }); // to dollars
            }
            return history;
        })();

        const newStripe =
            recentStripeTransactions
                ?.filter((t) => t.created >= oneWeekAgo)
                .reduce((acc, t) => acc + Number(t.amount), 0) || 0;
        const prevStripe =
            recentStripeTransactions
                ?.filter((t) => t.created >= twoWeeksAgo && t.created < oneWeekAgo)
                .reduce((acc, t) => acc + Number(t.amount), 0) || 0;

        // Fetch the total Stripe balance in USD:
        const stripeBalanceUSD = (await getStripeBalance(filters)) ?? '$0.00';

        // Trend calculation helper
        const calculateTrend = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return ((current - previous) / previous) * 100;
        };

        // Create the overview statistics array.
        const adminOverviewInsights: AdminOverviewInsight[] = [
            {
                id: 'total-users',
                label: 'Total Users',
                value: usersCount || 0,
                trend: calculateTrend(newUsers, prevUsers),
                trendLabel: 'from last week',
                data: usersHistory,
            },
            {
                id: 'total-translations',
                label: 'Total Translations',
                value: translationsCount || 0,
                trend: calculateTrend(newTranslations, prevTranslations),
                trendLabel: 'from last week',
                data: translationsHistory,
            },
            {
                id: 'stripe-balance',
                label: 'Stripe Balance',
                value: stripeBalanceUSD,
                trend: calculateTrend(newStripe, prevStripe),
                trendLabel: 'from last week',
                data: stripeHistory,
            },
        ];

        return {
            data: adminOverviewInsights,
            description: 'All overview statistics have been successfully retrieved.',
            message: 'Overview statistics successfully retrieved.',
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
 * Retrieves the Stripe balance in USD.
 *
 * - If an `endDate` filter is provided, calculates the balance up to that date by aggregating `stripe_balance_transactions`.
 * - If no `endDate` is provided, retrieves the current balance from `stripe_balance`.
 *
 * @param {Object} filters - Optional filters for date ranges.
 * @param {Date} filters.startDate - The start date for filtering transactions (optional).
 * @param {Date} filters.endDate - The end date for filtering transactions (optional).
 * @returns {Promise<string>} - A formatted string representing the USD balance.
 */
async function getStripeBalance(filters?: { startDate?: Date; endDate?: Date }): Promise<string> {
    const logger = getLogger('ACTIONS:ADMIN:ANALYTICS:GET_STRIPE_BALANCE');

    try {
        const supabase = await createAdminClient();

        if (filters?.endDate) {
            // Fetch all USD balance transactions up to endDate:
            const { data, error } = await supabase
                .from('stripe_balance_transactions') // Accessing the public view
                .select('amount')
                .eq('currency', 'usd')
                .lte('created', filters.endDate.toISOString());

            if (error) {
                logger.error(['Error retrieving Stripe balance transactions:', JSON.stringify(error)]);
                return '$0.00';
            }

            // Sum the amounts in application code:
            const sumAmount =
                data?.reduce((acc: number, transaction) => acc + (Number(transaction.amount) || 0), 0) || 0;

            // Format the balance to USD currency:
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
            }).format(sumAmount / 100); // Convert from cents to dollars
        } else {
            // Retrieve the current available balance from stripe_balance:
            const { data, error } = await supabase
                .from('stripe_balance') // Accessing the public view
                .select('amount')
                .eq('balance_type', 'available')
                .eq('currency', 'usd')
                .single();

            if (error) {
                logger.error(['Error retrieving Stripe balance:', JSON.stringify(error)]);
                return '$0.00';
            }

            const available = Number(data.amount) || 0;

            // Format the balance to USD currency:
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
            }).format(available / 100); // Convert from cents to dollars
        }
    } catch (error) {
        const standardizedError = isApiError(error) ? error : standardizeError(error);
        logger.error(['Error retrieving Stripe balance:', JSON.stringify(standardizedError)]);
        return '$0.00';
    }
}
