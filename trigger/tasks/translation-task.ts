/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { logger, metadata, tags, task } from '@trigger.dev/sdk';
import { ApiError, isApiError } from '@errors/api-errors';
import { sendEmailSafely, sendTranslationFailedEmail } from '@utils/emails/send-translation-email';
import { refundCreditsForFailedTranslation } from '@utils/supabase/credits';
import { createAdminClient } from '@utils/supabase/server';
import { createNotification } from '@/src/lib/notifications/create-notification';
import {
    STANDARD_RETRY_CONFIG,
    calculateRetryFromHeaders,
    isPermanentError,
    isTransientError,
    logErrorWithRetry,
} from '@/trigger/errors/classify-error';
import { logError, logPhase, logRetry, logWarning } from '@/trigger/logging';
import { generateDocumentTask } from '@/trigger/tasks/partials/generate-document';
import { initializeTranslationTask } from '@/trigger/tasks/partials/initialize-translation';
import { visionTranslateDocumentTask } from '@/trigger/tasks/partials/vision-translate-document';
import { updateTranslationRecord } from '@/trigger/utilities/translation';
import { getModelForTask } from '@utils/ai/providers/openai-adapter';
import type { ApiErrorType } from '@/types/rest/errors';

export type TranslationTaskPayload = {
    translationId: string;
    userId: string;
};

export const translationTask = task({
    id: 'translation-task',
    queue: {
        name: 'translation-queue',
    },
    retry: STANDARD_RETRY_CONFIG,
    // Increase maxDuration to 24 hours to match child tasks and prevent parent timeout
    maxDuration: 86400,
    run: async (payload: TranslationTaskPayload, { ctx }) => {
        const supabase = await createAdminClient();
        const runStartTime = Date.now();

        // Set run-level tags for dashboard filtering
        tags.add(`id:${payload.translationId.substring(0, 8)}`);
        tags.add(`user:${payload.userId.substring(0, 8)}`);

        // Set initial metadata
        metadata.set('translationId', payload.translationId);
        metadata.set('phase', 'initializing');
        metadata.set('current_operation', 'Starting pipeline');

        // Fetch user info with proper span
        const user = await logger.trace('fetch-user-profile', async (span) => {
            span.setAttribute('userId', payload.userId);

            const { data: profile, error } = await supabase
                .from('profiles')
                .select('id, full_name')
                .eq('id', payload.userId)
                .single();

            if (error || !profile) {
                logError('User profile fetch failed', error, { userId: payload.userId });
                throw new ApiError(
                    'Failed to retrieve the user record.',
                    {
                        description: 'Failed to retrieve the user record.',
                        status: 500,
                        title: 'Failed to Retrieve User Record',
                        code: 'FAILED_TO_RETRIEVE_USER_RECORD',
                    },
                    error,
                );
            }

            span.setAttribute('userName', profile.full_name || 'Unknown');
            return profile;
        });

        metadata.set('userName', user.full_name || 'Unknown');
        logger.info(`[PIPELINE] Started | type=vision, model=${getModelForTask('translation')}`, {
            id: payload.translationId.substring(0, 8),
            user: user.full_name?.split(' ')[0] || 'Unknown',
        });

        try {
            // Step 1: Initialize Translation
            metadata.set('current_operation', 'Initializing');
            metadata.set('phase', 'processing');

            await logger.trace('initialize-translation', async (span) => {
                span.setAttribute('translationId', payload.translationId);
                logger.info('[INIT] Starting validation and upload');

                const result = await initializeTranslationTask
                    .triggerAndWait(payload, {
                        tags: ['init', `id:${payload.translationId.substring(0, 8)}`],
                    })
                    .unwrap();

                if (!result?.error && result?.code === 'TRANSLATION_INITIALIZED') {
                    span.setAttribute('status', 'success');
                    logger.info('[INIT] Completed successfully | credits=ok, file=uploaded');
                    return result;
                }

                span.setAttribute('status', 'failed');
                throw new ApiError('Failed to initialize the Translation Task.', {
                    description: 'Failed to initialize the Translation Task.',
                    status: 500,
                    title: 'Failed to Initialize Translation Task',
                    code: 'FAILED_TO_INITIALIZE_TRANSLATION_TASK',
                });
            });

            // Step 2: Vision Translation (main work)
            metadata.set('current_operation', 'Translating document');
            metadata.set('phase', 'translating');

            const translationResult = await logger.trace('vision-translation', async (span) => {
                span.setAttribute('translationId', payload.translationId);
                logger.info('[TRANSLATE] Starting vision translation task');

                const result = await visionTranslateDocumentTask
                    .triggerAndWait(payload, {
                        tags: ['translate', `id:${payload.translationId.substring(0, 8)}`],
                    })
                    .unwrap();

                // Log completion with metrics from result
                const data = result?.data || {};
                span.setAttribute('pageCount', data.pageCount || 0);
                span.setAttribute('totalTokens', data.totalTokensUsed || 0);
                span.setAttribute('qaIssuesFixed', data.qaIssuesFixed || 0);

                logger.info(
                    '[TRANSLATE] Task completed | pages=' +
                        (data.pageCount || 0) +
                        ', tokens=' +
                        (data.totalTokensUsed || 0),
                );
                return result;
            });

            // Step 3: Generate Document (AUTOMATIC)
            metadata.set('current_operation', 'Generating document');
            metadata.set('phase', 'generating');

            await logger.trace('generate-document', async (span) => {
                span.setAttribute('translationId', payload.translationId);
                logger.info('[GENERATE] Starting DOCX generation');

                const result = await generateDocumentTask
                    .triggerAndWait(payload, {
                        tags: ['generate', `id:${payload.translationId.substring(0, 8)}`],
                    })
                    .unwrap();

                span.setAttribute('status', 'success');
                logger.info('[GENERATE] Completed | format=docx, upload=success');

                return result;
            });

            // Pipeline complete
            const totalTimeMs = Date.now() - runStartTime;
            metadata.set('current_operation', 'Complete');
            metadata.set('phase', 'ready');
            metadata.set('progress', 100);
            metadata.set('totalTimeMs', totalTimeMs);

            logger.info('[PIPELINE] Success | duration=' + (totalTimeMs / 1000).toFixed(1) + 's', {
                id: payload.translationId.substring(0, 8),
                pages: translationResult?.data?.pageCount || '?',
                tokens: translationResult?.data?.totalTokensUsed || '?',
                fixes: translationResult?.data?.qaIssuesFixed || 0,
            });

            // Create notification for successful translation
            await logger.trace('create-success-notification', async (span) => {
                try {
                    const { data: translation } = await supabase
                        .from('translations')
                        .select('display_name')
                        .eq('id', payload.translationId)
                        .single();

                    const filename = translation?.display_name || 'document';

                    const result = await createNotification({
                        profileId: payload.userId,
                        type: 'translation_complete',
                        title: 'Translation Ready',
                        message: `Your translation for "${filename}" is complete and ready for download.`,
                        link: `/app/translations/${payload.translationId}`,
                        metadata: { translationId: payload.translationId, filename },
                    });

                    span.setAttribute('success', result.success);
                    if (!result.success) {
                        logger.error('[FINALIZE] Success notification failed', { error: result.error });
                    } else {
                        logger.info('[FINALIZE] Success notification sent');
                    }
                } catch (error) {
                    span.setAttribute('exception', true);
                    logger.error('[FINALIZE] Success notification exception', { error });
                }
            });
        } catch (error) {
            const errorMsg = error instanceof Error ? (error as Error).message : String(error);
            metadata.set('phase', 'failed');
            metadata.set('current_operation', 'Failed');
            metadata.set('error', errorMsg.substring(0, 200));

            logger.error('[PIPELINE] Failed | attempt=' + ctx.attempt.number, {
                id: payload.translationId.substring(0, 8),
                error: errorMsg,
            });

            // Update translation status to "failed"
            await logger.trace('update-status-failed', async (span) => {
                try {
                    await updateTranslationRecord(supabase, payload.translationId, {
                        status: 'failed',
                        completed_at: new Date().toISOString(),
                    });
                    span.setAttribute('status', 'updated');
                    logger.info('[FINALIZE] Status updated to failed');
                } catch (dbError) {
                    span.setAttribute('status', 'db_error');
                    logger.error('[FINALIZE] Status update failed', { error: dbError });
                }
            });

            // Refund credits for failed translation
            await logger.trace('refund-credits', async (span) => {
                try {
                    const { data: transaction, error: txError } = await supabase
                        .from('credits_transactions')
                        .select('credits')
                        .eq('translation_id', payload.translationId)
                        .eq('type', 'consumption')
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .single();

                    if (transaction && !txError) {
                        const refundResult = await refundCreditsForFailedTranslation(supabase, {
                            userId: payload.userId,
                            translationId: payload.translationId,
                            creditsToRefund: transaction.credits,
                            reason: errorMsg || 'Translation task failed',
                        });

                        if (refundResult.success) {
                            span.setAttribute('creditsRefunded', transaction.credits);
                            span.setAttribute('newBalance', refundResult.newBalance || 0);
                            logger.info(
                                '[FINALIZE] Credits refunded | amount=' +
                                    transaction.credits +
                                    ', balance=' +
                                    refundResult.newBalance,
                            );
                        } else {
                            span.setAttribute('refundError', refundResult.error || 'Unknown');
                            logger.error('[FINALIZE] Credit refund failed', { error: refundResult.error });
                        }
                    } else {
                        span.setAttribute('noTransaction', true);
                        logger.warn('[FINALIZE] No credit transaction found for refund');
                    }
                } catch (refundError) {
                    span.setAttribute('exception', true);
                    logger.error('[FINALIZE] Credit refund exception', { error: refundError });
                }
            });

            // Send failure email notification
            await logger.trace('send-failure-email', async (span) => {
                try {
                    const { data: profile, error: profileError } = await supabase
                        .from('profiles')
                        .select('email, full_name')
                        .eq('id', payload.userId)
                        .single();

                    if (profileError || !profile?.email) {
                        span.setAttribute('status', 'no_email');
                        logger.warn('[FINALIZE] No email for failure notification');
                        return;
                    }

                    const { data: translation } = await supabase
                        .from('translations')
                        .select('*')
                        .eq('id', payload.translationId)
                        .single();

                    if (translation) {
                        const emailResult = await sendEmailSafely(
                            () =>
                                sendTranslationFailedEmail({
                                    to: profile.email,
                                    translation,
                                    errorMessage: errorMsg || 'An unexpected error occurred',
                                    profileName: profile.full_name || undefined,
                                }),
                            'translation-failed',
                        );

                        span.setAttribute('emailSent', emailResult.success);
                        if (!emailResult.success) {
                            logger.error('[FINALIZE] Failure email send failed', {
                                error: emailResult.error,
                            });
                        } else {
                            logger.info('[FINALIZE] Failure email sent');
                        }
                    }
                } catch (emailError) {
                    span.setAttribute('exception', true);
                    logger.error('[FINALIZE] Email notification exception', { error: emailError });
                }
            });

            // Create notification for failed translation
            await logger.trace('create-failure-notification', async (span) => {
                try {
                    const { data: translation } = await supabase
                        .from('translations')
                        .select('display_name')
                        .eq('id', payload.translationId)
                        .single();

                    const filename = translation?.display_name || 'document';

                    const result = await createNotification({
                        profileId: payload.userId,
                        type: 'translation_failed',
                        title: 'Translation Failed',
                        message: `We encountered an error while translating "${filename}". Your credits have been refunded.`,
                        link: `/app/translations/${payload.translationId}`,
                        metadata: {
                            translationId: payload.translationId,
                            filename,
                            error: errorMsg.substring(0, 100),
                        },
                    });

                    span.setAttribute('success', result.success);
                    if (!result.success) {
                        logger.error('[FINALIZE] Failure notification failed', { error: result.error });
                    } else {
                        logger.info('[FINALIZE] Failure notification created');
                    }
                } catch (notiError) {
                    span.setAttribute('exception', true);
                    logger.error('[FINALIZE] Failure notification exception', { error: notiError });
                }
            });

            throw new ApiError('Translation task aborted due to a child task failure.', {
                description: errorMsg,
                status: 500,
                title: 'Translation Task Aborted',
                code: 'TRANSLATION_TASK_ABORTED',
            });
        }

        return {
            message: 'Translation Task Completed!',
        };
    },
    catchError: async ({ ctx, error, payload }) => {
        const supabase = await createAdminClient();
        const willRetry = !isPermanentError(error) && ctx.attempt.number < STANDARD_RETRY_CONFIG.maxAttempts;
        const errorMsg = error instanceof Error ? error.message : String(error);

        // Log the error with retry context
        logErrorWithRetry({
            taskId: ctx.task.id,
            runId: ctx.run.id,
            attemptNumber: ctx.attempt.number,
            error,
            willRetry,
        });

        // Update status to failed if not retrying
        if (!willRetry) {
            await logger.trace('mark-translation-failed', async (span) => {
                span.setAttribute('translationId', payload.translationId);
                span.setAttribute('attemptNumber', ctx.attempt.number);
                span.setAttribute('errorType', error?.constructor?.name || 'Unknown');

                const { error: updateError } = await updateTranslationRecord(
                    supabase,
                    payload.translationId,
                    {
                        status: 'failed',
                        completed_at: new Date().toISOString(),
                    },
                );

                if (updateError) {
                    span.setAttribute('dbUpdateFailed', true);
                    logError('Failed to mark translation as failed', updateError);
                }
            });
        }

        // Handle permanent errors (no retry)
        if (isPermanentError(error)) {
            const apiError = isApiError(error) ? (error as ApiErrorType) : null;
            logPhase('ERROR', 'Permanent error - no retry', {
                code: apiError?.code,
                status: apiError?.status,
            });
            return { skipRetrying: true };
        }

        // Handle rate limits with header-based delay
        if (isApiError(error)) {
            const apiError = error as ApiErrorType & { headers?: Record<string, string> };
            if (apiError.status === 429) {
                const retryAt = calculateRetryFromHeaders(apiError.headers || {});
                if (retryAt) {
                    logRetry({
                        operation: 'API call',
                        attempt: ctx.attempt.number,
                        maxAttempts: STANDARD_RETRY_CONFIG.maxAttempts,
                        error,
                        delayMs: retryAt.getTime() - Date.now(),
                    });
                    return { retryAt };
                }
            }
        }

        // Handle transient errors with exponential backoff
        if (isTransientError(error)) {
            logRetry({
                operation: 'Translation',
                attempt: ctx.attempt.number,
                maxAttempts: STANDARD_RETRY_CONFIG.maxAttempts,
                error,
            });
            return undefined;
        }

        // Unknown error type - allow retry with warning
        logWarning('Unknown error type, allowing retry', {
            attempt: ctx.attempt.number,
            error: errorMsg.substring(0, 100),
        });
        return undefined;
    },
});
