/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { revalidatePath } from 'next/cache';
import { validateUser } from '@/helpers/validate-user';
import { isApiError, standardizeError } from '@/src/errors/api-errors';
import { createServerClient } from '@/src/utils/supabase/server';
import { getLogger } from '@services/logger';
import type { Tables } from '@/types/database/database';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';

type UpdateUserParams = {
    id: string;
    // Required fields
    email?: string;
    first_name?: string;
    last_name?: string;
    role?: string;
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
    // Password update (optional)
    password?: string;
};

/**
 * @async
 * @returns {Promise<ApiResponseOrError>}
 * @summary Updates a User Profile in the Database.
 */
export async function updateUser(
    params: UpdateUserParams,
): Promise<ApiResponseOrError<Tables<'profiles'>[]>> {
    const logger = getLogger('ACTIONS:ADMIN:USERS:UPDATE_USER');

    try {
        // Check if the user is authenticated and has admin role:
        const { user: currentUser } = await validateUser({ requiredRole: 'ADMIN' });

        if (!params.id) {
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

        const supabase = await createServerClient();

        // Build profile update object with only provided fields
        const profileUpdate: Record<string, unknown> = {};

        if (params.email !== undefined) profileUpdate.email = params.email;
        if (params.first_name !== undefined) profileUpdate.first_name = params.first_name;
        if (params.last_name !== undefined) profileUpdate.last_name = params.last_name;
        if (params.phone !== undefined) profileUpdate.phone = params.phone;
        if (params.address !== undefined) profileUpdate.address = params.address;
        if (params.city !== undefined) profileUpdate.city = params.city;
        if (params.state !== undefined) profileUpdate.state = params.state;
        if (params.zip_code !== undefined) profileUpdate.zip_code = params.zip_code;
        if (params.country !== undefined) profileUpdate.country = params.country;
        if (params.date_of_birth !== undefined) profileUpdate.date_of_birth = params.date_of_birth;
        if (params.company_name !== undefined) profileUpdate.company_name = params.company_name;
        if (params.translation_experience !== undefined)
            profileUpdate.translation_experience = params.translation_experience;
        if (params.qualifications !== undefined) profileUpdate.qualifications = params.qualifications;
        if (params.professional_affiliations !== undefined)
            profileUpdate.professional_affiliations = params.professional_affiliations;
        if (params.specializations !== undefined) profileUpdate.specializations = params.specializations;

        // Update the profile
        const { data: updatedProfile, error } = await supabase
            .from('profiles')
            .update(profileUpdate)
            .eq('id', params.id)
            .select();

        if (error) {
            const errorResponse = standardizeError(error);
            logger.error(['Error updating the user:', errorResponse]);
            return errorResponse;
        }

        // Update role if provided
        if (params.role !== undefined) {
            const { error: roleError } = await supabase
                .from('user_roles')
                .update({ role: params.role })
                .eq('user_id', params.id);

            if (roleError) {
                logger.error(['Error updating user role:', roleError]);
            }
        }

        // Log to audit_log_entries
        await supabase.from('audit_log_entries').insert({
            id: crypto.randomUUID(),
            payload: {
                action: 'UPDATE_USER',
                actor_id: currentUser.id,
                target_id: params.id,
                changes: profileUpdate,
                timestamp: new Date().toISOString(),
            },
            ip_address: '0.0.0.0',
        });

        revalidatePath('/admin/users');
        revalidatePath(`/admin/users/${params.id}`);

        return {
            data: updatedProfile,
            description: 'The user has been successfully updated.',
            message: 'User updated successfully.',
            status: 200,
            success: true,
            title: 'User Update Successful',
        };
    } catch (error) {
        const errorResponse: ApiErrorType = isApiError(error)
            ? (error as ApiErrorType)
            : standardizeError(error);
        logger.error(['Error updating the user:', errorResponse]);
        return errorResponse;
    }
}
