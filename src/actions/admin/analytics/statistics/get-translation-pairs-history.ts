/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { validateUser } from '@/helpers/validate-user';
import { isApiError, standardizeError } from '@errors/api-errors';
import { getLogger } from '@services/logger';
import { createServerClient } from '@utils/supabase/server';
import type { ApiResponseOrError } from '@/types/rest/response';

export type AdminTranslationPair = {
    source_language: string;
    target_language: string;
    created_at: string;
};

/**
 * Get the Translation Pairs History, including source and target languages.
 *
 * @param {Date} startDate - The starting date for filtering the data.
 * @param {Date} endDate - The ending date for filtering the data.
 * @returns {Promise<ApiResponseOrError<AdminTranslationPair[]>>} - A promise that resolves to the translation pairs history
 *   data or an error.
 */
export async function getTranslationPairsHistory({
    endDate,
    startDate,
}: {
    startDate?: Date;
    endDate?: Date;
} = {}): Promise<ApiResponseOrError<AdminTranslationPair[]>> {
    const logger = getLogger('SERVICES:TRANSLATIONS:GET_TRANSLATION_PAIRS_HISTORY');

    try {
        await validateUser({
            requiredRole: 'ADMIN',
        });

        const supabase = await createServerClient();

        // Build the query
        let query = supabase
            .from('translations')
            .select('source_language, target_language, created_at')
            .order('created_at', { ascending: true });

        // Apply date filters if provided
        if (startDate) {
            query = query.gte('created_at', startDate.toISOString());
        }
        if (endDate) {
            query = query.lte('created_at', endDate.toISOString());
        }

        // Increase the limit and sort by most recent first
        const { data, error } = await query.order('created_at', { ascending: false }).range(0, 9999);

        if (error) {
            const response = standardizeError(error);
            logger.error(['Error occurred while fetching translation pairs history.', response]);
            return response;
        }

        if (!data) {
            return {
                data: [],
                description: 'No translation pairs found.',
                message: 'No translation pairs found.',
                status: 200,
                success: true,
            };
        }

        return {
            data,
            description: 'Translation pairs history retrieved successfully.',
            message: 'Translation pairs history successfully retrieved.',
            status: 200,
            success: true,
        };
    } catch (error) {
        const errorResponse = isApiError(error) ? error : standardizeError(error);
        logger.error(['Error occurred while fetching translation pairs history.', errorResponse]);
        return errorResponse;
    }
}
