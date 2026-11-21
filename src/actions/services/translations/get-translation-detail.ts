/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { createClient as createServiceClient } from '@supabase/supabase-js';
import { env } from '@/env';
import { validateUser } from '@/helpers/validate-user';
import { standardizeError } from '@/src/errors/api-errors';
import { createServerClient } from '@/src/utils/supabase/server';
import { getLogger } from '@services/logger';
import type { TranslationDetailData } from '@/src/queries/tanstack/translations-query-options';
import type { ApiResponseOrError } from '@/types/rest/response';
import type { TranslationRow } from '@schemas/translation-schemas';

/**
 * Get translation details including file metadata for the details page
 * Combines translation data from extended_translation_view with storage metadata
 * @async
 * @param {string} translationId - The ID of the translation to retrieve
 * @returns {Promise<ApiResponseOrError<TranslationDetailData>>} - Translation data with file metadata
 */
export async function getTranslationDetail(
    translationId: string,
): Promise<ApiResponseOrError<TranslationDetailData>> {
    const logger = getLogger('ACTIONS:SERVICES:TRANSLATIONS:GET_TRANSLATION_DETAIL');

    try {
        const { user } = await validateUser();

        if (!translationId) {
            const errorResponse = standardizeError({
                description: 'Translation ID is required.',
                message: 'Missing translation ID.',
                status: 400,
                success: false,
                title: 'Invalid Request',
            });
            logger.error(['Missing translation ID:', errorResponse]);
            return errorResponse;
        }

        const supabase = await createServerClient();

        // Fetch translation with extended view (includes customer/template info)
        const { data: translation, error: fetchError } = await supabase
            .from('extended_translation_view')
            .select('*')
            .eq('id', translationId)
            .eq('profile_id', user.id)
            .single();

        if (fetchError) {
            const errorResponse = standardizeError(fetchError);
            logger.error(['Error fetching translation:', errorResponse]);
            return errorResponse;
        }

        if (!translation) {
            const errorResponse = standardizeError({
                description: 'Translation not found or you do not have permission to access it.',
                message: 'Translation not found.',
                status: 404,
                success: false,
                title: 'Not Found',
            });
            logger.error(['Translation not found:', errorResponse]);
            return errorResponse;
        }

        // Fetch file metadata from storage using service client
        let fileMetadata: TranslationDetailData['fileMetadata'] = {
            size: null,
            mimetype: null,
            lastModified: null,
        };

        if (translation.file_url) {
            try {
                // Use RPC function to access storage.objects (bypasses schema switching issues)
                const serviceClient = createServiceClient(
                    env.NEXT_PUBLIC_SUPABASE_URL,
                    env.SUPABASE_SERVICE_ROLE_KEY,
                );

                const { data: metadata, error: storageError } = await serviceClient.rpc(
                    'get_storage_object_metadata',
                    {
                        p_bucket_id: env.NEXT_PUBLIC_FILE_UPLOAD_BUCKET,
                        p_name: translation.file_url,
                    },
                );

                if (storageError) {
                    logger.warn([
                        'Storage RPC error:',
                        { error: storageError, fileUrl: translation.file_url },
                    ]);
                } else if (metadata) {
                    const meta = metadata as Record<string, unknown>;
                    fileMetadata = {
                        size: typeof meta.size === 'number' ? meta.size : null,
                        mimetype: typeof meta.mimetype === 'string' ? meta.mimetype : null,
                        lastModified: typeof meta.lastModified === 'string' ? meta.lastModified : null,
                    };
                } else {
                    logger.warn(['No metadata found for file:', { fileUrl: translation.file_url }]);
                }
            } catch (storageError) {
                // Non-fatal: log but continue without file metadata
                logger.warn(['Failed to fetch file metadata:', storageError]);
            }
        }

        logger.info([
            'Translation detail fetched:',
            {
                translationId: translation.id,
                status: translation.status,
                hasFileMetadata: fileMetadata.size !== null,
                userId: user.id,
            },
        ]);

        // Fetch credit usage
        const { data: creditTransactions } = await supabase
            .from('credits_transactions')
            .select('credits')
            .eq('translation_id', translationId)
            .eq('type', 'consumption');

        const creditsUsed = creditTransactions?.reduce((sum, tx) => sum + tx.credits, 0) || 0;

        // Calculate page count with fallback for older translations
        const details = translation.details as Record<string, unknown> | null;
        let pageCount: number | null = null;

        if (details?.page_count && typeof details.page_count === 'number') {
            // New translations have page_count saved directly
            pageCount = details.page_count;
        } else if (details?.ai_audit) {
            // Older translations: calculate from ai_audit batch data
            const aiAudit = details.ai_audit as Record<string, unknown>;
            const translationAudit = aiAudit?.translation as Record<string, unknown>;
            const batches = translationAudit?.batches as Array<{ pages?: number[] }> | undefined;

            if (batches && Array.isArray(batches)) {
                // Sum up pages from all batches
                pageCount = batches.reduce((total, batch) => {
                    if (batch.pages && Array.isArray(batch.pages)) {
                        return total + batch.pages.length;
                    }
                    return total;
                }, 0);
            }
        }

        return {
            description: 'Translation details retrieved successfully.',
            message: 'Translation fetched.',
            status: 200,
            success: true,
            title: 'Success',
            data: {
                translation: translation as TranslationRow,
                fileMetadata,
                templateName: translation.template_name ?? null,
                customerName: translation.customer_name ?? null,
                customerEmail: translation.customer_email ?? null,
                creditsUsed,
                estimatedCost: creditsUsed, // Assuming 1 credit = $1 or just displaying credits for now
                pageCount,
                tokenUsage: details?.ai_audit
                    ? ((((details.ai_audit as Record<string, unknown>)?.pipeline as Record<string, unknown>)
                          ?.total_tokens as number | null) ?? null)
                    : null,
            },
        };
    } catch (error) {
        const errorResponse = standardizeError(error);
        logger.error(['Error fetching translation detail:', errorResponse]);
        return errorResponse;
    }
}
