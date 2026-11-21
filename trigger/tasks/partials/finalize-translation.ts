/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { logger, task } from '@trigger.dev/sdk';
import { ApiError } from '@errors/api-errors';
import { sendEmailSafely, sendTranslationCompleteEmail } from '@utils/emails/send-translation-email';
import { createAdminClient } from '@utils/supabase/server';
import {
    STANDARD_RETRY_CONFIG,
    isPermanentError,
    isTransientError,
    logErrorWithRetry,
} from '@/trigger/errors/classify-error';
import type { Tables } from '@/types/database/database';
import type { ApiResponseOrError } from '@/types/rest/response';
import type { TranslationTaskPayload } from '@/trigger/tasks/translation-task';

export const finalizeTranslationTask = task({
    id: 'finalize-translation-task',
    retry: STANDARD_RETRY_CONFIG,
    run: async (
        payload: TranslationTaskPayload,
        { ctx: _ctx },
    ): Promise<
        ApiResponseOrError<{
            translation: Tables<'translations'>;
        }>
    > => {
        return await logger.trace('Finalize Translation', async (span) => {
            span.setAttribute('translationId', payload.translationId);
            span.setAttribute('userId', payload.userId);

            logger.info('[FINALIZE] Finalizing Translation Task', {
                id: payload.translationId.substring(0, 8),
                profileId: payload.userId,
            });

            const supabase = await createAdminClient();

            // Update to 'completed' status (final state after Google Docs generation)
            const { data: translation, error } = await supabase
                .from('translations')
                .update({
                    status: 'completed',
                    progress: 100,
                    completed_at: new Date().toISOString(),
                })
                .eq('id', payload.translationId)
                .select()
                .single();

            if (error) {
                span.setAttribute('error', true);
                span.setAttribute('dbError', error.message);
                throw new ApiError('Failed to update the Translation status.', {
                    description: 'Failed to update the Translation status.',
                    status: 500,
                    title: 'Failed to Update Translation Status',
                    code: 'FAILED_TO_UPDATE_TRANSLATION_STATUS',
                });
            }

            // Send completion email notification
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('email, full_name')
                .eq('id', translation.profile_id)
                .single();

            if (profileError || !profile?.email) {
                span.setAttribute('emailSkipped', true);
                logger.warn('[FINALIZE] Could not fetch user email for notification', {
                    translationId: payload.translationId,
                    error: profileError?.message,
                });
            } else {
                const emailResult = await sendEmailSafely(
                    () =>
                        sendTranslationCompleteEmail({
                            to: profile.email,
                            translation,
                            profileName: profile.full_name || undefined,
                        }),
                    'translation-complete',
                );

                span.setAttribute('emailSent', emailResult.success);
                if (emailResult.success) {
                    logger.info('[FINALIZE] Translation complete email sent', {
                        recipient: profile.email,
                    });
                } else {
                    span.setAttribute('emailError', emailResult.error || 'unknown');
                    logger.error('[FINALIZE] Failed to send translation complete email', {
                        recipient: profile.email,
                        error: emailResult.error,
                    });
                }
            }

            span.setAttribute('status', 'completed');
            return {
                code: 'TRANSLATION_READY',
                title: 'Translation Task Ready!',
                message: 'The Translation Task has been finalized.',
                description: 'The system has finished processing the Translation.',
                data: {
                    translation,
                },
            };
        });
    },
    catchError: async ({ ctx, error, payload }) => {
        // Log error with retry context
        logErrorWithRetry({
            taskId: ctx.task.id,
            runId: ctx.run.id,
            attemptNumber: ctx.attempt.number,
            error,
            willRetry: !isPermanentError(error) && ctx.attempt.number < STANDARD_RETRY_CONFIG.maxAttempts,
        });

        // Permanent errors should fail fast
        if (isPermanentError(error)) {
            logger.error('[FINALIZE] Permanent error, skipping retries', {
                translationId: payload.translationId,
                error: error instanceof Error ? error.message : String(error),
            });
            return { skipRetrying: true };
        }

        // Transient database errors should retry
        if (isTransientError(error)) {
            logger.info('Transient error in finalization, will retry', {
                attempt: ctx.attempt.number,
            });
            return undefined;
        }

        // Unknown errors: allow retry for safety
        return undefined;
    },
});
