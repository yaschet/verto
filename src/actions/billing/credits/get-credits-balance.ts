/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { validateUser } from '@/helpers/validate-user';
import { isApiError, standardizeError } from '@errors/api-errors';
import { getLogger } from '@services/logger';
import { createServerClient } from '@utils/supabase/server';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';

/**
 * This server action gets the credits balance for the current user from the Database.
 *
 * @async
 * @returns {Promise<ApiResponseOrError>} -- A promise that resolves to the credits balance data or an error,
 * @summary Gets the credits balance for the current user from the Database.
 */
export async function getCreditsBalance(): Promise<
    ApiResponseOrError<{
        balance: number;
    }>
> {
    const logger = getLogger('SERVICES:CREDITS:GET_CREDITS_BALANCE');

    try {
        const { user } = await validateUser();

        const supabase = await createServerClient();

        const { data: postgresData, error: postgresError } = await supabase
            .from('credits')
            .select('*')
            .eq('profile_id', user.id)
            .limit(1)
            .single();

        if (postgresError) {
            const standardError = standardizeError(postgresError);
            logger.error(['Error fetching the credits balance:', standardError]);
            return standardError;
        }

        return {
            code: 'CREDITS_BALANCE_RETRIEVED',
            data: {
                balance: postgresData?.amount ?? 0,
            },
            description: 'The credits balance has been successfully retrieved.',
            message: 'Credits balance successfully retrieved.',
            status: 200,
            success: true,
            title: 'Credits Balance Retrieved',
        };
    } catch (error) {
        const errorResponse: ApiErrorType = isApiError(error)
            ? (error as ApiErrorType)
            : standardizeError(error);
        logger.error(['Error fetching the credits balance:', errorResponse]);
        return errorResponse;
    }
}
