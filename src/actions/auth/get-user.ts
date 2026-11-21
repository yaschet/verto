/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { isApiError, standardizeError } from '@errors/api-errors';
import { getLogger } from '@services/logger';
import { createServerClient } from '@utils/supabase/server';
import { safeSingle } from '@utils/supabase/safe-single';
import type { Profile } from '@/types/auth/user';
import type { ApiResponseOrError } from '@/types/rest/response';
import type { User } from '@supabase/supabase-js';

export type UserResponse = {
    user: User | null;
    profile: Profile | null;
};

/**
 * Fetches the user profile and user information for the current authenticated user.
 *
 * @returns {Promise<ApiResponseOrError<{ profile: Profile | null; user: User | null }>>} The user profile and user information for the current authenticated user.
 */
export async function getUser(): Promise<
    ApiResponseOrError<{
        user: User | null;
        profile: Profile | null;
    }>
> {
    const logger = getLogger('ACTIONS:AUTH:GET_USER');
    try {
        const supabase = await createServerClient();

        const {
            data: { user: userData },
            error,
        } = await supabase.auth.getUser();

        if (error) {
            logger.error([
                'An error occurred while fetching the user information for the current authenticated user:',
                error,
            ]);
            return standardizeError(error);
        }

        if (error || !userData) {
            logger.debug('The user information could not be retrieved.');
            return standardizeError({
                code: 'UNAUTHENTICATED',
                data: { user: null, profile: null },
                description: 'The user information could not be retrieved.',
                message: 'User is not authenticated.',
                status: 401,
                title: 'User Not Authenticated',
            });
        }

        const { data: profileData, error: profileError } = await safeSingle(
            await supabase.from('profiles').select('*').eq('id', userData.id).single(),
        );

        if (profileError) {
            logger.error([
                'An error occurred while fetching the profile information for the current authenticated user:',
                profileError,
            ]);
            return standardizeError(profileError);
        }

        return {
            code: 'USER_RETRIEVED',
            data: { user: userData ?? null, profile: profileData ?? null },
            description: 'The user profile information has been successfully retrieved.',
            message: 'User profile retrieved successfully.',
            status: 200,
            title: 'User Profile Retrieved',
        };
    } catch (error) {
        const errorResponse = isApiError(error) ? error : standardizeError(error);
        logger.error([
            'An unexpected error occurred while fetching the profile information for the current authenticated user:',
            errorResponse,
        ]);
        return errorResponse;
    }
}

export async function getUserOnly(): Promise<
    | (Omit<ApiResponseOrError, 'data'> & {
          data: {
              user: User | null;
          };
      })
    | ApiResponseOrError
> {
    const logger = getLogger('ACTIONS:AUTH:GET_USER_ONLY');
    try {
        const supabase = await createServerClient();

        const {
            data: { user: userData },
            error,
        } = await supabase.auth.getUser();

        if (error || !userData) {
            logger.debug([
                'The user information could not be retrieved:',
                error ?? 'The user data is empty.',
            ]);
            return standardizeError({
                code: 'UNAUTHENTICATED',
                data: null,
                description: 'The user information could not be retrieved.',
                message: 'User is not authenticated.',
                status: 404,
                title: 'User Not Authenticated',
            });
        }

        return {
            code: 'USER_RETRIEVED',
            data: { user: userData },
            description: 'The user information has been successfully retrieved.',
            message: 'User retrieved.',
            status: 200,
            title: 'User Retrieved',
        };
    } catch (error) {
        const errorResponse = isApiError(error) ? error : standardizeError(error);
        logger.error([
            'An unexpected error occurred while fetching the information for the current authenticated user:',
            errorResponse,
        ]);
        return errorResponse;
    }
}
