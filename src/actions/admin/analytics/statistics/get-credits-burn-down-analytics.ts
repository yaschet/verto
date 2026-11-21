/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { validateUser } from '@/helpers/validate-user';
import { isApiError, standardizeError } from '@errors/api-errors';
import { getLogger } from '@services/logger';
import { createAdminClient } from '@utils/supabase/server';
import type { CreditsTransactionType } from '@/types/core/billing';
import type { ApiResponseOrError } from '@/types/rest/response';

export type AdminCreditTransaction = {
    credits: number;
    type: CreditsTransactionType;
    time: number;
};

/**
 * Get the Credit Transaction History, including transaction types and amounts for line chart display.
 *
 * @returns {Promise<ApiResponseOrError<{ credits: number; type: string; time: number }[]>>} - A promise that resolves to the credit transaction history
 *   data or an error.
 */
export async function getCreditsBurnDownAnalytics({
    endDate,
    startDate,
}: {
    startDate?: Date;
    endDate?: Date;
} = {}): Promise<ApiResponseOrError<AdminCreditTransaction[]>> {
    const logger = getLogger('ACTIONS:ADMIN:GET_CREDIT_HISTORY');

    try {
        await validateUser({
            requiredRole: 'ADMIN',
        });

        const supabase = await createAdminClient();

        const query = supabase
            .from('credits_transactions')
            .select('credits, type, created_at')
            .order('created_at', { ascending: false });

        if (startDate) {
            query.gte('created_at', startDate.toISOString());
        }

        if (endDate) {
            query.lte('created_at', endDate.toISOString());
        }

        // Increase the limit and sort by most recent first
        const { data, error } = await query.order('created_at', { ascending: false }).range(0, 9999);

        if (error) {
            const resolvedError = standardizeError(error);
            logger.error(['Error occurred while fetching credit transaction history.', resolvedError]);
            return resolvedError;
        }

        // Map the transactions to the format required for the line chart
        const transactionHistory: AdminCreditTransaction[] = data.map((transaction) => ({
            credits: transaction.credits,
            type: transaction.type,
            time: new Date(transaction.created_at).getTime(),
        }));

        return {
            data: transactionHistory ?? [],
            description: "Admin Users' Credit transaction history retrieved successfully.",
            message: 'Transaction history successfully retrieved.',
            status: 200,
            success: true,
        };
    } catch (error) {
        const errorResponse = isApiError(error) ? error : standardizeError(error);
        logger.error(['Error occurred while fetching credit transaction history.', errorResponse]);
        return errorResponse;
    }
}
