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
 * ### Change the password for the current authenticated user.
 *
 * Do not use this method to change the password for other users.
 *
 * @param {string} currentPassword The current password for the authenticated user, must be correct to proceed.
 * @param {string} newPassword The new password for the authenticated user, must be strong and secure enough to meet the
 *   requirements, see {@link checkPasswordStrength}.
 * @returns {Promise<ApiResponseOrError>} The response object with the status of the action.
 */
export async function changeUserPassword(
    currentPassword: string,
    newPassword: string,
): Promise<ApiResponseOrError> {
    const logger = getLogger('ACTIONS:AUTH:CHANGE_PASSWORD');
    try {
        await validateUser();

        const supabase = await createServerClient();

        // First, verify the current password.
        const { data: isValidOldPassword, error: isPasswordError } = (await supabase.rpc(
            'verify_user_password',
            {
                current_plain_password: currentPassword,
            },
        )) as unknown as ApiResponseOrError;

        logger.info({ 'RPC Data': isValidOldPassword, 'RPC Error': isPasswordError });

        if (isPasswordError || isValidOldPassword?.error === true) {
            const errorResponse = standardizeError('INCORRECT_PASSWORD');
            logger.error(['Failed to change the password:', errorResponse]);
            return errorResponse;
        }

        // Update the password if the current password is correct:
        const { error } = await supabase.auth.updateUser({
            password: newPassword,
        });

        if (error) {
            const errorResponse = standardizeError(error);
            logger.error(['Failed to change the password:', errorResponse]);
            return errorResponse;
        }

        return {
            code: 'PASSWORD_CHANGED',
            description: 'You will need to sign in again using your new password.',
            message: 'Password has been successfully changed.',
            status: 200,
            success: true,
            title: 'Password Changed',
        };
    } catch (error) {
        const errorResponse = isApiError(error) ? error : standardizeError(error);
        logger.error(['Failed to change the password:', errorResponse]);
        return errorResponse;
    }
}

/**
 * ### Set the password for the current authenticated user.
 *
 * Do not use this method to set the password for other users.
 *
 * @param {string} password The new password for the authenticated user, must be strong and secure enough to meet the
 *   requirements, see {@link checkPasswordStrength}.
 * @returns {Promise<ApiResponseOrError>} The response object with the status of the action.
 */
export async function setUserPassword(password: string): Promise<ApiResponseOrError> {
    const logger = getLogger('ACTIONS:AUTH:SET_PASSWORD');
    try {
        const supabase = await createServerClient();

        // Update the password if the current password is correct:
        const { error } = await supabase.auth.updateUser({
            password,
        });

        if (error) {
            const errorResponse = standardizeError(error);
            logger.error(['Failed to set the password:', errorResponse]);
            return errorResponse;
        }

        return {
            code: 'PASSWORD_SET',
            description: 'You will need to sign in again using your new password.',
            message: 'Password has been successfully set.',
            status: 200,
            success: true,
            title: 'Password Set Successfully',
        };
    } catch (error) {
        const errorResponse = isApiError(error) ? error : standardizeError(error);
        logger.error(['Failed to set the password:', errorResponse]);
        return errorResponse;
    }
}

export async function checkIfUserHasPassword(): Promise<boolean> {
    const logger = getLogger('ACTIONS:AUTH:CHECK_IF_USER_HAS_PASSWORD');
    try {
        const supabase = await createServerClient();

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
            const errorResponse = standardizeError(userError);
            logger.warn(['Failed to get the user:', errorResponse]); // Warn is appropriate here, could be session expiry.
            return false;
        }

        const userId = user?.id;

        if (!userId) {
            // No user found - this is valid for unauthenticated visitors.
            logger.debug(['User not found when checking for password. This is expected for public routes.']);
            return false;
        }

        const { data, error: hasError } = (await supabase.rpc('check_user_has_password', {
            user_id: userId,
        })) as unknown as ApiResponseOrError;

        if (hasError || data?.error === true) {
            const errorResponse = standardizeError(hasError);
            logger.error(['Failed to check if the user has a password:', errorResponse]); // Keep as error, RPC failure is real.
            return false;
        }

        return data.code === 'HAS_PASSWORD';
    } catch (error) {
        const errorResponse = isApiError(error) ? error : standardizeError(error);
        logger.error(['Failed to check if the user has a password:', errorResponse]);
        return false;
    }
}
