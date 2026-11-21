/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { env } from '@/src/env';
import { standardizeError } from '@errors/api-errors';
import { getQueryClient } from '@queries/tanstack/query-client';
import { PasswordSignInSchema } from '@schemas/auth-schemas';
import { getLogger } from '@services/logger';
import { createServerClient } from '@utils/supabase/server';
import type { Profile } from '@/types/auth/user';
import type { ApiResponseOrError } from '@/types/rest/response';
import type { Provider, Session, User } from '@supabase/supabase-js';
import type * as z from 'zod';

export type SignInWithPasswordResponse = ApiResponseOrError<
    | {
          session: Session | null | undefined;
          user: User | null | undefined;
          profile: Profile | null | undefined;
      }
    | null
    | undefined
>;

/**
 * Sign in with email and password.
 *
 * @param {z.infer<typeof PasswordSignInSchema>} values The email and password to sign in with.
 *
 * @returns {Promise<SignInWithPasswordResponse>}
 */
export const signInWithPassword: (
    values: z.infer<typeof PasswordSignInSchema>,
) => Promise<SignInWithPasswordResponse> = async (
    values: z.infer<typeof PasswordSignInSchema>,
): Promise<SignInWithPasswordResponse> => {
    const logger = getLogger('ACTIONS:AUTH:LOGIN:PASSWORD');
    const queryClient = getQueryClient();

    try {
        const validationResult = await PasswordSignInSchema.safeParseAsync(values);

        if (!validationResult.success) {
            const errorObject: ApiResponseOrError = standardizeError('INVALID_FIELDS', {
                error: validationResult.error,
            });
            logger.error(errorObject);
            return errorObject;
        }

        const supabase = await createServerClient();

        const {
            data: { email, password },
        } = validationResult;

        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            const resolvedError = standardizeError('INVALID_CREDENTIALS');
            logger.error(['Failed to sign in with password:', error]);
            return resolvedError;
        }

        const { session, user } = data;

        if (session) {
            logger.info(['User has successfully logged in:', { user }]);
        }

        if (user?.id && !user?.confirmed_at) {
            return {
                code: 'EMAIL_NOT_CONFIRMED',
                description: 'We have sent you an email to confirm your email address.',
                message: 'Your email is not confirmed!',
                status: 401,
                title: 'Email Not Confirmed',
            };
        } else if (user?.id && user?.confirmed_at) {
            if (user?.factors && user?.factors.length > 0) {
                return {
                    code: 'MFA_REQUIRED',
                    description: 'Please enter the code sent to your email address.',
                    message: 'Multi-Factor Authentication is required!',
                    status: 401,
                    success: true,
                };
            }

            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileError) {
                logger.error([
                    'An error occurred while fetching the profile information for the user trying to log in:',
                    profileError,
                ]);
                return standardizeError({
                    code: 'PROFILE_ERROR',
                    description: 'An error occurred while getting the profile information.',
                    message: 'Failed to get profile information!',
                    title: 'Profile Error',
                    status: 500,
                });
            }

            if (profileData?.status === 'SUSPENDED') {
                await supabase.auth.signOut();
                return {
                    code: 'ACCOUNT_SUSPENDED',
                    description: 'Your account has been suspended. Please contact support.',
                    message: 'Account Suspended',
                    status: 403,
                    success: false,
                    title: 'Account Suspended',
                };
            }

            const response: ApiResponseOrError = {
                code: 'LOGIN_SUCCESS',
                data: { session, user, profile: profileData },
                description: 'You have successfully logged in.',
                message: 'Login is successful!',
                status: 200,
                success: true,
            };

            logger.info(response);

            queryClient.clear();
            await queryClient.invalidateQueries().then((r) => r);

            return response;
        }

        return standardizeError('UNKNOWN_ERROR');
    } catch (error) {
        const errorResponse = standardizeError(error);
        logger.error(['Failed to sign in with password:', errorResponse]);
        return errorResponse;
    }
};

export const signInWithGoogle: () => Promise<
    ApiResponseOrError<{
        provider: Provider;
        url: string;
    }>
> = async () => {
    const logger = getLogger('ACTIONS:AUTH:LOGIN:OAUTH:GOOGLE');

    try {
        const supabase = await createServerClient();

        const { data, error } = await supabase.auth.signInWithOAuth({
            options: {
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
                redirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback`,
            },
            provider: 'google',
        });

        if (error) {
            const errorResponse = standardizeError(error);
            logger.error(['Failed to sign in with Google:', errorResponse]);
            return errorResponse;
        }

        if (data?.url) {
            const response = {
                code: 'OAUTH_REDIRECT',
                data,
                description: 'Redirecting you to Google for authentication.',
                message: 'Redirecting to Google...',
                status: 302,
                success: true,
            };

            logger.info(response);

            return response;
        }

        const errorResponse = standardizeError('UNKNOWN_ERROR', {
            data,
            error,
            traceId: 'An unknown error occurred while logging in with OAuth!',
        });
        logger.error(['Failed to sign in with Google:', errorResponse]);
        return errorResponse;
    } catch (error) {
        const errorResponse = standardizeError(error);
        logger.error(['Failed to sign in with Google:', errorResponse]);
        return errorResponse;
    }
};

export async function signInWithGoogleOneTap(credential: string): Promise<ApiResponseOrError> {
    const logger = getLogger('ACTIONS:AUTH:LOGIN:OAUTH:GOOGLE:HANDLER');
    // Handle the sign-in response.
    try {
        const supabase = await createServerClient();
        const { data, error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: credential,
        });

        if (error) {
            const errorResponse = standardizeError(error);
            logger.error(['Failed to handle sign in with Google:', errorResponse]);
            return errorResponse;
        }

        return {
            code: 'LOGIN_SUCCESS',
            data,
            description: 'You have successfully logged in with Google.',
            message: 'Login is successful!',
            status: 200,
            success: true,
        };
    } catch (error) {
        const errorResponse = standardizeError(error);
        logger.error(['Failed to handle sign in with Google:', errorResponse]);
        return errorResponse;
    }
}

export const signInWithFacebook: () => Promise<
    ApiResponseOrError<{
        provider: Provider;
        url: string;
    }>
> = async () => {
    const logger = getLogger('ACTIONS:AUTH:LOGIN:OAUTH:FACEBOOK');

    try {
        const supabase = await createServerClient();

        const { data, error } = await supabase.auth.signInWithOAuth({
            options: {
                redirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback`,
            },
            provider: 'facebook',
        });

        if (error) {
            const errorResponse = standardizeError(error);
            logger.error(['Failed to sign in with Facebook:', errorResponse]);
            return errorResponse;
        }

        if (data?.url) {
            const response = {
                code: 'OAUTH_REDIRECT',
                data,
                description: 'Redirecting you to Facebook for authentication.',
                message: 'Redirecting to Facebook...',
                status: 302,
                success: true,
            };

            logger.info(response);

            return response;
        }

        const errorResponse = standardizeError('UNKNOWN_ERROR', {
            data,
            error,
            message: 'An unknown error occurred while logging in with OAuth!',
        });
        logger.error(['Failed to sign in with Facebook:', errorResponse]);
        return errorResponse;
    } catch (error) {
        const errorResponse = standardizeError(error);
        logger.error(['Failed to sign in with Facebook:', errorResponse]);
        return errorResponse;
    }
};
