/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { revalidatePath } from 'next/cache';
import { validateUser } from '@/helpers/validate-user';
import { isApiError, standardizeError } from '@/src/errors/api-errors';
import { createServerClient } from '@/src/utils/supabase/server';
import { getLogger } from '@services/logger';
import type { RawCustomerRow } from '@/src/schemas/customer-schemas';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';

/**
 * @async
 * @returns {Promise<ApiResponseOrError>}
 * @summary Updates a Customer in the Database.
 */
export async function updateCustomer({
    display_name,
    email,
    id,
    phone,
}: {
    id: string | null | undefined;
    display_name: string;
    email: string;
    phone: string | null | undefined;
}): Promise<ApiResponseOrError<RawCustomerRow[]>> {
    const logger = getLogger('ACTIONS:SERVICES:CUSTOMERS:UPDATE_CUSTOMER');

    try {
        // Check if the user is authenticated:
        const { user } = await validateUser();

        if (!id) {
            const errorResponse = standardizeError({
                description: 'Customer ID is required but missing.',
                message: 'Missing Customer ID.',
                status: 400,
                success: false,
                title: 'Customer ID Missing',
            });

            logger.error(['Customer ID is required but missing.', errorResponse]);
            return errorResponse;
        }

        const supabase = await createServerClient();

        // First, check if the email already exists in the database:
        const { data: existingCustomers, error: existingCustomersError } = await supabase
            .from('customers')
            .select('*')
            .eq('email', email)
            .neq('id', id)
            .eq('profile_id', user.id);

        if (existingCustomersError) {
            const errorResponse = standardizeError(existingCustomersError);
            logger.error(['Error updating the customer:', errorResponse]);
            return errorResponse;
        }

        if (existingCustomers && existingCustomers.length > 0) {
            const errorResponse = standardizeError({
                description: 'This email address is already associated with another customer.',
                message: 'Email address already in use.',
                status: 200,
                success: true,
                title: 'Email Already Exists',
            });
            logger.error(['This email address is already associated with another customer.', errorResponse]);
            return errorResponse;
        }

        // Insert the new newsletter subscription:
        const { error } = await supabase
            .from('customers')
            .update({
                display_name,
                email,
                phone,
            })
            .eq('id', id)
            .eq('profile_id', user.id);

        if (error) {
            const errorResponse = standardizeError(error);
            logger.error(['Error updating the customer:', errorResponse]);
            return errorResponse;
        }

        revalidatePath('/app/customers');

        return {
            description: 'The customer has been successfully updated in the database.',
            message: 'Customer updated successfully.',
            status: 201,
            success: true,
            title: 'Customer Update Successful',
        };
    } catch (error) {
        const errorResponse: ApiErrorType = isApiError(error)
            ? (error as ApiErrorType)
            : standardizeError(error);
        logger.error(['Error updating the customer:', errorResponse]);
        return errorResponse;
    }
}
