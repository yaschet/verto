/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { validateUser } from '@/helpers/validate-user';
import { isApiError, standardizeError } from '@/src/errors/api-errors';
import { createServerClient } from '@/src/utils/supabase/server';
import { getLogger } from '@services/logger';
import { generateDocsTask } from '@/trigger/tasks/generate-docs-task';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';

/**
 * Approve a translation and trigger document generation
 * @async
 * @param {string} translationId - The ID of the translation to approve
 * @param {string} [comments] - Optional approval comments
 * @returns {Promise<ApiResponseOrError<{ approved: boolean; taskHandle?: RunHandle }>>} - Success status or an error
 */
export async function approveTranslation({
    comments,
    translationId,
}: {
    translationId: string;
    comments?: string;
}): Promise<ApiResponseOrError<{ approved: boolean; taskHandle?: unknown }>> {
    const logger = getLogger('ACTIONS:SERVICES:TRANSLATIONS:APPROVE_TRANSLATION');

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
                description: 'Translation not found or you do not have permission to approve it.',
                message: 'Translation not found.',
                status: 404,
                success: false,
                title: 'Not Found',
            });
            logger.error(['Translation not found:', errorResponse]);
            return errorResponse;
        }

        // Check if translation is in ready status (user can approve for document generation)
        if (translation.status !== 'ready') {
            // If already generating/completed, return success (idempotent)
            if (['generating', 'completed'].includes(translation.status)) {
                logger.info([
                    'Translation already approved:',
                    {
                        translationId,
                        status: translation.status,
                        userId: user.id,
                    },
                ]);

                return {
                    description: 'Translation has already been approved.',
                    message: 'Already approved.',
                    status: 200,
                    success: true,
                    title: 'Success',
                    data: {
                        approved: true,
                    },
                };
            }

            const errorResponse = standardizeError({
                description: `Translation cannot be approved in ${translation.status} status.`,
                message: 'Translation is not ready for approval.',
                status: 403,
                success: false,
                title: 'Not Ready',
            });
            logger.error(['Translation not ready for approval:', errorResponse]);
            return errorResponse;
        }

        // Update status to 'generating'
        const { error: updateError } = await supabase
            .from('translations')
            .update({
                status: 'generating',
                updated_at: new Date().toISOString(),
                details: {
                    ...translation.details,
                    approval_comments: comments,
                    approved_by: user.id,
                    approved_at: new Date().toISOString(),
                },
            })
            .eq('id', translationId);

        if (updateError) {
            const errorResponse = standardizeError(updateError);
            logger.error(['Error updating translation status:', errorResponse]);
            return errorResponse;
        }

        // Trigger the generate-docs task
        try {
            const taskHandle = await generateDocsTask.trigger(
                {
                    translationId: translation.id,
                    userId: user.id,
                },
                {
                    idempotencyKey: `generate-docs-${translation.id}`,
                    concurrencyKey: translation.id,
                    tags: [
                        'generate-docs',
                        translation.display_name,
                        `user:${user.id}`,
                        `translation:${translation.id}`,
                    ],
                },
            );

            logger.info([
                'Document generation task triggered:',
                {
                    translationId,
                    userId: user.id,
                    taskHandle: taskHandle.id,
                },
            ]);

            return {
                description: 'Translation approved and document generation started.',
                message: 'Translation approved successfully.',
                status: 200,
                success: true,
                title: 'Approved',
                data: {
                    approved: true,
                    taskHandle,
                },
            };
        } catch (taskError) {
            // Rollback the status change
            await supabase
                .from('translations')
                .update({
                    status: 'ready',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', translationId);

            const errorResponse: ApiErrorType = isApiError(taskError)
                ? (taskError as ApiErrorType)
                : standardizeError(taskError);
            logger.error(['Error triggering document generation task:', errorResponse]);
            return errorResponse;
        }
    } catch (error) {
        const errorResponse = standardizeError(error);
        logger.error(['Error approving translation:', errorResponse]);
        return errorResponse;
    }
}
