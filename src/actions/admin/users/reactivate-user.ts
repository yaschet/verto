/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { revalidatePath } from 'next/cache';
import { getLogger } from '@/services/logger';
import { validateUser } from '@/helpers/validate-user';
import { isApiError, standardizeError } from '@errors/api-errors';
import { createServerClient } from '@utils/supabase/server';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';
import type { Tables } from '@/types/database/database';

/**
 * @async
 * @returns {Promise<ApiResponseOrError>}
 * @summary Reactivates a User (sets status to OFFLINE).
 */
export async function reactivateUser({
    id,
}: {
    id: string;
}): Promise<ApiResponseOrError<Tables<'profiles'>[]>> {
    const logger = getLogger('ACTIONS:ADMIN:USERS:REACTIVATE_USER');

    try {
        // Check if the user is authenticated and has admin role:
        const { user: currentUser } = await validateUser({ requiredRole: 'ADMIN' });

        if (!id) {
            const errorResponse = standardizeError({
                description: 'User ID is required but missing.',
                message: 'Missing User ID.',
                status: 400,
                success: false,
                title: 'User ID Missing',
            });

            logger.error(['User ID is required but missing.', errorResponse]);
            return errorResponse;
        }

        const supabase = await createServerClient();

        // Reactivate user: Update status to OFFLINE (safest default)
        const { data: updatedProfile, error } = await supabase
            .from('profiles')
            .update({
                account_status: 'ACTIVE',
            })
            .eq('id', id)
            .select();

        if (error) {
            const errorResponse = standardizeError(error);
            logger.error(['Error reactivating the user:', errorResponse]);
            return errorResponse;
        }

        // Log to audit_log_entries
        await supabase.from('audit_log_entries').insert({
            id: crypto.randomUUID(),
            payload: {
                action: 'REACTIVATE_USER',
                actor_id: currentUser.id,
                target_id: id,
                changes: {
                    account_status: 'ACTIVE',
                },
                timestamp: new Date().toISOString(),
            },
            ip_address: '0.0.0.0',
        });

        revalidatePath('/admin/users');

        return {
            data: updatedProfile,
            description: 'The user account has been reactivated.',
            message: 'User account reactivated successfully.',
            status: 200,
            success: true,
            title: 'User Reactivated Successful',
        };
    } catch (error) {
        const errorResponse: ApiErrorType = isApiError(error)
            ? (error as ApiErrorType)
            : standardizeError(error);
        logger.error(['Error reactivating the user:', errorResponse]);
        return errorResponse;
    }
}
