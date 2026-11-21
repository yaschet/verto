/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { logger, task } from '@trigger.dev/sdk';
import { ApiError } from '@errors/api-errors';
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

export const initializeTranslationTask = task({
    id: 'initialize-translation-task',
    retry: STANDARD_RETRY_CONFIG,
    run: async (
        payload: TranslationTaskPayload,
        { ctx: _ctx },
    ): Promise<
        ApiResponseOrError<{
            translation: Tables<'translations'>;
        }>
    > => {
        return await logger.trace('Initialize Translation', async (span) => {
            span.setAttribute('translationId', payload.translationId);
            span.setAttribute('userId', payload.userId);

            logger.info('[INIT] Initializing translation task', {
                id: payload.translationId.substring(0, 8),
                profileId: payload.userId,
            });

            const supabase = await createAdminClient();

            // Update status and progress (5% - queued -> processing)
            const { data: translation, error: statusError } = await supabase
                .from('translations')
                .update({
                    status: 'processing',
                    progress: 5,
                    started_at: new Date().toISOString(),
                    completed_at: null,
                })
                .eq('id', payload.translationId)
                .select()
                .single();

            if (statusError) {
                span.setAttribute('error', true);
                span.setAttribute('dbError', statusError.message);
                throw new ApiError('Failed to update the Translation status.', {
                    description: 'Failed to update the Translation status.',
                    status: 500,
                    title: 'Failed to Update Translation Status',
                    code: 'FAILED_TO_UPDATE_TRANSLATION_STATUS',
                });
            }

            span.setAttribute('status', 'success');
            return {
                success: true,
                code: 'TRANSLATION_INITIALIZED',
                title: 'Translation Task Initialized!',
                message: 'The Translation Task has been initialized.',
                description: 'The system will now begin processing the Translation.',
                data: {
                    translation,
                },
            } as ApiResponseOrError<{
                translation: Tables<'translations'>;
            }>;
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

        // Permanent errors should fail immediately (e.g., translation not found)
        if (isPermanentError(error)) {
            logger.info('Permanent error in initialization, skipping retries', {
                translationId: payload.translationId,
            });
            return { skipRetrying: true };
        }

        // Transient errors (database connection issues) should retry
        if (isTransientError(error)) {
            logger.info('Transient error in initialization, will retry', {
                attempt: ctx.attempt.number,
            });
            return undefined;
        }

        // Unknown errors: allow retry
        return undefined;
    },
});
