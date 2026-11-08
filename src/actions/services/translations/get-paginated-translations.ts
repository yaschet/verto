/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { z } from 'zod';
import { validateUser } from '@/helpers/validate-user';
import { isApiError, standardizeError } from '@/src/errors/api-errors';
import {
    getPaginatedTranslationsQuery,
    getRecentTranslationsQuery,
    getTranslationsCountQuery,
} from '@/src/queries/database/translations';
import { TranslationColumnEnumSchema } from '@/src/schemas/translation-schemas';
import { createServerClient } from '@/src/utils/supabase/server';
import { getLogger } from '@services/logger';
import type { TranslationColumn, TranslationRow } from '@/src/schemas/translation-schemas';
import type { PaginatedQueryParams, PaginatedResponse } from '@/types/rest/common';
import type { ApiResponseOrError } from '@/types/rest/response';

// Create a Zod schema for PaginatedQueryParams specific to translations
const TranslationsQueryParamsSchema = z.object({
    page: z
        .number({
            error: 'The page index must be a positive integer.',
        })
        .int({
            message: 'The page index must be an integer.',
        })
        .nonnegative({
            message: 'The page index must be a non-negative integer.',
        })
        .default(0),
    pageCustomer: z
        .string({
            error: 'The page customer must be a string.',
        })
        .nullable() // Accept null values
        .optional(),
    pageFilter: z
        .string({
            error: 'The page filter must be a string.',
        })
        .nullable() // Accept null values
        .optional(),
    // Allow undefined values
    pageSize: z
        .number({
            error: 'The page size must be a positive integer.',
        })
        .int({
            message: 'The page size must be an integer.',
        })
        .positive({
            message: 'The page size must be a positive integer.',
        })
        .default(10),
    pageSortBy: TranslationColumnEnumSchema.nullable().optional(),
    pageSortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Define the translations response object:
type TranslationsResponse = PaginatedResponse<TranslationRow>;

export async function getPaginatedTranslations({
    page = 0,
    pageCustomer = null,
    pageFilter = null,
    pageSize = 10,
    pageSortBy = null,
    pageSortOrder = 'desc',
}: PaginatedQueryParams<TranslationColumn> & {
    pageCustomer?: string | null;
}): Promise<ApiResponseOrError<TranslationsResponse>> {
    const logger = getLogger('SERVICES:TRANSLATIONS:GET_PAGINATED');
    try {
        // Check if the user is authenticated:
        const { user } = await validateUser();

        // Validate the passed parameters against the Zod schema:
        const validatedParamsResult = await TranslationsQueryParamsSchema.safeParseAsync({
            page,
            pageCustomer,
            pageFilter,
            pageSize,
            pageSortBy,
            pageSortOrder,
        });

        if (!validatedParamsResult.success) {
            const formattedErrors = validatedParamsResult.error.issues
                .map((issue) => `${issue.message}`)
                .join(' ');

            // Construct a detailed error description with better readability
            const errorDescription = `There were issues with the provided query parameters: ${formattedErrors}`;

            const errorResponse = standardizeError({
                code: 'INVALID_PARAMETERS',
                description: errorDescription,
                message: 'Invalid parameters provided. Please review the errors below:',
                status: 400,
                title: 'Invalid Parameters',
            });

            logger.error([
                'The service failed to fetch the translations data due to the following error:',
                errorResponse,
            ]);

            return errorResponse;
        }

        const validatedParams = validatedParamsResult.data;

        const supabase = await createServerClient();

        // Use the separated query function
        const query = getPaginatedTranslationsQuery(supabase, {
            customerId: pageCustomer ?? null,
            page: validatedParams.page,
            pageFilter: validatedParams.pageFilter,
            pageSize: validatedParams.pageSize,
            pageSortBy: validatedParams.pageSortBy,
            pageSortOrder: validatedParams.pageSortOrder,
            profileId: user.id,
        });

        // Execute the query:
        const { data: translations, error } = await query;

        if (error) {
            const errorResponse = standardizeError(error);
            logger.error([
                'The service has failed to fetch the translations data, due to the following error:',
                errorResponse,
            ]);
            return errorResponse;
        }

        // Ensure translations is not undefined:
        const translationsData: TranslationRow[] = translations ?? [];

        // Get the total count for pagination purposes:
        const countQuery = getTranslationsCountQuery(supabase, {
            customerId: pageCustomer ?? null,
            profileId: user.id,
        });

        const { count, error: countError } = await countQuery;

        if (countError) {
            const errorResponse = standardizeError(countError);
            logger.error([
                'The service has failed to fetch the translations data, due to the following error:',
                errorResponse,
            ]);
            return errorResponse;
        }

        // Ensure count is a number:
        const totalCount: number = count ?? 0;

        // Prepare the response object:
        const responseObject: TranslationsResponse = {
            pagination: {
                nextPage:
                    (validatedParams.page + 1) * validatedParams.pageSize < totalCount
                        ? validatedParams.page + 1
                        : null,
                pageIndex: validatedParams.page,
                pageSize: validatedParams.pageSize,
                pagesCount: Math.ceil(totalCount / validatedParams.pageSize),
                prevPage: validatedParams.page > 0 ? validatedParams.page - 1 : null,
            },
            results: translationsData,
            total: totalCount,
        };

        return {
            data: responseObject,
            description: 'The translations data has been successfully retrieved.',
            message: 'Translations fetched successfully.',
            status: 200,
            success: true,
            title: 'Translations Retrieved',
        };
    } catch (error) {
        const errorResponse = isApiError(error) ? error : standardizeError(error);
        logger.error([
            'The service has failed to fetch the translations data, due to the following error:',
            errorResponse,
        ]);
        return errorResponse;
    }
}

/**
 * Fetch recent translations data from the API with a limit, defaulting to 5.
 *
 * @param limit
 * @returns {Promise<ApiResponseOrError<TranslationRow[]>>} - A promise that resolves to the paginated translations data
 *   or an error.
 */
export async function getRecentTranslations(limit = 5): Promise<ApiResponseOrError<TranslationRow[]>> {
    const logger = getLogger('SERVICES:TRANSLATIONS:GET_RECENT');

    try {
        // Check if the user is authenticated:
        const { user } = await validateUser();
        const supabase = await createServerClient();

        // Define the base query:
        const query = getRecentTranslationsQuery(supabase, user.id, limit);

        // Execute the query:
        const { data: translations, error } = await query;

        if (error) {
            const errorResponse = standardizeError(error);
            logger.error([
                'The service has failed to fetch the recent translations data, due to the following error:',
                errorResponse,
            ]);
            return errorResponse;
        }

        // Ensure translations is not undefined:
        const translationsData: TranslationRow[] = translations ?? [];

        return {
            data: translationsData,
            description: 'The recent translations data has been successfully retrieved.',
            message: 'Recent translations fetched successfully.',
            status: 200,
            success: true,
            title: 'Recent Translations Retrieved',
        };
    } catch (error) {
        const errorResponse = isApiError(error) ? error : standardizeError(error);
        logger.error([
            'The service has failed to fetch the recent translations data, due to the following error:',
            errorResponse,
        ]);
        return errorResponse;
    }
}
