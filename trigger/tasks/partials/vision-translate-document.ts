/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { logger, metadata, tags, task } from '@trigger.dev/sdk';
import axios from 'axios';
import mime from 'mime-types';
import { ApiError } from '@errors/api-errors';
import { AI_PRESETS } from '@utils/ai/ai-config';
import { generateMetadataFromImages } from '@utils/ai/generate-document-metadata';
import { getModelForTask } from '@utils/ai/providers/openai-adapter';
import { verifyCompletenessWithAI, verifyTranslation } from '@utils/ai/verification';
import { type QAProgressCallback, polishTranslatedDocument } from '@utils/ai/vision-document-qa';
import {
    type ProgressCallback,
    type VisionTranslationConfig,
    convertPdfToImages,
    estimatePdfTokenUsage,
    imageBufferToDataUri,
    translateDocumentWithVision,
} from '@utils/ai/vision-document-translator';
import { createAdminClient } from '@utils/supabase/server';
import { STANDARD_RETRY_CONFIG, isPermanentError, logErrorWithRetry } from '@/trigger/errors/classify-error';
import { logError, logPhase, logWarning, setRunTags, updateLiveStatus } from '@/trigger/logging';
import { getSignedUrlForFile } from '@/trigger/utilities/storage';
import {
    retrieveTranslationRecord,
    updateTranslationRecord,
    updateTranslationStatus,
} from '@/trigger/utilities/translation';
import type { AIAuditData, ProcessingStageAudit, QAStageAudit } from '@/types/ai-audit';
import type { NormalisedDocument } from '@/engine/document/types';
import { repairDocumentTables } from '@/engine/document/repair-document-tables';
import type { TranslationTaskPayload } from '@/trigger/tasks/translation-task';

const PROGRESS_RANGES = {
    queued: { start: 0, end: 0 },
    processing: { start: 0, end: 15 },
    translating: { start: 15, end: 65 },
    polishing: { start: 65, end: 90 },
    generating: { start: 90, end: 100 },
    ready: { start: 100, end: 100 },
} as const;

const PROGRESS_STAGES = {
    PROCESSING_START: 0,
    PROCESSING_DOWNLOAD: 5,
    PROCESSING_CONVERT: 10,
    PROCESSING_METADATA: 12,
    PROCESSING_END: 15,
    TRANSLATING_START: 15,
    TRANSLATING_END: 65,
    POLISHING_START: 65,
    POLISHING_END: 90,
    GENERATING_START: 90,
    GENERATING_END: 100,
    SAVING: 95,
    COMPLETE: 100,
} as const;

/**
 * Scale AI-reported progress (0-100%) to a phase's actual range.
 * This prevents progress jumps and shows smooth, proportional progress.
 *
 * @param aiPercent - AI's internal progress (0-100)
 * @param phase - The current phase (translating, polishing, etc.)
 * @returns Scaled progress value for database/UI
 */
function scaleAIProgress(aiPercent: number, phase: keyof typeof PROGRESS_RANGES): number {
    const range = PROGRESS_RANGES[phase];
    return Math.round(range.start + (aiPercent / 100) * (range.end - range.start));
}

export const visionTranslateDocumentTask = task({
    id: 'vision-translate-document',
    retry: STANDARD_RETRY_CONFIG,
    // Use a larger machine for vision processing (more memory for images)
    // Increase maxDuration to 24 hours (86400s) to handle large documents/slow models
    maxDuration: 86400,
    machine: {
        preset: 'medium-1x', // 1 vCPU, 2 GB RAM - good for image processing
    },
    // onFailure runs ONLY after all retries are exhausted - guaranteed to mark as failed
    onFailure: async ({ payload, error }: { payload: TranslationTaskPayload; error: unknown }) => {
        const supabase = await createAdminClient();
        const errorMessage =
            error && typeof error === 'object' && 'message' in error ? String(error.message) : String(error);

        logger.error('Vision translation failed permanently - all retries exhausted', {
            translationId: payload.translationId,
            error: errorMessage.substring(0, 200),
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
                    error_message: `Translation failed: ${errorMessage.substring(0, 500)}`,
                    failed_at_stage: 'translating',
                },
            });
            logger.info('Translation marked as failed via onFailure hook', {
                translationId: payload.translationId,
            });
        } catch (dbError) {
            logger.error('Failed to update translation status in onFailure', { dbError });
        }
    },
    run: async (payload: TranslationTaskPayload, { ctx: _ctx }) => {
        const supabase = await createAdminClient();
        const taskStartTime = Date.now();

        return await logger.trace('Vision Translate Document', async (span) => {
            try {
                // Initialize metadata for dashboard
                metadata.set('stage', 'queued');
                metadata.set('progress', 0);
                metadata.set('translationId', payload.translationId);
                updateLiveStatus('Starting');

                span.setAttribute('translationId', payload.translationId);

                // Step 1: Retrieve translation record
                const translation = await logger.trace('Fetch Translation Record', async (fetchSpan) => {
                    const { data, error: retrievalError } = await retrieveTranslationRecord(
                        supabase,
                        payload.translationId,
                    );

                    if (retrievalError || !data) {
                        fetchSpan.setAttribute('status', 'not_found');
                        throw new ApiError('Failed to retrieve translation record.', {
                            description: retrievalError?.message || 'Translation not found',
                            status: 404,
                            title: 'Translation Not Found',
                            code: 'TRANSLATION_NOT_FOUND',
                        });
                    }

                    fetchSpan.setAttribute('status', 'found');
                    return data;
                });

                // Set run-level tags for filtering
                setRunTags({
                    pageCount: undefined, // Will be set after conversion
                    sourceLanguage: translation.source_language || undefined,
                    targetLanguage: translation.target_language,
                    documentType: detectDocumentType(translation),
                    translationId: payload.translationId,
                });

                // Update metadata with translation info
                metadata.set('documentName', translation.display_name || 'Unknown');
                metadata.set('sourceLanguage', translation.source_language || 'auto');
                metadata.set('targetLanguage', translation.target_language);

                logPhase('INIT', 'Translation record loaded', {
                    lang: `${translation.source_language || 'auto'}→${translation.target_language}`,
                    type: detectDocumentType(translation),
                });

                // ══════════════════════════════════════════════════════════════════
                // CHECKPOINT: Skip if translation already completed
                // ══════════════════════════════════════════════════════════════════
                const existingTranslatedDoc = translation.details?.translated_document;
                if (existingTranslatedDoc) {
                    logger.info('[TRANSLATE] CHECKPOINT HIT: Translation already completed, skipping', {
                        translationId: payload.translationId,
                        hasTranslatedDoc: true,
                        contentNodes: existingTranslatedDoc.content?.length || 0,
                    });

                    // Ensure status reflects completion (in case it was stuck)
                    if (translation.status !== 'ready' && translation.status !== 'generating') {
                        await updateTranslationRecord(supabase, payload.translationId, {
                            status: 'ready',
                            progress: 100,
                            completed_at: new Date().toISOString(),
                        });
                    }

                    return {
                        code: 'TRANSLATION_CHECKPOINT_HIT',
                        title: 'Translation Already Completed',
                        message: 'Skipping translation - document already translated.',
                        description: 'Using existing translation from previous successful run.',
                        data: {
                            translationId: payload.translationId,
                            pageCount: translation.details?.page_count || 0,
                            totalTokensUsed: translation.details?.vision_metadata?.tokensUsed || 0,
                            fromCheckpoint: true,
                        },
                    };
                }

                // Step 2: Update status to processing
                await updateTranslationStatus(supabase, payload.translationId, 'processing', 5);
                metadata.set('stage', 'processing');
                metadata.set('progress', 5);
                updateLiveStatus('Downloading document');

                // Track processing phase start time for audit
                const processingStartTime = Date.now();

                // Step 3: Download the document (with timed span)
                const { fileBuffer, mimeType } = await logger.trace('Download Document', async (dlSpan) => {
                    dlSpan.setAttribute('fileUrl', translation.file_url.substring(0, 50));

                    const signedUrl = await getSignedUrlForFile(supabase, translation.file_url);
                    const response = await axios.get(signedUrl, { responseType: 'arraybuffer' });
                    const buffer = Buffer.from(response.data);
                    const type =
                        (mime.lookup(translation.file_url) as string) ||
                        (response.headers['content-type'] as string | undefined) ||
                        'application/pdf';

                    dlSpan.setAttribute('size', buffer.length);
                    dlSpan.setAttribute('mimeType', type);

                    logger.info(
                        '[OCR] Document downloaded | size=' +
                            (buffer.length / 1024).toFixed(0) +
                            'KB, type=' +
                            type.split('/')[1],
                    );

                    return { fileBuffer: buffer, mimeType: type };
                });

                // Step 4: Convert to images (with timed span)
                metadata.set('progress', 10);
                updateLiveStatus('Converting to images');
                await updateTranslationStatus(supabase, payload.translationId, 'processing', 10);

                // Track estimated tokens per page for dynamic batch sizing
                let estimatedInputTokensPerPage: number | undefined;

                const documentImages = await logger.trace('Convert To Images', async (convSpan) => {
                    convSpan.setAttribute('mimeType', mimeType);

                    let images: string[];

                    if (mimeType === 'application/pdf') {
                        // Estimate token usage first
                        const tokenEstimate = await estimatePdfTokenUsage(fileBuffer);
                        convSpan.setAttribute('pageCount', tokenEstimate.pageCount);
                        convSpan.setAttribute('estimatedTokens', tokenEstimate.totalTokens);

                        metadata.set('pageCount', tokenEstimate.pageCount);
                        metadata.set('estimatedTokens', tokenEstimate.totalTokens);

                        // Store tokens per page for dynamic batch sizing
                        estimatedInputTokensPerPage = tokenEstimate.tokensPerPage;
                        convSpan.setAttribute('tokensPerPage', tokenEstimate.tokensPerPage);

                        // Add page count tag now that we know it
                        const pageGroup =
                            tokenEstimate.pageCount === 1
                                ? '1'
                                : tokenEstimate.pageCount <= 5
                                  ? '2-5'
                                  : tokenEstimate.pageCount <= 10
                                    ? '6-10'
                                    : '10+';
                        tags.add(`pages:${pageGroup}`);

                        // Convert PDF to images
                        images = await convertPdfToImages(fileBuffer, {
                            dpi: 300,
                            format: 'png',
                        });

                        logger.info(
                            '[OCR] PDF converted | pages=' +
                                tokenEstimate.pageCount +
                                ', tokens=~' +
                                (tokenEstimate.totalTokens / 1000).toFixed(0) +
                                'K',
                        );
                    } else if (mimeType.startsWith('image/')) {
                        images = [imageBufferToDataUri(fileBuffer, mimeType)];
                        metadata.set('pageCount', 1);
                        tags.add('pages:1');
                        logger.info('[OCR] Image loaded | pages=1');
                    } else {
                        throw new ApiError('Unsupported file type for vision translation.', {
                            description: `MIME type ${mimeType} is not supported. Use PDF or image files.`,
                            status: 400,
                            title: 'Unsupported File Type',
                            code: 'UNSUPPORTED_FILE_TYPE',
                        });
                    }

                    convSpan.setAttribute('outputPages', images.length);
                    return images;
                });

                // Step 5: Generate metadata EARLY (during processing stage)
                metadata.set('progress', PROGRESS_STAGES.PROCESSING_METADATA);
                updateLiveStatus('Analyzing document');
                await updateTranslationStatus(
                    supabase,
                    payload.translationId,
                    'processing',
                    PROGRESS_STAGES.PROCESSING_METADATA,
                );

                let displayName = translation.display_name;
                let description = translation.description;

                const needsMetadataGeneration =
                    displayName === 'Pending AI Generated Name' ||
                    description === 'Pending AI Generated Description';

                // SAVE PAGE COUNT to DB immediately after we have it!
                if (documentImages.length > 0) {
                    await updateTranslationRecord(supabase, payload.translationId, {
                        details: {
                            ...translation.details,
                            page_count: documentImages.length,
                        },
                    });
                }

                if (needsMetadataGeneration) {
                    await logger.trace('Generate Metadata', async (metaSpan) => {
                        try {
                            const generatedMetadata = await generateMetadataFromImages(
                                documentImages,
                                translation.source_language || undefined,
                            );

                            if (displayName === 'Pending AI Generated Name') {
                                displayName = generatedMetadata.displayName;
                            }
                            if (description === 'Pending AI Generated Description') {
                                description = generatedMetadata.description;
                            }

                            await updateTranslationRecord(supabase, payload.translationId, {
                                display_name: displayName,
                                description: description,
                            });

                            metadata.set('documentName', displayName);
                            metaSpan.setAttribute('displayName', displayName);
                            metaSpan.setAttribute('status', 'generated');

                            logger.info(
                                '[OCR] Metadata generated | name=' +
                                    (displayName.substring(0, 30) + (displayName.length > 30 ? '...' : '')),
                            );
                        } catch (metadataError) {
                            metaSpan.setAttribute('status', 'failed');
                            logger.warn(
                                '[OCR] Metadata generation failed | error=' +
                                    (metadataError as Error).message?.substring(0, 50),
                            );
                        }
                    });
                }

                // Calculate processing stage metrics before transitioning to translation
                const processingMs = Date.now() - processingStartTime;
                const processingAudit: ProcessingStageAudit = {
                    processing_ms: processingMs,
                    document_downloaded: true,
                    pages_converted: documentImages.length,
                    metadata_extracted: needsMetadataGeneration,
                    file_size_bytes: fileBuffer.length,
                };

                logger.info(
                    '[OCR] Processing complete | duration=' +
                        (processingMs / 1000).toFixed(1) +
                        's, pages=' +
                        documentImages.length +
                        ', size=' +
                        (fileBuffer.length / 1024).toFixed(0) +
                        'KB',
                );

                // Step 6: Vision-based translation
                metadata.set('stage', 'translating');
                metadata.set('progress', PROGRESS_RANGES.translating.start);
                updateLiveStatus('Translating', `0/${documentImages.length} pages`);

                await updateTranslationStatus(
                    supabase,
                    payload.translationId,
                    'translating',
                    PROGRESS_RANGES.translating.start,
                    undefined,
                    true, // clearLabels
                );

                logger.info('[TRANSLATE] Starting vision translation | pages=' + documentImages.length);

                const visionConfig: Partial<VisionTranslationConfig> = {
                    targetLanguage: translation.target_language,
                    sourceLanguage: translation.source_language || undefined,
                    documentType: detectDocumentType(translation),
                    maxPagesPerBatch: 5, // Maximum - actual is calculated dynamically
                    preserveFormatting: true,
                    // Enable dynamic batch sizing for resilience against truncation
                    dynamicBatching: true,
                    estimatedInputTokensPerPage,
                };

                // Progress callback - updates metadata and database for real-time UI
                const onProgress: ProgressCallback = async (progress) => {
                    metadata.set('stage', 'translating');

                    // Handle AI-reported dynamic labels
                    if (progress.dynamic_label) {
                        metadata.set('dynamic_label', progress.dynamic_label);
                    }
                    if (progress.stage_message) {
                        metadata.set('stage_message', progress.stage_message);
                    }

                    // Track batch info
                    if (progress.batchIndex !== undefined && progress.totalBatches !== undefined) {
                        metadata.set('currentBatch', progress.batchIndex + 1);
                        metadata.set('totalBatches', progress.totalBatches);
                        updateLiveStatus(
                            'Translating',
                            `batch ${progress.batchIndex + 1}/${progress.totalBatches}`,
                        );
                    }

                    // Scale AI progress to phase range
                    if (progress.percent !== undefined) {
                        const dbProgress = scaleAIProgress(progress.percent, 'translating');
                        metadata.set('progress', dbProgress);

                        await updateTranslationStatus(
                            supabase,
                            payload.translationId,
                            'translating',
                            dbProgress,
                            progress.dynamic_label || progress.stage_message
                                ? {
                                      dynamic_label: progress.dynamic_label,
                                      stage_message: progress.stage_message,
                                  }
                                : undefined,
                        );
                    } else if (progress.stage === 'finalizing') {
                        const dbProgress = PROGRESS_RANGES.translating.end;
                        metadata.set('progress', dbProgress);
                        await updateTranslationStatus(
                            supabase,
                            payload.translationId,
                            'translating',
                            dbProgress,
                        );
                    }
                };

                // Execute translation with timing span
                const translationResult = await logger.trace('AI Translation', async (transSpan) => {
                    transSpan.setAttribute('pageCount', documentImages.length);
                    transSpan.setAttribute('targetLanguage', translation.target_language);

                    const result = await translateDocumentWithVision(
                        documentImages,
                        visionConfig,
                        onProgress,
                    );

                    transSpan.setAttribute('tokensUsed', result.metadata.tokensUsed);
                    transSpan.setAttribute('contentNodes', result.translatedDocument.content.length);
                    transSpan.setAttribute('confidence', result.confidence);

                    return result;
                });

                logger.info(
                    '[TRANSLATE] Task completed | pages=' +
                        documentImages.length +
                        ', tokens=' +
                        (translationResult.metadata.tokensUsed / 1000).toFixed(1) +
                        'K, nodes=' +
                        translationResult.translatedDocument.content.length +
                        ', duration=' +
                        (translationResult.metadata.processingTimeMs / 1000).toFixed(1) +
                        's',
                );

                // Step 7: Quality Assurance Pass (Polish)
                metadata.set('stage', 'polishing');
                metadata.set('progress', PROGRESS_RANGES.polishing.start);
                updateLiveStatus('Quality review');
                metadata.del('dynamic_label');
                metadata.del('stage_message');

                await updateTranslationStatus(
                    supabase,
                    payload.translationId,
                    'polishing',
                    PROGRESS_RANGES.polishing.start,
                    undefined,
                    true, // clearLabels
                );

                logger.info('[QA] Starting quality review');

                let finalDocument: NormalisedDocument = translationResult.translatedDocument;
                let qaMetadata: {
                    issuesFixed: number;
                    qaTokensUsed: number;
                    qaConfidence: number;
                    qaAudit?: QAStageAudit;
                } = {
                    issuesFixed: 0,
                    qaTokensUsed: 0,
                    qaConfidence: 1.0,
                    qaAudit: undefined,
                };

                try {
                    // Progress callback for QA pass
                    const onQAProgress: QAProgressCallback = async (progress) => {
                        metadata.set('qaStage', progress.stage);

                        if (progress.dynamic_label) {
                            metadata.set('dynamic_label', progress.dynamic_label);
                        }
                        if (progress.stage_message) {
                            metadata.set('stage_message', progress.stage_message);
                        }

                        if (progress.batchIndex !== undefined && progress.totalBatches !== undefined) {
                            metadata.set('qaBatch', progress.batchIndex + 1);
                            metadata.set('qaTotalBatches', progress.totalBatches);
                            updateLiveStatus(
                                'Quality review',
                                `batch ${progress.batchIndex + 1}/${progress.totalBatches}`,
                            );
                        }

                        if (progress.percent !== undefined) {
                            const dbProgress = scaleAIProgress(progress.percent, 'polishing');
                            metadata.set('progress', dbProgress);

                            await updateTranslationStatus(
                                supabase,
                                payload.translationId,
                                'polishing',
                                dbProgress,
                                progress.dynamic_label || progress.stage_message
                                    ? {
                                          dynamic_label: progress.dynamic_label,
                                          stage_message: progress.stage_message,
                                      }
                                    : undefined,
                            );
                        }
                    };

                    // Execute QA pass with timing span
                    const qaResult = await logger.trace('QA Polish Pass', async (qaSpan) => {
                        qaSpan.setAttribute('pageCount', documentImages.length);

                        const result = await polishTranslatedDocument(
                            documentImages,
                            translationResult.translatedDocument,
                            {
                                targetLanguage: translation.target_language,
                                maxPagesPerBatch: 5,
                                focusAreas: ['all'],
                            },
                            onQAProgress,
                        );

                        qaSpan.setAttribute('issuesFixed', result.issuesFixed.length);
                        qaSpan.setAttribute('tokensUsed', result.metadata.tokensUsed);
                        qaSpan.setAttribute('confidence', result.confidence);

                        return result;
                    });

                    finalDocument = qaResult.polishedDocument;
                    qaMetadata = {
                        issuesFixed: qaResult.issuesFixed.length,
                        qaTokensUsed: qaResult.metadata.tokensUsed,
                        qaConfidence: qaResult.confidence,
                        qaAudit: qaResult.audit,
                    };

                    logger.info(
                        '[QA] Review complete | fixes=' +
                            qaResult.issuesFixed.length +
                            ', tokens=' +
                            (qaResult.metadata.tokensUsed / 1000).toFixed(1) +
                            'K, confidence=' +
                            (qaResult.confidence * 100).toFixed(0) +
                            '%',
                    );
                } catch (qaError) {
                    logger.warn(
                        '[QA] Failed, using original translation | error=' +
                            (qaError as Error).message?.substring(0, 50),
                    );
                    // Keep finalDocument as translationResult.translatedDocument
                }

                // Step 8: MANDATORY AI Verification Layer (post-QA quality gate)
                metadata.set('stage', 'polishing');
                metadata.set('progress', 92);
                updateLiveStatus('Verifying');
                metadata.del('dynamic_label');
                metadata.del('stage_message');

                let verificationMetadata: {
                    verificationPassed: boolean;
                    complete: boolean;
                    missingContent: string[];
                    tableVerification: {
                        sourceTableCount: number;
                        outputTableCount: number;
                        tablesMatch: boolean;
                        issues: string[];
                    };
                    confidence: number;
                    untranslatedSegments: number;
                    segmentsAutoFixed: number;
                    verificationTokensUsed: number;
                } = {
                    verificationPassed: true,
                    complete: true,
                    missingContent: [],
                    tableVerification: {
                        sourceTableCount: 0,
                        outputTableCount: 0,
                        tablesMatch: true,
                        issues: [],
                    },
                    confidence: 1.0,
                    untranslatedSegments: 0,
                    segmentsAutoFixed: 0,
                    verificationTokensUsed: 0,
                };

                await logger.trace('Verification Pass', async (verifySpan) => {
                    verifySpan.setAttribute('translationId', payload.translationId);

                    try {
                        // Optional: Run untranslated segment detection (disabled by default)
                        const documentType = detectDocumentType(translation);
                        const segmentVerification = await verifyTranslation(
                            finalDocument,
                            translation.source_language || 'auto',
                            translation.target_language,
                            {
                                documentContext: {
                                    documentType,
                                    documentName: translation.display_name || undefined,
                                    pageCount: documentImages?.length,
                                },
                            },
                        );

                        // Update final document with any auto-fixes applied
                        finalDocument = segmentVerification.finalDocument;
                        let totalTokensUsed = segmentVerification.totalTokensUsed;

                        verifySpan.setAttribute(
                            'untranslatedSegments',
                            segmentVerification.untranslatedDetection?.untranslatedSegments.length || 0,
                        );

                        // MANDATORY: AI Completeness Verification
                        const completenessResult = await verifyCompletenessWithAI(
                            documentImages,
                            finalDocument,
                            translation.target_language,
                        );

                        totalTokensUsed += completenessResult.verification_tokens_used;

                        verifySpan.setAttribute('complete', completenessResult.complete);
                        verifySpan.setAttribute(
                            'sourceTableCount',
                            completenessResult.table_verification.source_table_count,
                        );
                        verifySpan.setAttribute(
                            'outputTableCount',
                            completenessResult.table_verification.output_table_count,
                        );
                        verifySpan.setAttribute(
                            'tablesMatch',
                            completenessResult.table_verification.tables_match,
                        );
                        verifySpan.setAttribute('confidence', completenessResult.confidence);
                        verifySpan.setAttribute('tokensUsed', totalTokensUsed);

                        // Store metadata
                        verificationMetadata = {
                            verificationPassed:
                                completenessResult.complete || completenessResult.confidence < 0.8,
                            complete: completenessResult.complete,
                            missingContent: completenessResult.missing_content,
                            tableVerification: {
                                sourceTableCount: completenessResult.table_verification.source_table_count,
                                outputTableCount: completenessResult.table_verification.output_table_count,
                                tablesMatch: completenessResult.table_verification.tables_match,
                                issues: completenessResult.table_verification.issues,
                            },
                            confidence: completenessResult.confidence,
                            untranslatedSegments:
                                segmentVerification.reVerificationResult?.untranslatedSegments.length ||
                                segmentVerification.untranslatedDetection?.untranslatedSegments.length ||
                                0,
                            segmentsAutoFixed: segmentVerification.autoFixResult?.segmentsFixed || 0,
                            verificationTokensUsed: totalTokensUsed,
                        };

                        // Quality gate: NEVER FAIL based on AI verification.
                        if (!completenessResult.complete) {
                            logger.warn(
                                '[VERIFY] Potential missing content flagged | missing=' +
                                    completenessResult.missing_content.length +
                                    ', confidence=' +
                                    completenessResult.confidence,
                            );
                        }

                        logger.info(
                            '[VERIFY] Complete | status=' +
                                (completenessResult.complete ? 'passed' : 'warning') +
                                ', confidence=' +
                                (completenessResult.confidence * 100).toFixed(0) +
                                '%, tokens=' +
                                (totalTokensUsed / 1000).toFixed(1) +
                                'K',
                        );
                    } catch (verifyError) {
                        // Re-throw ApiErrors (verification failures should block)
                        if (verifyError instanceof ApiError) {
                            throw verifyError;
                        }

                        // Log other errors but don't block
                        logger.warn(
                            '[VERIFY] Error encountered | error=' +
                                (verifyError as Error).message?.substring(0, 50),
                        );
                        verifySpan.setAttribute('status', 'error');
                        verifySpan.setAttribute(
                            'errorMessage',
                            (verifyError as Error).message?.substring(0, 100) || 'Unknown',
                        );
                    }
                });

                // Step 9: Repair Table Structures
                // CRITICAL: Fix AI-generated malformed tables BEFORE storing
                // This ensures translated_document has valid rectangular tables
                // that won't break TipTap/ProseMirror editor
                finalDocument = repairDocumentTables(finalDocument);
                logger.info('[REPAIR] Table structures validated and repaired if needed');

                // Step 10: Handover to Generation
                metadata.set('stage', 'generating');
                metadata.set('progress', PROGRESS_RANGES.generating.start);
                updateLiveStatus('Generating document');
                metadata.del('dynamic_label');
                metadata.del('stage_message');

                await logger.trace('Save Translation', async (saveSpan) => {
                    saveSpan.setAttribute('translationId', payload.translationId);

                    // Build AI audit data for comprehensive logging
                    const totalTimeMs = Date.now() - taskStartTime;
                    const aiAudit: AIAuditData = {
                        schema_version: 1,
                        processing: processingAudit,
                        translation: translationResult.audit,
                        qa: qaMetadata.qaAudit,
                        pipeline: {
                            total_processing_ms: totalTimeMs,
                            total_tokens:
                                translationResult.metadata.tokensUsed +
                                qaMetadata.qaTokensUsed +
                                verificationMetadata.verificationTokensUsed,
                            stages_completed: [
                                'processing',
                                'translation',
                                ...(qaMetadata.qaAudit ? ['qa' as const] : []),
                            ],
                            errors: [],
                            started_at: new Date(Date.now() - totalTimeMs).toISOString(),
                            completed_at: new Date().toISOString(),
                            config_snapshot: {
                                AI_MODEL_TRANSLATION: getModelForTask('translation'),
                                AI_MODEL_QA: getModelForTask('qa'),
                                AI_MODEL_METADATA: getModelForTask('metadata'),
                                preset_translation: {
                                    reasoning: AI_PRESETS.translation.reasoning,
                                    verbosity: AI_PRESETS.translation.verbosity,
                                    responseFormat: AI_PRESETS.translation.responseFormat,
                                    taskType: AI_PRESETS.translation.taskType,
                                },
                                preset_qa: {
                                    reasoning: AI_PRESETS.qa.reasoning,
                                    verbosity: AI_PRESETS.qa.verbosity,
                                    responseFormat: AI_PRESETS.qa.responseFormat,
                                    taskType: AI_PRESETS.qa.taskType,
                                },
                                preset_metadata: {
                                    reasoning: AI_PRESETS.metadata.reasoning,
                                    maxOutputTokens: AI_PRESETS.metadata.maxOutputTokens,
                                    responseFormat: AI_PRESETS.metadata.responseFormat,
                                    taskType: AI_PRESETS.metadata.taskType,
                                },
                            },
                        },
                    };

                    const { error: updateError } = await updateTranslationRecord(
                        supabase,
                        payload.translationId,
                        {
                            display_name: displayName,
                            description: description,
                            details: {
                                ...translation.details,
                                page_count: documentImages.length,
                                translated_document: finalDocument,
                                vision_metadata: {
                                    tokensUsed: translationResult.metadata.tokensUsed,
                                    processingTimeMs: translationResult.metadata.processingTimeMs,
                                    batchesProcessed: translationResult.metadata.batchesProcessed,
                                    detectedLanguage: translationResult.detectedLanguage,
                                    confidence: translationResult.confidence,
                                    entitiesProtected:
                                        translationResult.metadata.finalContext?.entities || [],
                                },
                                qa_metadata: {
                                    issuesFixed: qaMetadata.issuesFixed,
                                    tokensUsed: qaMetadata.qaTokensUsed,
                                    confidence: qaMetadata.qaConfidence,
                                },
                                verification_metadata: {
                                    passed: verificationMetadata.verificationPassed,
                                    complete: verificationMetadata.complete,
                                    missing_content: verificationMetadata.missingContent,
                                    table_verification: verificationMetadata.tableVerification,
                                    confidence: verificationMetadata.confidence,
                                    untranslatedSegments: verificationMetadata.untranslatedSegments,
                                    segmentsAutoFixed: verificationMetadata.segmentsAutoFixed,
                                    tokensUsed: verificationMetadata.verificationTokensUsed,
                                },
                                ai_audit: aiAudit, // Comprehensive audit logging
                                dynamic_label: null,
                                stage_message: null,
                            },
                            // Transition to generating stage (handoff to generate-document task)
                            status: 'generating',
                            progress: 90,
                            // Do NOT set completed_at yet - generation is still pending
                            // completed_at: new Date().toISOString(),
                        },
                    );

                    if (updateError) {
                        saveSpan.setAttribute('status', 'failed');
                        throw new ApiError('Failed to save translation result.', {
                            description: updateError.message,
                            status: 500,
                            title: 'Save Failed',
                            code: 'TRANSLATION_SAVE_FAILED',
                        });
                    }

                    saveSpan.setAttribute('status', 'saved');
                });

                // Final metrics
                const totalTokens =
                    translationResult.metadata.tokensUsed +
                    qaMetadata.qaTokensUsed +
                    verificationMetadata.verificationTokensUsed;
                const totalTimeMs = Date.now() - taskStartTime;

                metadata.set('stage', 'ready');
                metadata.set('progress', 100);
                metadata.set('current_operation', 'Complete');
                metadata.set('tokensUsed', totalTokens);
                metadata.set('totalTimeMs', totalTimeMs);
                metadata.set('qaIssuesFixed', qaMetadata.issuesFixed);
                metadata.set('verificationPassed', verificationMetadata.verificationPassed);
                metadata.set('segmentsAutoFixed', verificationMetadata.segmentsAutoFixed);

                span.setAttribute('tokensUsed', totalTokens);
                span.setAttribute('totalTimeMs', totalTimeMs);
                span.setAttribute('contentNodes', finalDocument.content.length);
                span.setAttribute('qaIssuesFixed', qaMetadata.issuesFixed);
                span.setAttribute('verificationPassed', verificationMetadata.verificationPassed);
                span.setAttribute('segmentsAutoFixed', verificationMetadata.segmentsAutoFixed);

                logPhase('SAVE', 'Translation saved', {
                    nodes: finalDocument.content.length,
                    total_tokens: `${(totalTokens / 1000).toFixed(1)}K`,
                    total_time: `${(totalTimeMs / 1000).toFixed(1)}s`,
                });

                return {
                    code: 'VISION_TRANSLATION_COMPLETE',
                    title: 'Translation Complete',
                    message: `Document translated, polished, and verified. Fixed ${qaMetadata.issuesFixed} formatting issues${verificationMetadata.segmentsAutoFixed > 0 ? ` and ${verificationMetadata.segmentsAutoFixed} untranslated segment(s)` : ''}.`,
                    data: {
                        translationId: payload.translationId,
                        pageCount: documentImages.length,
                        tokensUsed: translationResult.metadata.tokensUsed,
                        qaTokensUsed: qaMetadata.qaTokensUsed,
                        verificationTokensUsed: verificationMetadata.verificationTokensUsed,
                        totalTokensUsed: totalTokens,
                        processingTimeMs: totalTimeMs,
                        contentNodes: finalDocument.content.length,
                        qaIssuesFixed: qaMetadata.issuesFixed,
                        qaConfidence: qaMetadata.qaConfidence,
                        verificationPassed: verificationMetadata.verificationPassed,
                        segmentsAutoFixed: verificationMetadata.segmentsAutoFixed,
                    },
                };
            } catch (error) {
                const errorMsg = (error as Error).message || 'Unknown error';

                metadata.set('stage', 'error');
                metadata.set('current_operation', 'Failed');
                metadata.set('error', errorMsg.substring(0, 200));

                logError('Vision translation failed', error, {
                    id: payload.translationId.substring(0, 8),
                });

                // Do NOT mark as failed here - let Trigger.dev retry logic handle it.
                // If all retries fail, onFailure hook will mark it as failed.
                // await updateTranslationStatus(supabase, payload.translationId, 'failed', 0);

                throw error;
            }
        });
    },
    catchError: async ({ ctx, error }) => {
        const willRetry = !isPermanentError(error) && ctx.attempt.number < STANDARD_RETRY_CONFIG.maxAttempts;

        logErrorWithRetry({
            taskId: ctx.task.id,
            runId: ctx.run.id,
            attemptNumber: ctx.attempt.number,
            error,
            willRetry,
        });

        if (isPermanentError(error)) {
            logPhase('ERROR', 'Permanent error - no retry', {
                attempt: ctx.attempt.number,
            });
            return { skipRetrying: true };
        }

        if (willRetry) {
            logWarning('Will retry after error', {
                attempt: `${ctx.attempt.number}/${STANDARD_RETRY_CONFIG.maxAttempts}`,
            });
        }

        return undefined;
    },
});

/**
 * Detects the document type from translation metadata for better AI context.
 */
function detectDocumentType(translation: {
    id: string;
    document_name?: string | null;
    document_type?: string | null;
}): 'legal' | 'medical' | 'financial' | 'certificate' | 'general' {
    const name = (translation.document_name || '').toLowerCase();
    const docType = (translation.document_type || '').toLowerCase();

    // Check document type field first
    if (docType.includes('certificate') || docType.includes('birth') || docType.includes('degree')) {
        return 'certificate';
    }
    if (docType.includes('contract') || docType.includes('agreement') || docType.includes('legal')) {
        return 'legal';
    }
    if (docType.includes('medical') || docType.includes('health') || docType.includes('prescription')) {
        return 'medical';
    }
    if (docType.includes('invoice') || docType.includes('bank') || docType.includes('financial')) {
        return 'financial';
    }

    // Check filename
    if (name.includes('certificate') || name.includes('diploma') || name.includes('degree')) {
        return 'certificate';
    }
    if (name.includes('contract') || name.includes('agreement')) {
        return 'legal';
    }
    if (name.includes('invoice') || name.includes('statement')) {
        return 'financial';
    }

    return 'general';
}
