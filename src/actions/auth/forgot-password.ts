/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { headers } from 'next/headers';
import { ApiError, standardizeError } from '@errors/api-errors';
import { getLogger } from '@services/logger';
import { createServerClient } from '@utils/supabase/server';
import type { ApiResponseOrError } from '@/types/rest/response';

/**
 * ### Send a password reset email to the user.
 *
 * This method sends a password reset email to the user with the given email address.
 *
 * @param {string} email The email address of the user.
 * @returns {Promise<ApiResponseOrError>} The response object with the status of the action.
 */
export async function forgotPassword(email: string): Promise<ApiResponseOrError> {
    const logger = getLogger('ACTIONS:AUTH:FORGOT_PASSWORD');
    try {
        const supabase = await createServerClient();
        const origin = (await headers()).get('origin');

        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${origin}/auth/reset-password`,
        });

        if (error) {
            const errorResponse = standardizeError(error);
            logger.error(['Failed to send the password reset email:', errorResponse, error]);
            return errorResponse;
        }

        return {
            data,
            description:
                'Please check your inbox for the password reset email. It may take a few minutes to arrive.',
            message: 'Password reset email has been sent successfully.',
            status: 202,
            success: true,
            title: 'Password Reset Email Sent',
        };
    } catch (error) {
        const errorResponse = error instanceof ApiError ? error : standardizeError(error);
        logger.error(['Failed to send the password reset email:', errorResponse]);
        return errorResponse;
    }
}
