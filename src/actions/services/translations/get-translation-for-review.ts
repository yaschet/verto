/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { createClient as createServiceClient } from '@supabase/supabase-js';
import { env } from '@/env';
import { validateUser } from '@/helpers/validate-user';
import { standardizeError } from '@/src/errors/api-errors';
import { createServerClient } from '@/src/utils/supabase/server';
import { sanitizeProseMirrorDocument } from '@/engine/document/sanitize-prosemirror-document';
import { getLogger } from '@services/logger';
import type { TranslationReviewData } from '@/src/queries/tanstack/translations-query-options';
import type { ApiResponseOrError } from '@/types/rest/response';
import type { TranslationRow } from '@schemas/translation-schemas';

/**
 * Get a translation for review with all data needed for the TipTap editor.
 * Returns translation, signed PDF URL, sanitized content, and file metadata.
 * @async
 * @param {string} translationId - The ID of the translation to retrieve
 * @returns {Promise<ApiResponseOrError<TranslationReviewData>>} - Complete review data
 */
export async function getTranslationForReview(
    translationId: string,
): Promise<ApiResponseOrError<TranslationReviewData>> {
    const logger = getLogger('ACTIONS:SERVICES:TRANSLATIONS:GET_TRANSLATION_FOR_REVIEW');

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

        // Fetch translation with extended view for complete data
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

        // Check if the translation is in a reviewable state
        const reviewableStatuses = ['ready', 'generating', 'completed'];
        const isReviewable = reviewableStatuses.includes(translation.status);

        if (!isReviewable) {
            logger.info([
                'Translation accessed in non-reviewable state:',
                {
                    translationId,
                    status: translation.status,
                    userId: user.id,
                },
            ]);
        }

        // Generate signed PDF URL if file exists
        let signedPdfUrl: string | null = null;
        if (translation.file_url) {
            const { data: signedUrl, error: signedUrlError } = await supabase.storage
                .from(env.NEXT_PUBLIC_FILE_UPLOAD_BUCKET)
                .createSignedUrl(translation.file_url, 3600); // 1 hour expiry

            if (signedUrlError) {
                logger.warn(['Failed to create signed URL for PDF:', signedUrlError.message]);
            } else if (signedUrl) {
                signedPdfUrl = signedUrl.signedUrl;
            }
        }

        // Extract and sanitize ProseMirror content
        // Priority: user_edits > translated_document > null
        const details = translation.details as Record<string, unknown> | null;
        let sanitizedContent = null;
        let originalContent = null;

        if (details?.user_edits) {
            // User has already made edits - sanitize them
            sanitizedContent = sanitizeProseMirrorDocument(details.user_edits);
            logger.info(['Loading sanitized user edits for review']);
        } else if (details?.translated_document) {
            // Use the translated_document and sanitize it
            sanitizedContent = sanitizeProseMirrorDocument(details.translated_document);
            logger.info(['Loading sanitized translated document for review']);
        } else {
            // No content available - create default document
            sanitizedContent = sanitizeProseMirrorDocument(null);
            logger.info(['No content available, using default document']);
        }

        // Extract original content for reset feature (always from translated_document)
        if (details?.translated_document) {
            originalContent = sanitizeProseMirrorDocument(details.translated_document);
        }

        // Fetch file metadata from storage using service client
        let fileMetadata: TranslationReviewData['fileMetadata'] = {
            size: null,
            mimetype: null,
        };

        if (translation.file_url) {
            try {
                const serviceClient = createServiceClient(
                    env.NEXT_PUBLIC_SUPABASE_URL,
                    env.SUPABASE_SERVICE_ROLE_KEY,
                    {
                        db: { schema: 'storage' },
                    },
                );

                const { data: storageObject } = await serviceClient
                    .from('objects')
                    .select('metadata')
                    .eq('bucket_id', env.NEXT_PUBLIC_FILE_UPLOAD_BUCKET)
                    .eq('name', translation.file_url)
                    .single();

                if (storageObject?.metadata) {
                    const meta = storageObject.metadata as Record<string, unknown>;
                    fileMetadata = {
                        size: typeof meta.size === 'number' ? meta.size : null,
                        mimetype: typeof meta.mimetype === 'string' ? meta.mimetype : null,
                    };
                }
            } catch (storageError) {
                // Non-fatal: log but continue without file metadata
                logger.warn(['Failed to fetch file metadata:', storageError]);
            }
        }

        logger.info([
            'Translation fetched for review:',
            {
                translationId: translation.id,
                status: translation.status,
                hasUserEdits: !!details?.user_edits,
                hasSignedUrl: !!signedPdfUrl,
                hasContent: !!sanitizedContent,
                userId: user.id,
            },
        ]);

        return {
            description: 'Translation retrieved successfully.',
            message: 'Translation fetched.',
            status: 200,
            success: true,
            title: 'Success',
            data: {
                translation: translation as TranslationRow,
                signedPdfUrl,
                sanitizedContent,
                originalContent,
                fileMetadata,
            },
        };
    } catch (error) {
        const errorResponse = standardizeError(error);
        logger.error(['Error fetching translation for review:', errorResponse]);
        return errorResponse;
    }
}
