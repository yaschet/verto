/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { revalidatePath } from 'next/cache';
import { validateUser } from '@/helpers/validate-user';
import { isApiError, standardizeError } from '@errors/api-errors';
import { getLogger } from '@services/logger';
import { createServerClient } from '@utils/supabase/server';
import { generateDocumentTask } from '@/trigger/tasks/partials/generate-document';
import { visionTranslateDocumentTask } from '@/trigger/tasks/partials/vision-translate-document';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';

const logger = getLogger('ACTIONS:SERVICES:TRANSLATIONS:RETRY_FROM_STAGE');

/**
 * Pipeline stages that can be retried independently
 */
export type RetryStage = 'translate' | 'generate';

/**
 * Retry a failed translation from a specific pipeline stage
 *
 * This enables granular retries for checkpoint-based pipeline recovery:
 * - 'translate': Clears translated_document + generated_docx, retriggers translation
 * - 'generate': Clears generated_docx only, retriggers document generation
 *
 * Time savings:
 * - Full retry: ~60+ seconds (entire pipeline)
 * - Retry from 'generate': ~10 seconds (skips translation)
 *
 * @param translationId - The ID of the translation to retry
 * @param stage - The stage to retry from ('translate' or 'generate')
 * @returns Success or error response
 */
export async function retryFromStage({
    translationId,
    stage,
}: {
    translationId: string;
    stage: RetryStage;
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
            logger.error(['Error retrying from stage:', errorResponse]);
            return errorResponse;
        }

        if (!stage || !['translate', 'generate'].includes(stage)) {
            const errorResponse = standardizeError({
                description: 'Invalid retry stage. Must be "translate" or "generate".',
                message: 'Invalid retry stage.',
                status: 400,
                success: false,
                title: 'Invalid Stage',
            });
            logger.error(['Invalid retry stage:', errorResponse]);
            return errorResponse;
        }

        const supabase = await createServerClient();

        // 1. Verify ownership and fetch current state
        const { data: translation, error: fetchError } = await supabase
            .from('translations')
            .select('id, profile_id, status, details')
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

        // 2. Validate the requested retry makes sense
        const existingDetails = (translation.details as Record<string, unknown>) || {};
        const hasTranslatedDocument = !!existingDetails.translated_document;
        const _failedAtStage = existingDetails.failed_at_stage as string | undefined;

        // For 'generate' retry, translation must already be complete
        if (stage === 'generate' && !hasTranslatedDocument) {
            const errorResponse = standardizeError({
                description:
                    'Cannot retry document generation - translation has not completed. Use full retry instead.',
                message: 'Translation not complete.',
                status: 400,
                success: false,
                title: 'Cannot Retry Generation',
            });
            logger.error(['Cannot retry generate without translation:', errorResponse]);
            return errorResponse;
        }

        // 3. Clear checkpoints based on stage
        // Each stage clears its own output and all subsequent stages
        let cleanDetails: Record<string, unknown>;
        let newStatus: string;
        let newProgress: number;

        if (stage === 'translate') {
            // Clear translation output and everything after
            cleanDetails = {
                ...existingDetails,
                translated_document: null,
                generated_docx: null,
                user_edits: null, // Clear edits associated with the translation being retried.
                vision_metadata: null,
                qa_metadata: null,
                verification_metadata: null,
                ai_audit: null,
                error_message: null,
                failed_at_stage: null,
            };
            newStatus = 'translating';
            newProgress = 15; // Start of translation phase
        } else {
            // 'generate' - Only clear generation output, preserve translation
            cleanDetails = {
                ...existingDetails,
                generated_docx: null,
                error_message: null,
                failed_at_stage: null,
            };
            newStatus = 'generating';
            newProgress = 90; // Start of generation phase
        }

        // 4. Update translation record
        const { error: updateError } = await supabase
            .from('translations')
            .update({
                status: newStatus,
                progress: newProgress,
                completed_at: null,
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

        // 5. Trigger the appropriate task
        if (stage === 'translate') {
            await visionTranslateDocumentTask.trigger({
                translationId,
                userId: user.id,
            });
            logger.info([
                'Translation retry triggered from translate stage:',
                { translationId, userId: user.id },
            ]);
        } else {
            await generateDocumentTask.trigger({
                translationId,
                userId: user.id,
            });
            logger.info([
                'Translation retry triggered from generate stage:',
                { translationId, userId: user.id },
            ]);
        }

        // Revalidate pages
        revalidatePath('/app/translations');
        revalidatePath(`/app/translations/${translationId}`);

        const stageLabel = stage === 'translate' ? 'translation' : 'document generation';
        const estimatedTime = stage === 'translate' ? '~50 seconds' : '~10 seconds';

        return {
            description: `Retrying ${stageLabel}. Estimated time: ${estimatedTime}`,
            message: `Retry started from ${stage} stage.`,
            status: 200,
            success: true,
            title: 'Retry Started',
            data: {
                stage,
                preservedTranslation: stage === 'generate',
            },
        };
    } catch (error) {
        const errorResponse: ApiErrorType = isApiError(error)
            ? (error as ApiErrorType)
            : standardizeError(error);
        logger.error(['Error retrying from stage:', errorResponse]);
        return errorResponse;
    }
}
