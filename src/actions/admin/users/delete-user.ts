/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { revalidatePath } from 'next/cache';
import { validateUser } from '@/helpers/validate-user';
import { isApiError, standardizeError } from '@/src/errors/api-errors';
import { createAdminClient } from '@/src/utils/supabase/server';
import { getLogger } from '@services/logger';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';

/**
 * @async
 * @returns {Promise<ApiResponseOrError>}
 * @summary Permanently deletes a User (Hard Delete).
 */
export async function deleteUser({ id }: { id: string }): Promise<ApiResponseOrError<null>> {
    const logger = getLogger('ACTIONS:ADMIN:USERS:DELETE_USER');

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

        // Use Admin Client to delete from Auth (cascades to public.profiles usually)
        const supabase = await createAdminClient();

        // Check if deleting self
        if (currentUser.id === id) {
            const errorResponse = standardizeError({
                description: 'You cannot delete your own account from the admin panel.',
                message: 'Cannot delete self.',
                status: 403,
                success: false,
                title: 'Action Forbidden',
            });
            return errorResponse;
        }

        const { error } = await supabase.auth.admin.deleteUser(id);

        if (error) {
            const errorResponse = standardizeError(error);
            logger.error(['Error deleting the user:', errorResponse]);
            return errorResponse;
        }

        // Log to audit_log_entries (if we want to keep a record, though the actor is kept)
        // Since we have admin client, we can insert into audit log even if RLS might be tricky,
        // but usually audit logs are insert-only or handled via triggers.
        // We'll skip manual insert for now or assume triggers handle it,
        // OR insert before deletion if we want to track who did it.
        // But if user is gone, target_id might hang.

        revalidatePath('/admin/users');

        return {
            data: null,
            description: 'The user account has been permanently deleted.',
            message: 'User account deleted successfully.',
            status: 200,
            success: true,
            title: 'User Deleted',
        };
    } catch (error) {
        const errorResponse: ApiErrorType = isApiError(error)
            ? (error as ApiErrorType)
            : standardizeError(error);
        logger.error(['Error deleting the user:', errorResponse]);
        return errorResponse;
    }
}
