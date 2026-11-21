/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { validateUser } from '@/helpers/validate-user';
import { isApiError, standardizeError } from '@/src/errors/api-errors';
import { createAdminClient } from '@/src/utils/supabase/server';
import { getLogger } from '@services/logger';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';
import type { Factor } from '@supabase/supabase-js';

const logger = getLogger('ACTIONS:ADMIN:USERS:MANAGE_MFA');

/**
 * Lists all MFA factors enrolled for a specific user.
 * Admin-only operation.
 */
export async function adminListUserMfaFactors({
    userId,
}: {
    userId: string;
}): Promise<ApiResponseOrError<Factor[]>> {
    try {
        await validateUser({ requiredRole: 'ADMIN' });
        const supabase = await createAdminClient();

        const { data, error } = await supabase.auth.admin.mfa.listFactors({
            userId,
        });

        if (error) {
            const errorResponse = standardizeError(error);
            logger.error(['Error listing MFA factors:', errorResponse]);
            return errorResponse;
        }

        return {
            data: data?.factors ?? [],
            message: 'MFA factors retrieved successfully.',
            status: 200,
            success: true,
        };
    } catch (error) {
        const errorResponse: ApiErrorType = isApiError(error)
            ? (error as ApiErrorType)
            : standardizeError(error);
        logger.error(['Error listing MFA factors:', errorResponse]);
        return errorResponse;
    }
}

/**
 * Deletes a specific MFA factor from a user's account.
 * Admin-only operation - does not require user's MFA verification.
 */
export async function adminDeleteUserMfaFactor({
    userId,
    factorId,
}: {
    userId: string;
    factorId: string;
}): Promise<ApiResponseOrError<null>> {
    try {
        const { user: admin } = await validateUser({ requiredRole: 'ADMIN' });
        const supabase = await createAdminClient();

        const { error } = await supabase.auth.admin.mfa.deleteFactor({
            id: factorId,
            userId,
        });

        if (error) {
            const errorResponse = standardizeError(error);
            logger.error(['Error deleting MFA factor:', errorResponse]);
            return errorResponse;
        }

        // Audit log
        await supabase.from('audit_log_entries').insert({
            id: crypto.randomUUID(),
            payload: {
                action: 'DELETE_USER_MFA_FACTOR',
                actor_id: admin.id,
                target_id: userId,
                changes: { factor_id: factorId },
                timestamp: new Date().toISOString(),
            },
            ip_address: '0.0.0.0',
        });

        logger.info(['MFA factor deleted by admin', { adminId: admin.id, userId, factorId }]);

        return {
            data: null,
            description: 'The MFA factor has been removed from the user account.',
            message: 'MFA factor removed successfully.',
            status: 200,
            success: true,
            title: 'MFA Factor Removed',
        };
    } catch (error) {
        const errorResponse: ApiErrorType = isApiError(error)
            ? (error as ApiErrorType)
            : standardizeError(error);
        logger.error(['Error deleting MFA factor:', errorResponse]);
        return errorResponse;
    }
}
