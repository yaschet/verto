/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { getLogger } from '@/services/logger';
import { isApiError, standardizeError } from '@errors/api-errors';
import { getQueryClient } from '@queries/tanstack/query-client';
import { createServerClient } from '@utils/supabase/server';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';

export const signOut: () => Promise<ApiResponseOrError> = async () => {
    const logger = getLogger('ACTIONS:AUTH:SIGN_OUT');
    try {
        const supabase = await createServerClient();
        const queryClient = getQueryClient();

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            const errorResponse: ApiResponseOrError = standardizeError(userError || 'USER_NOT_FOUND');

            return errorResponse;
        }

        const { error } = await supabase.auth.signOut();

        if (error) {
            const errorResponse: ApiResponseOrError = standardizeError(error);

            return errorResponse;
        }

        // Clear the query client to remove any stale data.
        queryClient.clear();
        await queryClient.resetQueries().then((r) => r);

        return {
            code: 'SIGNED_OUT',
            description: 'You have been signed out.',
            message: 'Successfully signed out!',
            status: 200,
            success: true,
        };
    } catch (error) {
        const errorResponse: ApiErrorType = isApiError(error)
            ? (error as ApiErrorType)
            : standardizeError(error);
        logger.error(['An unexpected error occurred while signing the user out:', errorResponse]);
        return errorResponse;
    }
};
