/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { validateUser } from '@/helpers/validate-user';
import { API_ERROR_CODES, ApiError, isApiError, standardizeError } from '@errors/api-errors';
import { getLogger } from '@services/logger';
import { createAdminClient, createServerClient } from '@utils/supabase/server';
import type { ApiResponseOrError } from '@/types/rest/response';
import type {
    AuthMFAEnrollResponse,
    AuthenticatorAssuranceLevels,
    Factor,
    MFAEnrollParams,
    User,
} from '@supabase/supabase-js';

export async function createAndVerifyMfaChallenge(
    factorId: string,
    code: string,
): Promise<
    ApiResponseOrError<{
        access_token: string;
        token_type: string;
        expires_in: number;
        refresh_token: string;
        user: User;
    }>
> {
    const logger = getLogger('ACTIONS:AUTH:MFA:CREATE_AND_VERIFY_MFA_CHALLENGE');
    try {
        await validateUser();

        const supabase = await createServerClient();

        const { data, error } = await supabase.auth.mfa.challengeAndVerify({
            code,
            factorId,
        });

        if (error) {
            logger.error([
                'Failed to create and verify the MFA challenge for the current authenticated user:',
                error,
            ]);
            return standardizeError(error);
        }

        return {
            data,
            description: 'The MFA challenge and verification has been successful.',
            message: 'MFA challenge and verification successful.',
            title: 'MFA Challenge and Verification Successful',
            status: 200,
            success: true,
        };
    } catch (error) {
        const errorResponse = error instanceof ApiError ? error : standardizeError(error);
        logger.error([
            'Failed to create and verify the MFA challenge for the current authenticated user:',
            errorResponse,
        ]);
        return errorResponse;
    }
}

export async function deleteUnverifiedMfaFactor(
    factorId: string,
): Promise<ApiResponseOrError<{ id: string }>> {
    const logger = getLogger('ACTIONS:DELETE_UNVERIFIED_MFA_FACTOR');

    try {
        const supabase = await createServerClient();

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            logger.error(['The user is not authenticated.']);
            return standardizeError('UNAUTHENTICATED');
        }

        // No AAL2 check required - this is for cleanup of unverified factors only
        if (!factorId || factorId === '') {
            logger.error(['The provided factor ID is invalid.']);
            return standardizeError('INVALID_FACTOR_ID');
        }

        const supabaseAdmin = await createAdminClient();
        const adminAuthClient = supabaseAdmin.auth.admin;

        // Verify the factor is unverified before deleting
        const { data: factorsData } = await adminAuthClient.mfa.listFactors({ userId: user.id });
        const factor = factorsData?.factors?.find((f) => f.id === factorId);

        if (!factor) {
            // Factor doesn't exist, treat as success (already cleaned up)
            return {
                data: { id: factorId },
                description: 'Factor not found or already removed.',
                message: 'Cleanup complete.',
                status: 200,
                success: true,
            };
        }

        if (factor.status === 'verified') {
            // Don't delete verified factors via this method
            logger.warn(['Attempted to delete verified factor via cleanup method.']);
            return standardizeError('INVALID_OPERATION');
        }

        const { data, error } = await adminAuthClient.mfa.deleteFactor({ id: factorId, userId: user.id });

        if (error) {
            logger.error(['Failed to delete unverified MFA factor:', error]);
            return standardizeError(error);
        }

        return {
            data,
            description: 'Unverified MFA factor cleaned up.',
            message: 'Cleanup complete.',
            status: 200,
            success: true,
        };
    } catch (error) {
        const errorResponse = isApiError(error) ? error : standardizeError(error);
        logger.error(['Failed to cleanup unverified MFA factor:', errorResponse]);
        return errorResponse;
    }
}

export async function deleteMfaFactor(factorId: string): Promise<ApiResponseOrError<{ id: string }>> {
    const logger = getLogger('ACTIONS:DELETE_USER_MFA_FACTOR');

    try {
        // Create a connection to the Supabase server.
        const supabase = await createServerClient();

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            logger.error(['The user is not authenticated.']);
            return standardizeError('UNAUTHENTICATED');
        }

        // Check user assurance level, should be 'aal2' or higher.
        const { data: userAssurance, error: assuranceError } =
            await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

        if (userAssurance?.currentLevel !== 'aal2' || assuranceError) {
            logger.error(['User does not have the required assurance level to delete the MFA factor.']);
            return standardizeError('INSUFFICIENT_AAL');
        }

        // Check if the factorId is valid.
        if (!factorId || factorId === '') {
            logger.error(['The provided factor ID is invalid.']);
            return standardizeError('INVALID_FACTOR_ID');
        }

        // ! - Auth Admin API:
        const supabaseAdmin = await createAdminClient();

        // Access auth admin api
        const adminAuthClient = supabaseAdmin.auth.admin;

        // Delete the user account.
        const { data, error } = await adminAuthClient.mfa.deleteFactor({ id: factorId, userId: user.id });

        if (error) {
            logger.error(['Failed to delete the MFA factor for the user:', error]);
            return standardizeError(error);
        }

        return {
            data,
            description: 'You have successfully deleted the MFA factor for the user.',
            message: 'MFA factor deleted.',
            title: 'MFA Factor Deleted',
            status: 200,
            success: true,
        };
    } catch (error) {
        const errorResponse = isApiError(error) ? error : standardizeError(error);
        logger.error(['Failed to delete the MFA factor:', errorResponse]);
        return errorResponse;
    }
}

export async function enrollMfaFactor(
    factorFriendlyName: MFAEnrollParams['friendlyName'],
): Promise<ApiResponseOrError<AuthMFAEnrollResponse['data']>> {
    const logger = getLogger('ACTIONS:AUTH:MFA:ENROLL_MFA_FACTOR');
    try {
        const supabase = await createServerClient();

        const { data, error } = await supabase.auth.mfa.enroll({
            factorType: 'totp',
            friendlyName: factorFriendlyName,
        });

        if (error) {
            logger.error(['Failed to enroll the MFA factor for the current authenticated user:', error]);
            return standardizeError(error);
        }

        return {
            data,
            description: 'The MFA factor has been enrolled successfully.',
            message: 'MFA factor enrolled successfully.',
            title: 'MFA Factor Enrolled',
            status: 200,
            success: true,
        };
    } catch (error) {
        const errorResponse = isApiError(error) ? error : standardizeError(error);
        logger.error(['Failed to enroll the MFA factor for the current authenticated user:', errorResponse]);
        return errorResponse;
    }
}

export async function listMfaFactors(): Promise<ApiResponseOrError<{ factors: Factor[] }>> {
    const logger = getLogger('ACTIONS:AUTH:MFA:LIST_USER_MFA_FACTORS');

    try {
        // Create a connection to the Supabase server.
        const supabase = await createServerClient();

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            const errorResponse = API_ERROR_CODES.UNAUTHENTICATED;
            logger.error(errorResponse);
            return errorResponse;
        }

        // ! - Auth Admin API:
        const supabaseAdmin = await createAdminClient();

        // Access auth admin api
        const adminAuthClient = supabaseAdmin.auth.admin;

        // Delete the user account.
        const { data, error } = await adminAuthClient.mfa.listFactors({ userId: user.id });

        if (error) {
            logger.error(['Failed to list the MFA factors for the user:', error]);
            return standardizeError(error);
        }

        return {
            data,
            description: 'You have successfully listed the MFA factors for the user.',
            message: 'MFA factors listed.',
            status: 200,
            success: true,
        };
    } catch (error) {
        const errorResponse = error instanceof ApiError ? error : standardizeError(error);
        logger.error(['An unexpected error occurred while deleting the user account:', errorResponse]);
        return errorResponse;
    }
}

export async function getAALLevel(): Promise<
    ApiResponseOrError<{
        currentLevel: AuthenticatorAssuranceLevels | null;
        nextLevel: AuthenticatorAssuranceLevels | null;
    }>
> {
    const logger = getLogger('PAGES:AUTH:MFA:CHALLENGE:GET_AAL_LEVEL');
    try {
        const supabase = await createServerClient();
        const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

        if (error) {
            const errorResponse = standardizeError(error);
            logger.error(['Error fetching AAL level in MFA Challenge page:', error]);
            return errorResponse;
        }

        return {
            data,
            description: 'The AAL level has been fetched successfully.',
            message: 'AAL level fetched successfully.',
            status: 200,
            success: true,
        };
    } catch (error) {
        const errorResponse = isApiError(error) ? error : standardizeError(error, { source: 'getAALLevel' });
        logger.error(['Error fetching AAL level in MFA Challenge page:', errorResponse]);
        return errorResponse;
    }
}
