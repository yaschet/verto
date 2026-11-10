/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

// src/utils/trigger/tasks/partials/generate-document.ts

import { logPhase } from '@/trigger/logging';
import { redactLogText, safeProviderError } from '@/services/log-safety';
import { logger, task } from '@trigger.dev/sdk';
import { ApiError } from '@errors/api-errors';
import { createAdminClient } from '@utils/supabase/server';
import {
    STANDARD_RETRY_CONFIG,
    isPermanentError,
    isTransientError,
    logErrorWithRetry,
} from '@/trigger/errors/classify-error';
import { updateTranslationRecord } from '@/trigger/utilities/translation';
import type { NormalisedDocument } from '@/engine/document/types';
import {
    generateGoogleDocAndExports,
    type UploadedDocumentUrls,
} from '@utils/gcp/docx/functions/generate-google-doc-and-exports';
import type { TranslationTaskPayload } from '@/trigger/tasks/translation-task';

/**
 * Extended payload for document generation
 * isRegeneration: When true, prioritizes user_edits over translated_document
 */
export type GenerateDocumentPayload = TranslationTaskPayload & {
    isRegeneration?: boolean;
};

export const generateDocumentTask = task({
    id: 'generate-document-task',
    retry: STANDARD_RETRY_CONFIG,
    // onFailure runs ONLY after all retries are exhausted - guaranteed to mark as failed
    onFailure: async ({ payload, error }: { payload: GenerateDocumentPayload; error: unknown }) => {
        const supabase = await createAdminClient();
        const errorMessage =
            error && typeof error === 'object' && 'message' in error ? String(error.message) : String(error);

        logger.error('Document generation failed permanently - all retries exhausted', {
            translationId: payload.translationId,
            error: safeProviderError(error),
        });

        try {
            // Get current translation to preserve existing details
            const { data: currentTranslation } = await supabase
                .from('translations')
                .select('details')
                .eq('id', payload.translationId)
                .single();

            await updateTranslationRecord(supabase, payload.translationId, {
                status: 'failed',
                completed_at: new Date().toISOString(),
                details: {
                    ...(currentTranslation?.details || {}),
                    error_message: `Document generation failed: ${redactLogText(errorMessage).substring(0, 500)}`,
                    failed_at_stage: 'generating',
                },
            });
            logPhase('GENERATE', 'Translation marked as failed', { translationId: payload.translationId });
        } catch (dbError) {
            logger.error('Failed to update translation status in onFailure', {
                error: safeProviderError(dbError),
            });
        }
    },
    run: async (payload: GenerateDocumentPayload, { ctx: _ctx }) => {
        const isRegeneration = payload.isRegeneration ?? false;

        logPhase('GENERATE', 'Starting document generation', { isRegeneration });

        const supabase = await createAdminClient();

        // ══════════════════════════════════════════════════════════════════
        // CHECKPOINT: Skip if document already generated (unless regenerating)
        // ══════════════════════════════════════════════════════════════════
        if (!isRegeneration) {
            const { data: existingTranslation } = await supabase
                .from('extended_translation_view')
                .select('details, status')
                .eq('id', payload.translationId)
                .single();

            const existingDocx = existingTranslation?.details?.generated_docx;
            if (existingDocx?.downloadUrl) {
                logPhase('GENERATE', 'CHECKPOINT HIT: Document already generated, skipping', {
                    translationId: payload.translationId,
                    hasDocx: true,
                    hasPdf: !!existingDocx.pdfDownloadUrl,
                    hasHtml: !!existingDocx.htmlDownloadUrl,
                    hasGoogleDocs: !!existingDocx.googleDocsEditUrl,
                });

                // Ensure status is ready (in case it was stuck at generating)
                if (existingTranslation?.status !== 'ready') {
                    await updateTranslationRecord(supabase, payload.translationId, {
                        status: 'ready',
                        progress: 100,
                        completed_at: new Date().toISOString(),
                    });
                }

                return {
                    code: 'GENERATION_CHECKPOINT_HIT',
                    title: 'Document Already Generated',
                    message: 'Skipping generation - document already exists.',
                    description: 'Using existing document from previous successful generation.',
                    data: {
                        translation: existingTranslation,
                        uploadedDocumentUrls: existingDocx,
                        isRegeneration: false,
                        fromCheckpoint: true,
                    },
                };
            }
        }

        // Update status to generating
        // If regenerating, we reset the started_at time to now so the duration reflects the current operation
        const updatePayload: Parameters<typeof updateTranslationRecord>[2] = {
            status: 'generating',
            progress: 90,
        };

        if (isRegeneration) {
            updatePayload.started_at = new Date().toISOString();
            updatePayload.completed_at = null;
        }

        const { data: translation, error } = await updateTranslationRecord(
            supabase,
            payload.translationId,
            updatePayload,
        );

        if (error) {
            throw new ApiError('Failed to update the Translation status.', {
                description: 'Failed to update the Translation status.',
                status: 500,
                title: 'Failed to Update Translation Status',
                code: 'FAILED_TO_UPDATE_TRANSLATION_STATUS',
            });
        }

        // Get the document to generate from:
        // - For regeneration: prefer user_edits (user's TipTap changes)
        // - For first generation: use translated_document (AI translation output)
        let documentToGenerate: NormalisedDocument | undefined;

        if (isRegeneration && translation?.details?.user_edits) {
            documentToGenerate = translation.details.user_edits;
            // Ensure direction is inherited from translated_document if not set in user_edits
            // This is critical for RTL languages where the editor may not persist direction
            if (!documentToGenerate.direction && translation?.details?.translated_document?.direction) {
                documentToGenerate.direction = translation.details.translated_document.direction;
                logPhase(
                    'GENERATE',
                    `Inherited direction from translated_document: ${documentToGenerate.direction}`,
                );
            }
            logPhase('GENERATE', 'Using user_edits for regeneration');
        } else {
            documentToGenerate = translation?.details?.translated_document;
            logPhase('GENERATE', 'Using translated_document for generation');
        }

        if (!documentToGenerate) {
            throw new ApiError('Document content is missing.', {
                description: isRegeneration
                    ? 'No user edits or translated document found.'
                    : 'Please translate the document before generating.',
                status: 500,
                title: 'Document Content Missing',
                code: 'DOCUMENT_CONTENT_MISSING',
            });
        }

        // Get the User from the Translation record:
        const { data: user, error: userError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', translation.profile_id)
            .single();

        if (userError || !user) {
            throw new ApiError('Failed to get the User.', {
                description: 'Failed to get the User.',
                status: 500,
                title: 'Failed to Get User',
                code: 'FAILED_TO_GET_USER',
            });
        }

        // Fetch extended view for folder metadata (customer_name)
        const { data: extendedTranslation } = await supabase
            .from('extended_translation_view')
            .select('customer_name, customer_id')
            .eq('id', payload.translationId)
            .single();

        // Generate the DOCX and upload to Drive:
        // This now throws on Google Drive failure (so Trigger.dev retries)
        const uploadedDocumentUrls: UploadedDocumentUrls = await logger.trace(
            'Generate Exports',
            async (genSpan) => {
                genSpan.setAttribute('isRegeneration', isRegeneration);
                genSpan.setAttribute('translationId', payload.translationId);
                genSpan.setAttribute('customerName', extendedTranslation?.customer_name || 'unknown');

                const result = await generateGoogleDocAndExports(
                    documentToGenerate!,
                    user,
                    payload.translationId,
                    translation.display_name,
                    {
                        customerName: extendedTranslation?.customer_name,
                        customerId: extendedTranslation?.customer_id,
                    },
                );

                genSpan.setAttribute('success', !!result.downloadUrl);
                genSpan.setAttribute('fileSizeBytes', result.fileSizeBytes);

                return result;
            },
        );

        // Validate minimum requirement - DOCX must be available
        if (!uploadedDocumentUrls.downloadUrl) {
            throw new Error('DOCX generation failed - no download URL returned');
        }

        // Build dynamic export_status JSONB for real-time UI updates
        const formats = [
            { key: 'pdf', prefix: 'pdf' },
            { key: 'html', prefix: 'html' },
            { key: 'md', prefix: 'markdown' },
            { key: 'epub', prefix: 'epub' },
            { key: 'odt', prefix: 'odt' },
            { key: 'rtf', prefix: 'rtf' },
            { key: 'txt', prefix: 'txt' },
        ] as const;

        const exportStatus: Record<
            string,
            {
                status: 'ready' | 'failed';
                progress: number;
                error?: string;
                downloadUrl?: string;
                fileSizeBytes?: number;
            }
        > = {
            docx: {
                status: 'ready' as const,
                progress: 100,
                downloadUrl: uploadedDocumentUrls.downloadUrl,
                fileSizeBytes: uploadedDocumentUrls.fileSizeBytes,
            },
        };

        for (const f of formats) {
            const downloadUrl = uploadedDocumentUrls[`${f.prefix}DownloadUrl`];
            const result = uploadedDocumentUrls[`${f.prefix}ExportResult`];
            const size = uploadedDocumentUrls[`${f.prefix}FileSizeBytes`];

            if (downloadUrl) {
                exportStatus[f.key] = {
                    status: 'ready' as const,
                    progress: 100,
                    downloadUrl,
                    fileSizeBytes: size,
                };
            } else if (result?.success === false) {
                exportStatus[f.key] = {
                    status: 'failed' as const,
                    progress: 0,
                    error: result.error || 'Export failed',
                };
            }
        }

        const readyFormats = Object.keys(exportStatus).filter((k) => exportStatus[k].status === 'ready');
        logPhase('GENERATE', `Document generation complete | formats=${readyFormats.join(',')}`, {
            readyFormats,
            failedFormats: Object.keys(exportStatus).filter((k) => exportStatus[k].status === 'failed'),
        });

        // Update the Translation record with generated DOCX, export status, and set status to 'ready'
        // Note: export_status type will be included after running `pnpm supabase db:types`
        const { data: updatedTranslation, error: updateError } = await updateTranslationRecord(
            supabase,
            payload.translationId,
            {
                status: 'ready',
                progress: 100,
                completed_at: new Date().toISOString(),
                export_status: exportStatus as unknown,
                details: {
                    ...translation.details,
                    generated_docx: {
                        ...uploadedDocumentUrls,
                        source_last_edited_at: translation.details?.last_edited_at,
                    },
                },
            } as Parameters<typeof updateTranslationRecord>[2],
        );

        if (updateError || !updatedTranslation) {
            throw new ApiError('Failed to update the Translation record.', {
                description: 'Failed to update the Translation record.',
                status: 500,
                title: 'Failed to Update Translation Record',
                code: 'FAILED_TO_UPDATE_TRANSLATION_RECORD',
            });
        }

        return {
            code: 'DOCUMENT_GENERATED',
            title: 'Document Generated Successfully',
            message: isRegeneration
                ? 'Document has been regenerated from your edits.'
                : 'Document has been generated from translation.',
            description: 'The DOCX has been uploaded and is ready for download.',
            data: {
                translation: updatedTranslation,
                uploadedDocumentUrls,
                isRegeneration,
            },
        };
    },
    catchError: async ({ ctx, error, payload }) => {
        const errorMessage =
            error && typeof error === 'object' && 'message' in error ? String(error.message) : String(error);

        // Log error with retry context
        logErrorWithRetry({
            taskId: ctx.task.id,
            runId: ctx.run.id,
            attemptNumber: ctx.attempt.number,
            error,
            willRetry: !isPermanentError(error) && ctx.attempt.number < STANDARD_RETRY_CONFIG.maxAttempts,
        });

        // Permanent errors (invalid document structure) should fail fast
        // onFailure hook will mark translation as failed
        if (isPermanentError(error)) {
            logger.info('Permanent error in document generation, skipping retries', {
                translationId: payload.translationId,
            });
            return { skipRetrying: true };
        }

        // Check for transient GCP errors that should retry
        const isTransientGcpError =
            errorMessage.includes('UNAVAILABLE') ||
            errorMessage.includes('DEADLINE_EXCEEDED') ||
            errorMessage.includes('Internal Error') ||
            errorMessage.includes('429') ||
            errorMessage.includes('500') ||
            errorMessage.includes('503') ||
            errorMessage.includes('504') ||
            isTransientError(error);

        // Transient GCP errors - allow retry
        // If all retries fail, onFailure hook will mark translation as failed
        if (isTransientGcpError) {
            logger.info('Transient GCP error in document generation, will retry', {
                attempt: ctx.attempt.number,
                maxAttempts: STANDARD_RETRY_CONFIG.maxAttempts,
                error: safeProviderError(error),
            });
            return undefined;
        }

        // Unknown errors: allow retry for safety
        // onFailure hook ensures we eventually mark as failed
        return undefined;
    },
});
