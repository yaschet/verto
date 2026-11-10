/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { isApiError, standardizeError } from '@/errors/api-errors';
import { validateUser } from '@/helpers/validate-user';
import { getLogger } from '@/services/logger';
import { createServerClient } from '@utils/supabase/server';
import type { Tables } from '@/types/database/database';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';

/**
 * Get all the Templates from the Database, with "Dynamic" collection and "Omni-Document Recognition" template prioritized.
 *
 * @returns {ApiResponseOrError<{
 *     templates: Tables<'templates'>[];
 *     templates_collections: Tables<'templates_collections'>[];
 * }>}
 *   The response from the API.
 * @export
 */
export async function getAllTemplates(): Promise<
    ApiResponseOrError<{
        templates: Tables<'templates'>[];
        templates_collections: Tables<'templates_collections'>[];
    }>
> {
    const logger = getLogger('SERVICES:TRANSLATIONS:GET_ALL');

    try {
        await validateUser();

        const supabase = await createServerClient();

        // Fetch all template collections
        const { data: templateCollectionsData, error: templateCollectionsError } = await supabase
            .from('templates_collections')
            .select('*');

        if (templateCollectionsError) {
            const errorResponse = standardizeError(templateCollectionsError);
            logger.error(['Error fetching Templates Collections Data from the API:', errorResponse]);
            return errorResponse;
        }

        // Fetch all templates
        const { data: templatesData, error: templatesError } = await supabase.from('templates').select('*');

        if (templatesError) {
            const errorResponse = standardizeError(templatesError);
            logger.error(['Error fetching Templates Data from the API:', errorResponse]);
            return errorResponse;
        }

        // Sorting logic: Prioritize "Dynamic" collection and "Omni-Document Recognition" template

        // Sort collections to make sure "Dynamic" is first
        const templatesCollections = templateCollectionsData.sort(
            (a: Tables<'templates_collections'>, b: Tables<'templates_collections'>) => {
                if (a.slug === 'dynamic') return -1;
                if (b.slug === 'dynamic') return 1;
                return 0;
            },
        );

        // Sort templates to make sure "Omni-Document Recognition" is first
        const templates = templatesData.sort((a: Tables<'templates'>, b: Tables<'templates'>) => {
            if (a.slug === 'omni-document-recognition') return -1;
            if (b.slug === 'omni-document-recognition') return 1;
            return 0;
        });

        return {
            data: {
                templates,
                templates_collections: templatesCollections,
            },
            description: 'All templates have been successfully retrieved, with prioritized ordering.',
            message: 'Templates fetched successfully.',
            status: 200,
            success: true,
            title: 'Templates Retrieved',
        };
    } catch (error) {
        const errorResponse: ApiErrorType = isApiError(error) ? error : standardizeError(error);
        logger.error(['Error fetching Templates Data from the API:', errorResponse]);
        return errorResponse;
    }
}
