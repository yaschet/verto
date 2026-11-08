/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { after } from 'next/server';
import { logUserActivity } from '@/helpers/activity-logger';
import { validateUser } from '@/helpers/validate-user';
import { ApiError, standardizeError } from '@errors/api-errors';
import { getLogger } from '@services/logger';
import { createServerClient } from '@utils/supabase/server';
import type { ApiResponseOrError } from '@/types/rest/response';

export async function changeUserEmail(email: string): Promise<ApiResponseOrError> {
    const logger = getLogger('ACTIONS:AUTH:CHANGE_EMAIL');
    try {
        const { user } = await validateUser();

        logger.info(`Changing the email address to [${email}] for the current authenticated user.`);

        const supabase = await createServerClient();

        const { data, error } = await supabase.auth.updateUser({
            email,
        });

        if (error) {
            const errorResponse = standardizeError(error);
            logger.error(['Failed to change the email address:', errorResponse]);
            return errorResponse;
        }

        after(async () => {
            await logUserActivity(user.id, 'changed_email', {
                newEmail: email,
            });
        });

        return {
            data,
            description: 'A verification link has been sent to your new email address for confirmation.',
            message: 'The email verification link has been successfully sent.',
            status: 202,
            success: true,
        };
    } catch (error) {
        const errorResponse = error instanceof ApiError ? error : standardizeError(error);
        logger.error(['Failed to change the email address:', errorResponse]);
        return errorResponse;
    }
}
