/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { revalidatePath } from 'next/cache';
import { validateUser } from '@/helpers/validate-user';
import { isApiError, standardizeError } from '@errors/api-errors';
import { createServerClient } from '@utils/supabase/server';
import { translationTask } from '@/trigger/tasks/translation-task';
import { getLogger } from '@services/logger';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';

const logger = getLogger('ACTIONS:SERVICES:TRANSLATIONS:RETRY_TRANSLATION');

/**
 * Retry a failed or canceled translation
 *
 * This action:
 * 1. Validates user ownership of the translation
 * 2. Checks the translation is in a retryable state (failed, canceled)
 * 3. Resets the translation status to 'queued'
 * 4. Triggers a new translation task run
 *
 * @param translationId - The ID of the translation to retry
 * @returns Success or error response
 */
export async function retryTranslation({
    translationId,
}: {
    translationId: string;
}): Promise<ApiResponseOrError> {
    try {
        const { user } = await validateUser();

        if (!translationId) {
            const errorResponse = standardizeError({
                description: 'The translation ID is missing.',
                message: 'Translation ID is missing.',
                status: 400,
                success: false,
                title: 'Missing Translation ID',
            });
            logger.error(['Error retrying translation:', errorResponse]);
            return errorResponse;
        }

        const supabase = await createServerClient();

        // 1. Verify ownership and fetch current status + details
        const { data: translation, error: fetchError } = await supabase
            .from('translations')
            .select('id, profile_id, status, file_url, source_language, target_language, details')
            .eq('id', translationId)
            .eq('profile_id', user.id)
            .single();

        if (fetchError || !translation) {
            const errorResponse = standardizeError({
                description: 'The translation was not found or you do not have permission to retry it.',
                message: 'Translation not found.',
                status: 404,
                success: false,
                title: 'Translation Not Found',
            });
            logger.error(['Translation not found:', errorResponse]);
            return errorResponse;
        }

        // 2. Check if the translation is in a retryable state
        const retryableStatuses = ['failed', 'canceled', 'ready', 'completed'];
        if (!retryableStatuses.includes(translation.status)) {
            const errorResponse = standardizeError({
                description: `Only failed, canceled, or completed translations can be retried. Current status: ${translation.status}`,
                message: 'Cannot retry this translation.',
                status: 400,
                success: false,
                title: 'Cannot Retry Translation',
            });
            logger.error(['Cannot retry translation:', errorResponse]);
            return errorResponse;
        }

        // 3. Reset translation status and WIPE all AI-generated content

        const existingDetails = (translation.details as Record<string, unknown>) || {};
        const cleanDetails = {
            // Keep only file-related metadata from the original upload
            file_metadata: existingDetails.file_metadata,
            // Everything else is wiped:
            // - translated_document (AI translation output)
            // - user_edits (user's TipTap changes)
            // - ai_audit (AI quality audit)
            // - verification_metadata (verification results)
            // - generated_docx (Google Docs URLs)
            // - progress_history (pipeline stage history)
            // - dynamic_label / stage_message (current stage info)
        };

        const { error: updateError } = await supabase
            .from('translations')
            .update({
                status: 'queued',
                started_at: null,
                completed_at: null,
                progress: 0,
                details: cleanDetails,
            })
            .eq('id', translationId);

        if (updateError) {
            const errorResponse = standardizeError({
                description: 'Failed to reset translation status.',
                message: 'Database update failed.',
                status: 500,
                success: false,
                title: 'Update Failed',
            });
            logger.error(['Failed to update translation status:', updateError]);
            return errorResponse;
        }

        // 4. Trigger a new translation task
        await translationTask.trigger({
            translationId,
            userId: user.id,
        });

        logger.info(['Translation retry triggered:', { translationId, userId: user.id }]);

        // Revalidate the translations page to reflect the status change
        revalidatePath('/app/translations');
        revalidatePath(`/app/translations/${translationId}`);

        return {
            description: 'The translation has been queued for retry.',
            message: 'Translation retry started.',
            status: 200,
            success: true,
            title: 'Retry Started',
        };
    } catch (error) {
        const errorResponse: ApiErrorType = isApiError(error)
            ? (error as ApiErrorType)
            : standardizeError(error);
        logger.error(['Error retrying translation:', errorResponse]);
        return errorResponse;
    }
}
