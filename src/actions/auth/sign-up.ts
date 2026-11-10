/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { generateGravatarUrl } from '@/src/library/utils';
import { isApiError, standardizeError } from '@errors/api-errors';
import { RegisterSchema } from '@schemas/auth-schemas';
import { getLogger } from '@services/logger';
import { createBrowserClient } from '@utils/supabase/client';
import type { RegistrationDataType } from '@/types/auth/registration';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { z } from 'zod';

const validateRegistrationData = (values: RegistrationDataType) => {
    const validationResult = RegisterSchema.safeParse(values);
    if (!validationResult.success) {
        throw standardizeError('INVALID_FIELDS', { error: validationResult.error });
    }
    return validationResult.data;
};

const createSupabaseClient = () => {
    return createBrowserClient();
};

const registerUser = async (supabase: SupabaseClient, validFields: z.infer<typeof RegisterSchema>) => {
    const { data, error } = await supabase.auth.signUp({
        email: validFields.contactInformation.email,
        options: {
            data: {
                address: validFields.contactInformation.address,
                avatar_url: generateGravatarUrl(validFields.contactInformation.email),
                city: validFields.contactInformation.city,
                company_name: validFields.professionalInformation.companyName,
                country: validFields.contactInformation.country,
                date_of_birth: validFields.personalInformation.dateOfBirth,
                first_name: validFields.personalInformation.firstName,
                is_profile_complete: true,
                last_name: validFields.personalInformation.lastName,
                phone: validFields.contactInformation.phoneNumber,
                professional_affiliations: validFields.professionalInformation.professionalAffiliations,
                qualifications: validFields.professionalInformation.qualifications,
                role: 'user',
                specializations: validFields.professionalInformation.specializations,
                state: validFields.contactInformation.state,
                translation_experience: validFields.professionalInformation.translationExperience,
                zip_code: validFields.contactInformation.zipCode,
            },
        },
        password: validFields.accountSecurity.password,
        phone: validFields.contactInformation.phoneNumber,
    });

    if (error) {
        throw standardizeError(error);
    }

    return data;
};

export const signUp: (values: RegistrationDataType) => Promise<ApiResponseOrError> = async (values) => {
    const logger = getLogger('ACTIONS:AUTH:REGISTER');

    try {
        const validFields = validateRegistrationData(values);
        const supabase = createSupabaseClient();
        const data = await registerUser(supabase, validFields);

        if (data?.user?.id && data?.user.email) {
            return {
                code: 'CONFIRMATION_EMAIL_SENT',
                description: 'Please check your email to verify your account.',
                message: 'Confirmation email sent!',
                status: 200,
                success: true,
                data: {
                    user: {
                        id: data.user.id,
                        email: data.user.email,
                    },
                },
            };
        }

        return standardizeError('UNKNOWN_ERROR', { data });
    } catch (error) {
        const errorResponse: ApiErrorType = isApiError(error)
            ? (error as ApiErrorType)
            : standardizeError(error);
        logger.error(['An unexpected error occurred while deleting the user account:', errorResponse]);
        return errorResponse;
    }
};
