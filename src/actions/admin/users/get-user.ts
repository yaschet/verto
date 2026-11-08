/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { validateUser } from '@/helpers/validate-user';
import { isApiError, standardizeError } from '@/src/errors/api-errors';
import { createServerClient } from '@/src/utils/supabase/server';
import { getLogger } from '@services/logger';
import type { AdminUserRow } from '@/src/schemas/admin-user-schemas';
import type { UserRole } from '@/types/auth/user';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';

export type AdminUserDetails = AdminUserRow & {
    credits: number;
    last_active_at: string | null;
};

/**
 * `getUser`: Fetches a single user's comprehensive profile data.
 *
 * @param userId - The ID of the user to fetch.
 * @returns The user's profile, role, credits, and active status.
 */
export async function getUser(userId: string): Promise<ApiResponseOrError<AdminUserDetails>> {
    const logger = getLogger('ACTIONS:ADMIN:USERS:GET_USER');
    const supabase = await createServerClient();

    try {
        // Check if the user is authenticated and has admin role:
        await validateUser({ requiredRole: 'ADMIN' });

        if (!userId) {
            return standardizeError({
                code: 'INVALID_PARAMETERS',
                description: 'User ID is required.',
                message: 'User ID is required.',
                status: 400,
                title: 'Invalid Parameters',
            });
        }

        // 1. Fetch Profile Data
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (profileError) {
            const errorResponse = standardizeError(profileError);
            logger.error(['Failed to fetch user profile:', errorResponse]);
            return errorResponse;
        }

        if (!profile) {
            return standardizeError({
                code: 'NOT_FOUND',
                description: 'User profile not found.',
                message: 'User profile not found.',
                status: 404,
                title: 'Not Found',
            });
        }

        // 2. Fetch User Role
        const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userId)
            .single();

        if (roleError && roleError.code !== 'PGRST116') {
            // Ignore "Row not found" error for role, just set to null
            logger.error(['Failed to fetch user role:', standardizeError(roleError)]);
        }

        const role = (roleData?.role as UserRole) || null;

        // 3. Fetch Credits
        const { data: creditsData, error: creditsError } = await supabase
            .from('credits')
            .select('amount')
            .eq('profile_id', userId)
            .single();

        if (creditsError && creditsError.code !== 'PGRST116') {
            logger.error(['Failed to fetch user credits:', standardizeError(creditsError)]);
        }

        const credits = creditsData?.amount ?? 0;

        // 4. Fetch Last Active (from active_users table)
        const { data: activeData, error: activeError } = await supabase
            .from('active_users')
            .select('last_active')
            .eq('profile_id', userId)
            .single();

        if (activeError && activeError.code !== 'PGRST116') {
            logger.error(['Failed to fetch active user status:', standardizeError(activeError)]);
        }

        const last_active_at = activeData?.last_active ?? null;

        const userDetails: AdminUserDetails = {
            ...profile,
            role,
            credits,
            last_active_at,
        };

        return {
            data: userDetails,
            description: 'User details retrieved successfully.',
            message: 'User details retrieved successfully.',
            status: 200,
            success: true,
            title: 'User Details Retrieved',
        };
    } catch (error) {
        const errorResponse: ApiErrorType = isApiError(error)
            ? (error as ApiErrorType)
            : standardizeError(error);
        logger.error([
            'The service has failed to fetch the user details, due to the following error:',
            errorResponse,
        ]);
        return errorResponse;
    }
}
