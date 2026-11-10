/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { validateUser } from '@/helpers/validate-user';
import { isApiError, standardizeError } from '@errors/api-errors';
import { getLogger } from '@services/logger';
import { createServerClient } from '@utils/supabase/server';
import type { ApiResponseOrError } from '@/types/rest/response';

/**
 * Reset the password for the current user.
 *
 * @param {string} newPassword
 * @returns {any} {Promise<ApiResponseOrError>}
 * @export
 */
export async function resetPassword(newPassword: string): Promise<ApiResponseOrError> {
    const logger = getLogger('ACTIONS:AUTH:RESET_PASSWORD');
    try {
        await validateUser();

        const supabase = await createServerClient();

        const { data, error } = await supabase.auth.updateUser({
            password: newPassword,
        });

        if (error) {
            const errorResponse = isApiError(error) ? error : standardizeError(error);
            logger.error(['Failed to reset the password:', errorResponse]);
            return errorResponse;
        }

        return {
            data,
            description: 'You will need to sign in again with your new password.',
            message: 'Password reset successful!',
            status: 200,
            success: true,
        };
    } catch (error) {
        const errorResponse = isApiError(error) ? error : standardizeError(error);
        logger.error(['Failed to reset the password:', errorResponse]);
        return errorResponse;
    }
}
