/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { env } from '@/env';

import { validateUser } from '@/helpers/validate-user';
import { isApiError, standardizeError } from '@/src/errors/api-errors';
import { createServerClient } from '@/src/utils/supabase/server';
import { getLogger } from '@services/logger';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';

/**
 * @async
 * @returns {Promise<ApiResponseOrError>}
 * @summary Triggers a password reset email for a user.
 */
export async function resetPassword({
    email,
    id,
}: {
    id: string;
    email: string;
}): Promise<ApiResponseOrError<null>> {
    const logger = getLogger('ACTIONS:ADMIN:USERS:RESET_PASSWORD');

    try {
        // Check if the user is authenticated and has admin role:
        const { user: currentUser } = await validateUser({ requiredRole: 'ADMIN' });

        if (!email) {
            const errorResponse = standardizeError({
                description: 'Email is required but missing.',
                message: 'Missing Email.',
                status: 400,
                success: false,
                title: 'Email Missing',
            });
            return errorResponse;
        }

        const supabase = await createServerClient();

        // Trigger password reset email
        // Note: This usually works as a public endpoint, but calling it from server side is fine.
        // We might want to use the admin API if we want to generate a link without sending email,
        // but the requirement says "Reset password sends valid email with reset link".
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/account/settings`,
        });

        if (error) {
            const errorResponse = standardizeError(error);
            logger.error(['Error sending password reset email:', errorResponse]);
            return errorResponse;
        }

        // Log to audit_log_entries
        await supabase.from('audit_log_entries').insert({
            id: crypto.randomUUID(),
            payload: {
                action: 'RESET_PASSWORD',
                actor_id: currentUser.id,
                target_id: id,
                changes: {
                    email,
                },
                timestamp: new Date().toISOString(),
            },
            ip_address: '0.0.0.0',
        });

        return {
            data: null,
            description: `A password reset email has been sent to ${email}.`,
            message: 'Password reset email sent.',
            status: 200,
            success: true,
            title: 'Password Reset Sent',
        };
    } catch (error) {
        const errorResponse: ApiErrorType = isApiError(error)
            ? (error as ApiErrorType)
            : standardizeError(error);
        logger.error(['Error resetting password:', errorResponse]);
        return errorResponse;
    }
}
