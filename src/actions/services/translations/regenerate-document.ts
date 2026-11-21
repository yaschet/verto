/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { validateUser } from '@/helpers/validate-user';
import { isApiError, standardizeError } from '@/src/errors/api-errors';
import { createServerClient } from '@/src/utils/supabase/server';
import { getLogger } from '@services/logger';
import { generateDocumentTask } from '@/trigger/tasks/partials/generate-document';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';

/**
 * Regenerate document after user edits
 *
 * This action triggers document regeneration using the user's edited content
 * (stored in user_edits) instead of the original AI translation.
 *
 * @async
 * @param {string} translationId - The ID of the translation to regenerate
 * @returns {Promise<ApiResponseOrError<{ regenerating: boolean; taskHandle?: unknown }>>} - Success status or an error
 */
export async function regenerateDocument({
    translationId,
}: {
    translationId: string;
}): Promise<ApiResponseOrError<{ regenerating: boolean; taskHandle?: unknown }>> {
    const logger = getLogger('ACTIONS:SERVICES:TRANSLATIONS:REGENERATE_DOCUMENT');

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

        // Fetch the translation to verify ownership and status
        const { data: translation, error: fetchError } = await supabase
            .from('translations')
            .select('*')
            .eq('id', translationId)
            .eq('profile_id', user.id)
            .single();

        if (fetchError || !translation) {
            const errorResponse = standardizeError({
                description: 'Translation not found or you do not have permission to regenerate it.',
                message: 'Translation not found.',
                status: 404,
                success: false,
                title: 'Not Found',
            });
            logger.error(['Translation not found:', errorResponse]);
            return errorResponse;
        }

        // Regeneration is only allowed when status is 'ready' or 'completed'
        if (translation.status !== 'ready' && translation.status !== 'completed') {
            // If already generating, return in-progress message (idempotent)
            if (translation.status === 'generating') {
                logger.info([
                    'Document generation already in progress:',
                    {
                        translationId,
                        status: translation.status,
                        userId: user.id,
                    },
                ]);

                return {
                    description: 'Document generation is already in progress.',
                    message: 'Generation in progress.',
                    status: 200,
                    success: true,
                    title: 'In Progress',
                    data: {
                        regenerating: true,
                    },
                };
            }

            const errorResponse = standardizeError({
                description: `Document cannot be regenerated in ${translation.status} status. Wait for the translation to complete first.`,
                message: 'Translation is not ready for regeneration.',
                status: 403,
                success: false,
                title: 'Not Ready',
            });
            logger.error(['Translation not ready for regeneration:', errorResponse]);
            return errorResponse;
        }

        // Check if user_edits exist
        const hasUserEdits = !!translation.details?.user_edits;
        if (!hasUserEdits) {
            logger.info([
                'No user edits found, regenerating from original translation:',
                {
                    translationId,
                    userId: user.id,
                },
            ]);
        }

        // Trigger the generate-document task with isRegeneration flag
        try {
            const taskHandle = await generateDocumentTask.trigger(
                {
                    translationId: translation.id,
                    userId: user.id,
                    isRegeneration: true,
                },
                {
                    idempotencyKey: `regenerate-doc-${translation.id}-${Date.now()}`,
                    concurrencyKey: translation.id,
                    tags: [
                        'regenerate',
                        translation.display_name,
                        `user:${user.id}`,
                        `translation:${translation.id}`,
                    ],
                },
            );

            logger.info([
                'Document regeneration task triggered:',
                {
                    translationId,
                    userId: user.id,
                    taskHandle: taskHandle.id,
                    hasUserEdits,
                },
            ]);

            return {
                description: hasUserEdits
                    ? 'Document regeneration started using your edits.'
                    : 'Document regeneration started using original translation.',
                message: 'Regeneration started.',
                status: 200,
                success: true,
                title: 'Regenerating',
                data: {
                    regenerating: true,
                    taskHandle,
                },
            };
        } catch (taskError) {
            const errorResponse: ApiErrorType = isApiError(taskError)
                ? (taskError as ApiErrorType)
                : standardizeError(taskError);
            logger.error(['Error triggering document regeneration task:', errorResponse]);
            return errorResponse;
        }
    } catch (error) {
        const errorResponse = standardizeError(error);
        logger.error(['Error regenerating document:', errorResponse]);
        return errorResponse;
    }
}
