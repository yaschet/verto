/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { validateUser } from '@/helpers/validate-user';
import { ApiError, standardizeError } from '@errors/api-errors';
import { getLogger } from '@services/logger';
import { createAdminClient, createServerClient } from '@utils/supabase/server';
import type { ApiResponseOrError } from '@/types/rest/response';

export async function closeUserAccount({ password }: { password: string }): Promise<ApiResponseOrError> {
    const logger = getLogger('ACTIONS:AUTH:CLOSE_ACCOUNT');

    try {
        await validateUser();

        // Create a connection to the Supabase server.
        const supabase = await createServerClient();

        const { user } = await validateUser();

        if (!password) {
            const errorResponse = standardizeError('PASSWORD_INVALID');
            logger.error(['Error closing the user account:', errorResponse]);
            return errorResponse;
        }

        // Verify the user's password.
        const { data: isValidPassword, error: isPasswordError } = (await supabase.rpc(
            'verify_user_password',
            {
                current_plain_password: password,
            },
        )) as unknown as ApiResponseOrError;

        if (isPasswordError || isValidPassword?.error === true) {
            const errorResponse = standardizeError('INCORRECT_PASSWORD');
            logger.error(['Failed to verify the user password:', errorResponse]);
            return errorResponse;
        }

        // ! - Auth Admin API:
        const supabaseAdmin = await createAdminClient();

        // Access Auth Admin API:
        const adminAuthClient = supabaseAdmin.auth.admin;

        // Delete the user account.
        const { error } = await adminAuthClient.deleteUser(user?.id, true);

        if (error) {
            const errorResponse = standardizeError(error);
            logger.error(['Failed to delete the user account:', error]);
            return errorResponse;
        }

        return {
            description: 'The account has been successfully deleted.',
            message: 'Account deletion was successful!',
            status: 200,
            success: true,
            title: 'Account Deletion Successful',
        };
    } catch (error) {
        const errorResponse = error instanceof ApiError ? error : standardizeError(error);
        logger.error(['Failed to close the user account:', errorResponse]);
        return errorResponse;
    }
}
