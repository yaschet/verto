/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { validateUser } from '@/helpers/validate-user';
import { isApiError, standardizeError } from '@/src/errors/api-errors';
import { createServerClient } from '@/src/utils/supabase/server';
import { getLogger } from '@services/logger';
import type { CustomerRow, RawCustomerRow } from '@/src/schemas/customer-schemas';
import type { TranslationRow } from '@/src/schemas/translation-schemas';
import type { Tables } from '@/types/database/database';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';

/**
 * @async
 * @returns {Promise<ApiResponseOrError>}
 * @summary Deletes a Translation from the Database.
 */
export async function assignTranslationToCustomer({
    customerId,
    translationId,
}: {
    translationId: TranslationRow['id'];
    customerId?: CustomerRow['id'] | null;
}): Promise<ApiResponseOrError<Tables<'translations'>[]>> {
    const logger = getLogger('ACTIONS:SERVICES:TRANSLATIONS:UPDATE_TRANSLATION');

    try {
        // Check if the user is authenticated:
        const { user } = await validateUser();

        if (!translationId) {
            const errorResponse = standardizeError({
                description: 'The translation ID is missing.',
                message: 'Translation ID is missing.',
                status: 400,
                success: false,
                title: 'Missing Translation ID',
            });
            logger.error(['Error assigning the translation:', errorResponse]);
            return errorResponse;
        }

        const supabase = await createServerClient();

        // Insert the new newsletter subscription:
        const { error } = await supabase
            .from('translations')
            .update({ customer_id: customerId ?? null })
            .eq('id', translationId)
            .eq('profile_id', user.id);

        if (error) {
            const errorResponse = standardizeError(error);
            logger.error(['Error assigning the translation:', errorResponse]);
            return errorResponse;
        }

        return {
            description: 'The translation has been successfully deleted.',
            message: 'Translation successfully deleted.',
            status: 201,
            success: true,
            title: 'Translation Deleted',
        };
    } catch (error) {
        const errorResponse: ApiErrorType = isApiError(error)
            ? (error as ApiErrorType)
            : standardizeError(error);
        logger.error(['Error deleting the translation:', errorResponse]);
        return errorResponse;
    }
}

/**
 * @async
 * @returns {Promise<ApiResponseOrError>}
 * @summary Lists customers to assign to a translation.
 */
export async function getAssignableCustomers(): Promise<
    | ApiResponseOrError<
          {
              id: RawCustomerRow['id'];
              display_name: RawCustomerRow['display_name'];
              email: RawCustomerRow['email'];
          }[]
      >
    | ApiErrorType
> {
    const logger = getLogger('ACTIONS:SERVICES:TRANSLATIONS:LIST_CUSTOMERS_TO_ASSIGN');

    try {
        // Check if the user is authenticated:
        const { user } = await validateUser();

        const supabase = await createServerClient();

        // Insert the new newsletter subscription:
        const { data, error } = await supabase
            .from('customers')
            .select('id, display_name, email')
            .eq('profile_id', user.id);

        if (error) {
            const errorResponse = standardizeError(error);
            logger.error(['Error listing the customers:', errorResponse]);
            return errorResponse;
        }

        return {
            data: data ?? [],
            description: 'The customers have been successfully listed.',
            message: 'Customers listed successfully.',
            status: 200,
            success: true,
            title: 'Customers Listed',
        };
    } catch (error) {
        const errorResponse: ApiErrorType = isApiError(error)
            ? (error as ApiErrorType)
            : standardizeError(error);
        logger.error(['Error listing the customers:', errorResponse]);
        return errorResponse;
    }
}
