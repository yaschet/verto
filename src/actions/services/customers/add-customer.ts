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
import type { ApiResponseOrError } from '@/types/rest/response';

/**
 * @async
 * @returns {Promise<ApiResponseOrError>}
 * @summary Adds a new Customer to the Database.
 */
export async function addCustomer({
    display_name,
    email,
    phone,
}: {
    display_name: string;
    email: string;
    phone: string | null | undefined;
}): Promise<ApiResponseOrError<Tables<'customers'>[]>> {
    'use server';
    const logger = getLogger('ACTIONS:SERVICES:CUSTOMERS:ADD_CUSTOMER');

    try {
        // Get the current authenticated user:
        const { profile } = await validateUser();

        const supabase = await createServerClient();

        // First, check if the email already exists in the database:
        const { data: existingCustomers, error: existingCustomersError } = await supabase
            .from('customers')
            .select('*')
            .eq('email', email)
            .eq('profile_id', profile?.id ?? undefined);

        if (existingCustomersError) {
            logger.error(['Error getting existing customers:', existingCustomersError]);
            return standardizeError(existingCustomersError);
        }

        if (existingCustomers && existingCustomers.length > 0) {
            logger.error('The email address is already associated with another customer.');
            return standardizeError({
                description: 'The email address is already associated with another customer.',
                message: 'Email address already exists.',
                status: 409,
                success: false,
                title: 'Email Address Conflict',
            });
        }

        // Insert the new customer:
        const { error } = await supabase.from('customers').insert([
            {
                display_name,
                email,
                phone,
                ...(profile?.id && { profile_id: profile.id }),
            },
        ]);

        if (error) {
            logger.error(['Error adding the customer:', error]);
            return standardizeError(error);
        }

        revalidatePath('/app/customers');

        return {
            description: 'A new customer has been successfully added.',
            message: 'Customer successfully added.',
            status: 201,
            success: true,
            title: 'Customer Addition Successful',
        };
    } catch (error) {
        const errorResponse = isApiError(error) ? error : standardizeError(error);
        logger.error(['Error adding the customer:', errorResponse]);
        return errorResponse;
    }
}
