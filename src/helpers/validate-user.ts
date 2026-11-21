/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { getServerProfile, getServerUser, getUserRole } from '@/helpers/user';
import { standardizeError } from '@errors/api-errors';
import { getLogger } from '@services/logger';
import type { Profile, UserRole } from '@/types/auth/user';
import type { User } from '@supabase/supabase-js';

type ValidateUserOptions = {
    requiredRole?: UserRole;
};

type ValidateUserResponse = {
    profile: Profile;
    user: User;
};

/**
 * Validates the current authenticated user and returns the user and profile information.
 *
 * @category Auth
 * @category Actions
 * @example
 *     ```ts
 *     const { profile, user } = await validateUser();
 *     ```;
 *
 * @returns The user and profile information for the current authenticated user.
 * @throws ApiErrorType - An error if the user is not authenticated or if the user information could not be retrieved.
 * @note This helper action is only available on the server.
 */
export async function validateUser(options?: ValidateUserOptions): Promise<ValidateUserResponse> {
    const logger = getLogger('ACTIONS:AUTH:VALIDATE_USER');

    const userData = await getServerUser();

    if (!userData) {
        logger.warn('User authentication failed: No user found');
        throw standardizeError({
            code: 'UNAUTHENTICATED',
            message: 'User is not authenticated.',
            status: 401,
            title: 'User Not Authenticated',
            description: 'Please log in to access this resource.',
        });
    }

    // Use cached getServerProfile to avoid duplicate profiles fetches
    const profileData = await getServerProfile();

    if (!profileData) {
        logger.error('Failed to retrieve user profile');
        throw standardizeError({
            code: 'PROFILE_NOT_FOUND',
            message: 'User profile could not be retrieved.',
            status: 404,
            title: 'Profile Not Found',
            default: 'An error occurred while retrieving the user profile.',
        });
    }

    if (profileData.account_status === 'SUSPENDED') {
        logger.warn(`Suspended user attempt: ${userData.id}`);
        throw standardizeError({
            code: 'USER_SUSPENDED',
            message: 'Your account has been suspended.',
            status: 403,
            title: 'Account Suspended',
            description: 'Your account is suspended. Please contact support for assistance.',
        });
    }

    if (options?.requiredRole) {
        const role = await getUserRole(userData.id);
        if (role !== options.requiredRole) {
            logger.debug(`User lacks required role: ${options.requiredRole}`);
            throw standardizeError(
                {
                    code: 'UNAUTHORIZED_ACTION',
                    message: 'You do not have permission to perform this action.',
                    status: 403,
                    title: 'Unauthorized Action',
                    description: 'You do not have the required permissions to perform this action.',
                },
                {
                    data: { userId: userData.id, role, requiredRole: options.requiredRole },
                    additional: 'User lacks required role.',
                },
            );
        }
    }

    return { profile: profileData, user: userData };
}
