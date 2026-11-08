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

/**
 * @async
 * @returns {Promise<ApiResponseOrError>}
 * @summary Deletes a Translation from the Database.
 */
export async function deleteTranslation({
    id,
}: {
    id: string | null;
}): Promise<ApiResponseOrError<Tables<'translations'>[]>> {
    const logger = getLogger('ACTIONS:SERVICES:TRANSLATIONS:UPDATE_TRANSLATION');

    try {
        const { user } = await validateUser();

        if (!id) {
            const errorResponse = standardizeError({
                description: 'The translation ID is missing.',
                message: 'Translation ID is missing.',
                status: 400,
                success: false,
                title: 'Missing Translation ID',
            });
            logger.error(['Error deleting the translation:', errorResponse]);
            return errorResponse;
        }

        const supabase = await createServerClient();

        // Insert the new newsletter subscription:
        const { error } = await supabase.from('translations').delete().eq('id', id).eq('profile_id', user.id);

        if (error) {
            const errorResponse = standardizeError(error);
            logger.error(['Error deleting the translation from the database: ', errorResponse]);
            return errorResponse;
        }

        return {
            description: 'The translation has been successfully deleted.',
            message: 'Translation deleted successfully.',
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
 * @summary Deletes multiple Translations from the Database.
 */
export async function deleteTranslations({
    ids,
}: {
    ids: string[] | null;
}): Promise<ApiResponseOrError<Tables<'translations'>[]>> {
    const logger = getLogger('ACTIONS:SERVICES:TRANSLATIONS:UPDATE_TRANSLATION');

    try {
        // Check if the user is authenticated:
        const { user } = await validateUser();

        if (!ids || ids.length === 0) {
            const errorResponse = standardizeError({
                description: 'Translation IDs are missing.',
                message: 'No translation IDs provided.',
                status: 400,
                success: false,
                title: 'Missing Translation IDs',
            });
            logger.error(['Failed to delete translations:', errorResponse]);
            return errorResponse;
        }

        const supabase = await createServerClient();

        // Insert the new newsletter subscription:
        const { error } = await supabase
            .from('translations')
            .delete()
            .in('id', ids)
            .eq('profile_id', user.id);

        if (error) {
            const errorResponse = standardizeError(error);
            logger.error(['Error deleting the translations:', errorResponse]);
            return errorResponse;
        }

        revalidatePath('/app/translations');

        return {
            description: 'The translations have been successfully deleted.',
            message: 'Translations deleted successfully.',
            status: 201,
            success: true,
            title: 'Translations Deleted',
        };
    } catch (error) {
        const errorResponse: ApiErrorType = isApiError(error)
            ? (error as ApiErrorType)
            : standardizeError(error);
        logger.error(['Error deleting the translations:', errorResponse]);
        return errorResponse;
    }
}
