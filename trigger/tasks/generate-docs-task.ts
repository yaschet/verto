/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { logger, task } from '@trigger.dev/sdk';
import { ApiError } from '@errors/api-errors';
import { createAdminClient } from '@utils/supabase/server';
import { STANDARD_RETRY_CONFIG } from '@/trigger/errors/classify-error';
import { finalizeTranslationTask } from '@/trigger/tasks/partials/finalize-translation';
import { generateDocumentTask } from '@/trigger/tasks/partials/generate-document';

export type GenerateDocsTaskPayload = {
    translationId: string;
    userId: string;
};

/**
 * Task to generate Google Docs from approved translation
 * Triggered when user approves a translation for document generation
 *
 * Pipeline:
 * 1. Update status to 'generating'
 * 2. Generate DOCX + upload to Google Drive (sets export_status)
 * 3. Finalize translation (sends email, sets 'completed')
 */
export const generateDocsTask = task({
    id: 'generate-docs',
    queue: {
        name: 'translation-queue',
    },
    retry: STANDARD_RETRY_CONFIG,
    run: async (payload: GenerateDocsTaskPayload, { ctx: _ctx }) => {
        const supabase = await createAdminClient();

        await logger.trace('generate-docs', async (span) => {
            span.setAttribute('translationId', payload.translationId);
            span.setAttribute('userId', payload.userId);

            logger.info('[DOCS] Starting document generation pipeline', {
                translationId: payload.translationId,
            });
        });

        try {
            // Step 1: Update status to generating
            const { error: updateError } = await supabase
                .from('translations')
                .update({
                    status: 'generating',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', payload.translationId);

            if (updateError) {
                logger.error('[DOCS] Failed to update translation status to generating', {
                    error: updateError,
                    translationId: payload.translationId,
                });
                throw new ApiError('Failed to update translation status', {
                    status: 500,
                });
            }

            // Step 2: Generate the Google Doc using triggerAndWait
            // This waits for completion and returns the export_status result
            const generateResult = await logger.trace('generate-google-doc', async () => {
                return await generateDocumentTask.triggerAndWait({
                    translationId: payload.translationId,
                    userId: payload.userId,
                });
            });

            // Log the export status from generation
            if (generateResult.ok) {
                const exportData = generateResult.output?.data;
                logger.info('[DOCS] Document generation completed', {
                    translationId: payload.translationId,
                    hasDocx: !!exportData?.uploadedDocumentUrls?.downloadUrl,
                    hasPdf: !!exportData?.uploadedDocumentUrls?.pdfDownloadUrl,
                    hasHtml: !!exportData?.uploadedDocumentUrls?.htmlDownloadUrl,
                    hasGoogleDocs: !!exportData?.uploadedDocumentUrls?.googleDocsEditUrl,
                    fromCheckpoint: exportData?.fromCheckpoint ?? false,
                });
            } else {
                logger.error('[DOCS] Document generation subtask failed', {
                    translationId: payload.translationId,
                    error: generateResult.error,
                });
                throw new ApiError('Document generation failed', {
                    status: 500,
                    description: 'The document generation subtask did not complete successfully.',
                });
            }

            // Step 3: Finalize the translation (sends email, sets status to 'completed')
            const finalizeResult = await logger.trace('finalize-translation', async () => {
                return await finalizeTranslationTask.triggerAndWait({
                    translationId: payload.translationId,
                    userId: payload.userId,
                });
            });

            if (!finalizeResult.ok) {
                logger.warn('[DOCS] Finalization subtask failed, but document was generated', {
                    translationId: payload.translationId,
                    error: finalizeResult.error,
                });
                // Don't throw - document was generated successfully
            }

            await logger.info('[DOCS] Document generation pipeline completed', {
                translationId: payload.translationId,
            });

            return {
                message: 'Document generated and translation finalized successfully',
                exportStatus: generateResult.ok ? generateResult.output?.data?.uploadedDocumentUrls : null,
            };
        } catch (error) {
            // Update status to failed on error
            await supabase
                .from('translations')
                .update({
                    status: 'failed',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', payload.translationId);

            logger.error('[DOCS] Document generation pipeline failed', {
                error,
                translationId: payload.translationId,
            });

            throw error;
        }
    },
});
