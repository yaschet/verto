/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { revalidatePath } from 'next/cache';
import { validateUser } from '@/helpers/validate-user';
import { isApiError, standardizeError } from '@/src/errors/api-errors';
import { createServerClient } from '@/src/utils/supabase/server';
import { getLogger } from '@services/logger';
import type { Tables } from '@/types/database/database';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';

/**
 * @async
 * @returns {Promise<ApiResponseOrError>}
 * @summary Suspends a User (sets status to SUSPENDED).
 */
export async function suspendUser({ id }: { id: string }): Promise<ApiResponseOrError<Tables<'profiles'>[]>> {
    const logger = getLogger('ACTIONS:ADMIN:USERS:SUSPEND_USER');

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

        // Suspend user: Update status to SUSPENDED
        const { data: updatedProfile, error } = await supabase
            .from('profiles')
            .update({
                account_status: 'SUSPENDED',
            })
            .eq('id', id)
            .select();

        if (error) {
            const errorResponse = standardizeError(error);
            logger.error(['Error suspending the user:', errorResponse]);
            return errorResponse;
        }

        // Log to audit_log_entries
        await supabase.from('audit_log_entries').insert({
            id: crypto.randomUUID(),
            payload: {
                action: 'SUSPEND_USER',
                actor_id: currentUser.id,
                target_id: id,
                changes: {
                    account_status: 'SUSPENDED',
                },
                timestamp: new Date().toISOString(),
            },
            ip_address: '0.0.0.0',
        });

        revalidatePath('/admin/users');

        return {
            data: updatedProfile,
            description: 'The user account has been suspended.',
            message: 'User account suspended successfully.',
            status: 200,
            success: true,
            title: 'User Suspended Successful',
        };
    } catch (error) {
        const errorResponse: ApiErrorType = isApiError(error)
            ? (error as ApiErrorType)
            : standardizeError(error);
        logger.error(['Error suspending the user:', errorResponse]);
        return errorResponse;
    }
}
