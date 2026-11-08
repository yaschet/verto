/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { titleCase } from 'title-case';
import { env } from '@/src/env';
import { ApiError, standardizeError } from '@errors/api-errors';
import { getLogger } from '@services/logger';
import { createServerClient } from '@utils/supabase/server';
import type { ApiResponseOrError } from '@/types/rest/response';
import type { ResendParams } from '@supabase/supabase-js';

export async function resendConfirmationEmail(
    email: string,
    type: 'signup' | 'email_change' = 'signup',
    options: ResendParams['options'] = {
        emailRedirectTo: `${env.NEXT_PUBLIC_APP_URL}/app/dashboard`,
    },
): Promise<ApiResponseOrError> {
    const logger = getLogger('ACTIONS:AUTH:RESEND_CONFIRMATION_EMAIL');
    try {
        const supabase = await createServerClient();

        const { data, error } = await supabase.auth.resend({
            email,
            options,
            type,
        });

        if (error) {
            const errorResponse = standardizeError(error);
            logger.error(['Failed to resend the confirmation email:', errorResponse]);
            return errorResponse;
        }

        return {
            data,
            description: 'You can now check your email for the confirmation link.',
            message: titleCase('Confirmation email sent successfully'),
            status: 202,
            success: true,
        };
    } catch (error) {
        const errorResponse = error instanceof ApiError ? error : standardizeError(error);
        logger.error(['Failed to resend the confirmation email:', errorResponse]);
        return errorResponse;
    }
}
