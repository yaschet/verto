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
 * @summary Deletes a Customer from the Database.
 */
export async function deleteCustomer({
    id,
}: {
    id: string | null;
}): Promise<ApiResponseOrError<Tables<'customers'>[]>> {
    'use server';

    const logger = getLogger('ACTIONS:SERVICES:CUSTOMERS:DELETE_CUSTOMER');

    try {
        const { user } = await validateUser();

        if (!id) {
            logger.error('Customer ID is missing.');
            return standardizeError({
                description: 'The customer ID is missing.',
                message: 'Customer ID is missing.',
                status: 400,
                success: false,
                title: 'Customer ID Missing',
            });
        }

        const supabase = await createServerClient();

        // Insert the new newsletter subscription:
        const { error } = await supabase.from('customers').delete().eq('id', id).eq('profile_id', user.id);

        if (error) {
            logger.error(['Error deleting the customer:', error]);
            return standardizeError(error);
        }

        return {
            description: 'The customer has been successfully deleted.',
            message: 'Customer successfully deleted.',
            status: 200,
            success: true,
            title: 'Customer Deletion Successful',
        };
    } catch (error) {
        const errorResponse = isApiError(error) ? error : standardizeError(error);
        logger.error(['Error deleting the customer:', errorResponse]);
        return errorResponse;
    }
}

/**
 * @async
 * @returns {Promise<ApiResponseOrError>}
 * @summary Deletes multiple Customers from the Database.
 */
export async function deleteCustomers({
    ids,
}: {
    ids: string[] | null;
}): Promise<ApiResponseOrError<Tables<'customers'>[]>> {
    const logger = getLogger('ACTIONS:SERVICES:CUSTOMERS:DELETE_MULTIPLE_CUSTOMERS');

    try {
        // Check if the user is authenticated:
        const { user } = await validateUser();

        if (!ids || ids.length === 0) {
            logger.error('The customer IDs are missing.');
            return standardizeError({
                description: 'The customer IDs are missing.',
                message: 'Customer IDs missing.',
                status: 400,
                success: false,
                title: 'Customer IDs Missing',
            });
        }

        const supabase = await createServerClient();

        // Insert the new newsletter subscription:
        const { error } = await supabase.from('customers').delete().in('id', ids).eq('profile_id', user.id);

        if (error) {
            logger.error(['Error deleting the customers:', error]);
            return standardizeError(error);
        }

        revalidatePath('/app/customers');

        return {
            description: 'The customers have been successfully deleted.',
            message: 'Customers successfully deleted.',
            status: 200,
            success: true,
            title: 'Customer Deletion Successful',
        };
    } catch (error) {
        const errorResponse = isApiError(error) ? error : standardizeError(error);
        logger.error(['Error deleting the customers:', errorResponse]);
        return errorResponse;
    }
}
