/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { validateUser } from '@/helpers/validate-user';
import { isApiError, standardizeError } from '@/src/errors/api-errors';
import { createAdminClient } from '@/src/utils/supabase/server';
import { getLogger } from '@/services/logger';
import type { UserRole } from '@/types/auth/user';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';

type CreateUserParams = {
    email: string;
    first_name: string;
    last_name: string;
    role: UserRole;
    password?: string;
    // Extended profile fields
    phone?: string;
    address?: string;
    address2?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
    date_of_birth?: string; // YYYY-MM-DD format
    company_name?: string;
    translation_experience?: string;
    qualifications?: string[];
    professional_affiliations?: string[];
    specializations?: string[];
    commercial_emails?: boolean;
};

export async function createUser(params: CreateUserParams): Promise<ApiResponseOrError> {
    const logger = getLogger('ACTIONS:ADMIN:USERS:CREATE');

    try {
        // 1. Validate that the requester is an ADMIN
        await validateUser({ requiredRole: 'ADMIN' });

        if (!params.password || params.password.length < 8) {
            throw standardizeError({
                code: 'INVALID_PASSWORD',
                title: 'Password Required',
                message: 'Provide a password containing at least eight characters.',
                status: 400,
            });
        }

        const supabase = await createAdminClient();

        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: params.email,
            password: params.password,
            email_confirm: true,
            user_metadata: {
                first_name: params.first_name,
                last_name: params.last_name,
                full_name: `${params.first_name} ${params.last_name}`,
                phone: params.phone,
                address: params.address,
                city: params.city,
                state: params.state,
                zip_code: params.zip_code,
                country: params.country,
                date_of_birth: params.date_of_birth,
                company_name: params.company_name,
                translation_experience: params.translation_experience,
                qualifications: JSON.stringify(params.qualifications ?? []),
                professional_affiliations: JSON.stringify(params.professional_affiliations ?? []),
                specializations: JSON.stringify(params.specializations ?? []),
            },
        });

        if (authError) {
            throw standardizeError(authError);
        }

        if (!authData.user) {
            throw standardizeError('UNKNOWN_ERROR', { message: 'Failed to create user in Auth system.' });
        }

        const userId = authData.user.id;

        // 3. Update the profile with all fields (Trigger creates profile but we update to ensure all fields are set)
        const { error: profileError } = await supabase
            .from('profiles')
            .update({
                first_name: params.first_name,
                last_name: params.last_name,
                email: params.email,
                phone: params.phone ?? null,
                address: params.address ?? null,
                city: params.city ?? null,
                state: params.state ?? null,
                zip_code: params.zip_code ?? null,
                country: params.country ?? null,
                date_of_birth: params.date_of_birth ?? null,
                company_name: params.company_name ?? null,
                translation_experience: params.translation_experience ?? 'Beginner',
                qualifications: params.qualifications ?? [],
                professional_affiliations: params.professional_affiliations ?? [],
                specializations: params.specializations ?? [],
                is_profile_complete: true,
            })
            .eq('id', userId);

        if (profileError) {
            logger.error(['Failed to update profile after user creation:', profileError]);
        }

        // 4. Assign Role
        // We need to insert into user_roles table
        const { error: roleError } = await supabase.from('user_roles').insert({
            user_id: userId,
            role: params.role,
        });

        if (roleError) {
            logger.error(['Failed to assign role:', roleError]);
            // Potentially rollback auth user creation? For now, just return error.
            throw standardizeError(roleError);
        }

        return {
            code: 'USER_CREATED',
            message: 'User created successfully.',
            status: 201,
            success: true,
            title: 'User Created',
            data: {
                user: {
                    id: userId,
                    email: params.email,
                    role: params.role,
                },
            },
        };
    } catch (error) {
        const errorResponse: ApiErrorType = isApiError(error)
            ? (error as ApiErrorType)
            : standardizeError(error);
        logger.error(['Failed to create user:', errorResponse]);
        return errorResponse;
    }
}
