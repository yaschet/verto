/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { validateUser } from '@/helpers/validate-user';
import {
    type TransactionsHistoryFilterState,
    defaultTransactionsHistoryFilterState,
} from '@/src/stores/filtering-store';
import { isApiError, standardizeError } from '@errors/api-errors';
import { getRange } from '@library/utils';
import { transactionsHistoryFilterSchema } from '@schemas/billing-schemas';
import { getLogger } from '@services/logger';
import { createServerClient } from '@utils/supabase/server';
import type { CreditsTransaction } from '@/types/core/billing';
import type { ApiErrorType } from '@/types/rest/errors';

export type CreditsTransactionsQueryData = {
    data: CreditsTransaction[];
    pageParam: number;
    nextCursor: number;
    prevCursor: number;
};

export type CreditsTransactionsQueryResponse = CreditsTransactionsQueryData & ApiErrorType;

/**
 * **NOTE:** This is a server-side service and should not be called from the client-side.
 *
 * @async
 * @returns {Promise<CreditsTransactionsQueryResponse>} -- A promise that resolves to the credits transactions data or
 *   an error,
 * @summary Gets the credits transactions for the current user from the Database.
 */
export async function getInfiniteCreditsTransactions(
    {
        filters = defaultTransactionsHistoryFilterState,
        pageParam,
        pageSize,
    }: { pageParam?: number; pageSize?: number; filters?: TransactionsHistoryFilterState } = {
        pageParam: 0,
        pageSize: 10,
    },
): Promise<CreditsTransactionsQueryResponse> {
    const logger = getLogger('SERVICES:CREDITS:GET_CREDITS_TRANSACTIONS');

    try {
        const { user } = await validateUser();
        const supabase = await createServerClient();
        const range = getRange(pageParam ?? 0, pageSize ?? 10);

        // Validate filters
        const parsedFilters = transactionsHistoryFilterSchema?.parse(filters);

        // Build the query
        let query = supabase
            .from('credits_transactions')
            .select('*')
            .eq('profile_id', user.id)
            .order('created_at', { ascending: false })
            .range(range.start, range.end);

        // Apply transactionType filters
        if (parsedFilters.transactionType) {
            const transactionTypes = Object.keys(parsedFilters?.transactionType).filter(
                (key) =>
                    parsedFilters?.transactionType[
                        key as keyof TransactionsHistoryFilterState['transactionType']
                    ],
            );
            if (transactionTypes.length > 0) {
                query = query.in('type', transactionTypes);
            }
        }

        // Apply amountRange filters
        if (parsedFilters.amountRange) {
            if (parsedFilters.amountRange.min !== undefined) {
                query = query.gte('credits', parsedFilters.amountRange.min);
            }
            if (parsedFilters.amountRange.max !== undefined) {
                query = query.lte('credits', parsedFilters.amountRange.max);
            }
        }

        // Apply dateRange filters
        if (parsedFilters.dateRange) {
            if (parsedFilters.dateRange.start) {
                query = query.gte('created_at', parsedFilters.dateRange.start.toISOString());
            }
            if (parsedFilters.dateRange.end) {
                query = query.lte('created_at', parsedFilters.dateRange.end.toISOString());
            }
        }

        logger.info([
            'Fetching the credits transactions with filters:',
            { range, pageParam, pageSize, filters },
        ]);

        const { data: postgresData, error: postgresError } = await query;

        if (postgresError) {
            const standardError = standardizeError(postgresError);
            logger.error(['Error fetching the credits transactions:', standardError]);
            return standardError as CreditsTransactionsQueryResponse;
        }

        const hasMore = (postgresData?.length ?? 0) === (pageSize ?? 10);

        return {
            nextCursor: hasMore ? (pageParam ?? 0) + (pageSize ?? 10) : null,
            pageParam: pageParam ?? 0,
            prevCursor: (pageParam ?? 0) - (pageSize ?? 10),
            data: postgresData ?? [],
        } as CreditsTransactionsQueryResponse;
    } catch (error) {
        const errorResponse: ApiErrorType = isApiError(error)
            ? (error as ApiErrorType)
            : standardizeError(error);
        logger.error(['Error fetching the credits transactions:', errorResponse]);
        return errorResponse as CreditsTransactionsQueryResponse;
    }
}
