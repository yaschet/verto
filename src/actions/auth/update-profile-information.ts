/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { validateUser } from '@/helpers/validate-user';
import { isApiError, standardizeError } from '@errors/api-errors';
import { getLogger } from '@services/logger';
import { createServerClient } from '@utils/supabase/server';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';
import type { User } from '@supabase/supabase-js';

export async function updateProfileInformation(userData: User): Promise<ApiResponseOrError<User | null>> {
    const logger = getLogger('ACTIONS:AUTH:UPDATE_PROFILE_INFORMATION');
    try {
        await validateUser();

        logger.info(`The user is updating their profile.`);

        const supabase = await createServerClient();

        const {
            data: { user },
            error,
        } = await supabase.auth.updateUser({
            data: {
                address: userData.user_metadata.address,
                city: userData.user_metadata.city,
                company_name: userData.user_metadata.company_name,
                country: userData.user_metadata.country,
                date_of_birth: userData.user_metadata.date_of_birth,
                first_name: userData.user_metadata.first_name,
                full_name: `${userData.user_metadata.first_name} ${userData.user_metadata.last_name}`,
                last_name: userData.user_metadata.last_name,
                name: `${userData.user_metadata.first_name} ${userData.user_metadata.last_name}`,
                phone: userData.user_metadata.phone,
                professional_affiliations: userData.user_metadata.professional_affiliations,
                qualifications: userData.user_metadata.qualifications,
                specializations: userData.user_metadata.specializations,
                state: userData.user_metadata.state,
                years_of_translation_experience: userData.user_metadata.years_of_translation_experience,
                zipCode: userData.user_metadata.zipCode,
            },
            email: userData.email,
            phone: userData.phone,
        });

        if (error) {
            const errorObject = standardizeError(error);
            logger.error(
                'An error occurred while updating the profile information for the current authenticated user:',
            );
            logger.error({
                error,
                originalErrorMessage: error.message,
                thrown: errorObject,
            });
            return errorObject;
        }

        return {
            code: 'PROFILE_UPDATED',
            data: user,
            description: 'Your profile information has been updated successfully.',
            message: 'Profile information updated successfully.',
            status: 200,
            success: true,
        };
    } catch (error) {
        const errorResponse: ApiErrorType = isApiError(error)
            ? (error as ApiErrorType)
            : standardizeError(error);
        logger.error(["An unexpected error occurred while updating the user's account:", errorResponse]);
        return errorResponse;
    }
}
