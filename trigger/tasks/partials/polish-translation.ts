/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { logger, metadata, tags, task } from '@trigger.dev/sdk';
import {
    type QAConfig,
    type QAProgressCallback,
    type QAResult,
    polishTranslatedDocument,
} from '@utils/ai/vision-document-qa';
import { createAdminClient } from '@utils/supabase/server';
import { STANDARD_RETRY_CONFIG, isPermanentError, logErrorWithRetry } from '@/trigger/errors/classify-error';
import { logError, logPhase, logSummary, logWarning, updateLiveStatus } from '@/trigger/logging';
import { updateTranslationStatus } from '@/trigger/utilities/translation';
import type { NormalisedDocument } from '@/engine/document/types';

/**
 * Payload for the polish translation task.
 */
export type PolishTranslationPayload = {
    /** Translation ID */
    translationId: string;
    /** User ID */
    userId: string;
    /** Original document images (base64 with data URI prefix) */
    originalImages: string[];
    /** The translated document from vision translator */
    translatedDocument: NormalisedDocument;
    /** Target language */
    targetLanguage: string;
    /** Optional: specific areas to focus on */
    focusAreas?: QAConfig['focusAreas'];
};

export const polishTranslationTask = task({
    id: 'polish-translation',
    retry: STANDARD_RETRY_CONFIG,
    machine: {
        preset: 'medium-1x', // 1 vCPU, 2 GB RAM
    },
    run: async (payload: PolishTranslationPayload, { ctx: _ctx }) => {
        const supabase = await createAdminClient();
        const taskStartTime = Date.now();

        return await logger.trace('Polish Translation', async (span) => {
            try {
                // Set tags for filtering
                tags.add(`id:${payload.translationId.substring(0, 8)}`);
                tags.add('polish');

                // Initialize metadata
                metadata.set('stage', 'polishing');
                metadata.set('progress', 0);
                metadata.set('translationId', payload.translationId);
                updateLiveStatus('Starting QA');

                span.setAttribute('translationId', payload.translationId);
                span.setAttribute('pageCount', payload.originalImages.length);

                // Update status
                await updateTranslationStatus(supabase, payload.translationId, 'polishing', 85);
                metadata.set('progress', 85);

                logPhase('POLISH', 'Starting quality review', {
                    pages: payload.originalImages.length,
                    nodes: payload.translatedDocument.content.length,
                });

                // Configure QA pass
                const qaConfig: Partial<QAConfig> = {
                    targetLanguage: payload.targetLanguage,
                    maxPagesPerBatch: 5,
                    focusAreas: payload.focusAreas || ['all'],
                };

                // Progress callback
                const onProgress: QAProgressCallback = async (progress) => {
                    metadata.set('qaStage', progress.stage);

                    if (progress.batchIndex !== undefined && progress.totalBatches !== undefined) {
                        metadata.set('currentBatch', progress.batchIndex);
                        metadata.set('totalBatches', progress.totalBatches);
                        updateLiveStatus(
                            'Quality review',
                            `batch ${progress.batchIndex + 1}/${progress.totalBatches}`,
                        );
                    }

                    if (progress.dynamic_label) {
                        metadata.set('dynamic_label', progress.dynamic_label);
                    }
                    if (progress.stage_message) {
                        metadata.set('stage_message', progress.stage_message);
                    }

                    // Calculate progress (85-95% range)
                    let dbProgress = 85;
                    if (progress.stage === 'polishing') {
                        dbProgress = 85 + Math.round((progress.percent / 100) * 10);
                    } else if (progress.stage === 'finalizing') {
                        dbProgress = 95;
                    }

                    metadata.set('progress', dbProgress);

                    await updateTranslationStatus(
                        supabase,
                        payload.translationId,
                        'polishing',
                        dbProgress,
                        progress.dynamic_label || progress.stage_message
                            ? { dynamic_label: progress.dynamic_label, stage_message: progress.stage_message }
                            : undefined,
                    );
                };

                // Run QA pass with timing span
                const qaResult: QAResult = await logger.trace('QA Pass', async (qaSpan) => {
                    qaSpan.setAttribute('pageCount', payload.originalImages.length);
                    qaSpan.setAttribute('focusAreas', (payload.focusAreas || ['all']).join(','));

                    const result = await polishTranslatedDocument(
                        payload.originalImages,
                        payload.translatedDocument,
                        qaConfig,
                        onProgress,
                    );

                    qaSpan.setAttribute('issuesFixed', result.issuesFixed.length);
                    qaSpan.setAttribute('tokensUsed', result.metadata.tokensUsed);
                    qaSpan.setAttribute('confidence', result.confidence);

                    return result;
                });

                const totalTimeMs = Date.now() - taskStartTime;

                // Update metadata with results
                metadata.set('stage', 'completed');
                metadata.set('progress', 95);
                metadata.set('current_operation', 'Complete');
                metadata.set('issuesFixed', qaResult.issuesFixed.length);
                metadata.set('qaTokensUsed', qaResult.metadata.tokensUsed);
                metadata.set('qaConfidence', qaResult.confidence);
                metadata.set('dynamic_label', '');
                metadata.set('stage_message', '');

                span.setAttribute('issuesFixed', qaResult.issuesFixed.length);
                span.setAttribute('tokensUsed', qaResult.metadata.tokensUsed);
                span.setAttribute('confidence', qaResult.confidence);
                span.setAttribute('totalTimeMs', totalTimeMs);

                // Count issue types for summary
                const issueBreakdown = {
                    align: qaResult.issuesFixed.filter((i) => i.type === 'alignment').length,
                    table: qaResult.issuesFixed.filter((i) => i.type === 'table').length,
                    format: qaResult.issuesFixed.filter((i) => i.type === 'formatting').length,
                };

                logSummary('Quality review', {
                    fixes: qaResult.issuesFixed.length,
                    tokens: `${(qaResult.metadata.tokensUsed / 1000).toFixed(1)}K`,
                    time: `${(totalTimeMs / 1000).toFixed(1)}s`,
                    confidence: `${(qaResult.confidence * 100).toFixed(0)}%`,
                    ...(issueBreakdown.align > 0 && { align: issueBreakdown.align }),
                    ...(issueBreakdown.table > 0 && { table: issueBreakdown.table }),
                    ...(issueBreakdown.format > 0 && { format: issueBreakdown.format }),
                });

                return {
                    code: 'POLISH_COMPLETE',
                    title: 'Quality Assurance Complete',
                    message: `Fixed ${qaResult.issuesFixed.length} formatting issues.`,
                    data: {
                        polishedDocument: qaResult.polishedDocument,
                        issuesFixed: qaResult.issuesFixed,
                        confidence: qaResult.confidence,
                        metadata: qaResult.metadata,
                    },
                };
            } catch (error) {
                const errorMsg = (error as Error).message || 'Unknown error';

                metadata.set('stage', 'error');
                metadata.set('current_operation', 'Failed');
                metadata.set('error', errorMsg.substring(0, 200));

                logError('Polish pass failed', error, {
                    id: payload.translationId.substring(0, 8),
                });

                logWarning('Returning original document due to polish failure');

                return {
                    code: 'POLISH_SKIPPED',
                    title: 'Quality Assurance Skipped',
                    message: 'Polish pass failed, using original translation.',
                    data: {
                        polishedDocument: payload.translatedDocument,
                        issuesFixed: [],
                        confidence: 0.5,
                        metadata: {
                            tokensUsed: 0,
                            processingTimeMs: 0,
                            batchesProcessed: 0,
                        },
                        error: errorMsg,
                    },
                };
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
            logPhase('ERROR', 'Permanent error - no retry', { attempt: ctx.attempt.number });
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
