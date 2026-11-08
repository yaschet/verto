/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { validateUser } from '@/helpers/validate-user';
import { isApiError, standardizeError } from '@/src/errors/api-errors';
import { createServerClient } from '@/src/utils/supabase/server';
import { calculateCreditsRequired } from '@constants/credits';
import { CreateTranslationSchema } from '@schemas/translation-schemas';
import { getLogger } from '@services/logger';
import { deductCreditsForTranslation } from '@utils/supabase/credits';
import { translationTask } from '@/trigger/tasks/translation-task';
import { getPdfPageCount } from '@/trigger/utilities/storage';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';
import type { OriginalTranslationRow } from '@schemas/translation-schemas';
import type { RunHandle } from '@trigger.dev/sdk';
import type { TranslationTaskPayload } from '@/trigger/tasks/translation-task';
import type { z } from 'zod';

/**
 * @async
 * @returns {Promise<ApiResponseOrError>}
 * @summary Creates a Translation in the Database.
 */
export async function createTranslation({
    translationData,
}: {
    translationData: z.infer<typeof CreateTranslationSchema>;
}): Promise<
    ApiResponseOrError<{
        translation: OriginalTranslationRow;
        baseTranslationTask: RunHandle<'translation-task', TranslationTaskPayload, { message: string }>;
    }>
> {
    const logger = getLogger('ACTIONS:SERVICES:TRANSLATIONS:CREATE_TRANSLATION');

    try {
        const { user } = await validateUser();

        const parsedTranslationData = CreateTranslationSchema.parse(translationData);

        if (!parsedTranslationData) {
            const errorResponse = standardizeError({
                description: 'The translation data is missing.',
                message: 'Translation data is missing.',
                status: 400,
                success: false,
                title: 'Missing Translation Data',
            });
            logger.error(['Error creating the translation:', errorResponse]);
            return errorResponse;
        }

        const supabase = await createServerClient();

        let templateID: string;

        if (parsedTranslationData.templateId) {
            templateID = parsedTranslationData.templateId;
        } else {
            const { data: omniTemplateData, error: omniTemplateError } = await supabase
                .from('templates')
                .select()
                .eq('slug', 'omni-document-recognition')
                .maybeSingle();

            if (omniTemplateError || !omniTemplateData) {
                const errorResponse = standardizeError({
                    description: 'The Omni Template data is missing.',
                    message: 'Omni Template data is missing.',
                    status: 400,
                    success: false,
                    title: 'Missing Omni Template Data',
                });
                logger.error(['Error creating the translation:', errorResponse]);
                return errorResponse;
            }

            templateID = omniTemplateData.id;
        }

        const { data: createdTranslation, error: createTranslationError } = await supabase
            .from('translations')
            .insert({
                profile_id: user?.id ?? '',
                customer_id: parsedTranslationData.customerId ?? null,
                template_id: templateID,
                display_name: parsedTranslationData.displayName ?? 'Pending AI Generated Name',
                description: parsedTranslationData.description ?? 'Pending AI Generated Description',
                source_language: parsedTranslationData.sourceLanguage ?? 'en',
                target_language: parsedTranslationData.targetLanguage ?? 'es',
                created_at: new Date().toISOString(),
                completed_at: null,
                file_url: parsedTranslationData.scannedDocumentFile ?? '',
                status: 'queued',
            })
            .select()
            .single();

        if (createTranslationError) {
            const errorResponse = standardizeError(createTranslationError);
            logger.error(['Error creating the translation in the database: ', errorResponse]);
            return errorResponse;
        }

        // === CREDIT DEDUCTION LOGIC ===
        // Extract page count from the uploaded document
        let pageCount: number;
        try {
            pageCount = await getPdfPageCount(supabase, createdTranslation.file_url);
            logger.info(['PDF page count extracted:', { pageCount, translationId: createdTranslation.id }]);

            // Update the translation record with the extracted page count immediately
            // This ensures the UI shows the correct page count while the background task is queued
            const { error: updateError } = await supabase
                .from('translations')
                .update({
                    details: {
                        page_count: pageCount,
                        // We can init other details here if needed, but for now just page_count.
                        // Since this is a new record, details is likely null, so this creates the object.
                    },
                })
                .eq('id', createdTranslation.id);

            if (updateError) {
                logger.warn(['Failed to update translation with page count:', updateError]);
                // Non-fatal, continue with credit deduction
            }
        } catch (pageCountError) {
            // If page count extraction fails, delete the translation and return error
            await supabase.from('translations').delete().eq('id', createdTranslation.id);

            const errorResponse = standardizeError({
                description: 'Failed to extract page count from document.',
                message: (pageCountError as Error).message || 'Could not determine document page count.',
                status: 500,
                success: false,
                title: 'Page Count Extraction Failed',
            });
            logger.error(['Error extracting page count:', errorResponse]);
            return errorResponse;
        }

        // Calculate credits required
        const creditsRequired = calculateCreditsRequired(pageCount);
        logger.info([
            'Credits calculated for translation:',
            { translationId: createdTranslation.id, pageCount, creditsRequired },
        ]);

        // Deduct credits atomically before triggering Trigger.dev task
        const deductionResult = await deductCreditsForTranslation(supabase, {
            userId: user.id,
            translationId: createdTranslation.id,
            pageCount,
            documentName: createdTranslation.display_name || 'Unknown Document',
        });

        // Handle credit deduction failure
        if (!deductionResult.success) {
            // Rollback: Delete the translation record
            await supabase.from('translations').delete().eq('id', createdTranslation.id);

            // Check if it's an insufficient credits error
            if (deductionResult.error_code === 'INSUFFICIENT_CREDITS') {
                const errorResponse = standardizeError({
                    description: `You need ${deductionResult.required} credits but only have ${deductionResult.available}. Please purchase more credits to continue.`,
                    message: deductionResult.error || 'Insufficient credits for translation.',
                    status: 402, // 402 Payment Required
                    success: false,
                    title: 'Insufficient Credits',
                });
                logger.error(['Insufficient credits for translation:', errorResponse]);
                return errorResponse;
            }

            // Other credit deduction errors
            const errorResponse = standardizeError({
                description: deductionResult.error || 'Failed to deduct credits for translation.',
                message: 'Credit deduction failed.',
                status: 500,
                success: false,
                title: 'Credit Deduction Failed',
            });
            logger.error(['Error deducting credits:', errorResponse]);
            return errorResponse;
        }

        logger.info([
            'Credits successfully deducted:',
            {
                translationId: createdTranslation.id,
                creditsDeducted: deductionResult.credits_deducted,
                previousBalance: deductionResult.previous_balance,
                newBalance: deductionResult.new_balance,
            },
        ]);
        // === END CREDIT DEDUCTION LOGIC ===

        // === SAVE USER LANGUAGE PREFERENCES ===
        // Update the user's profile with their selected language preferences
        // This allows the form to remember their choices for next time
        try {
            const { error: profileUpdateError } = await supabase
                .from('profiles')
                .update({
                    source_language: parsedTranslationData.sourceLanguage,
                    target_language: parsedTranslationData.targetLanguage,
                })
                .eq('id', user.id);

            if (profileUpdateError) {
                // Log but don't fail - preference saving is non-critical
                logger.warn(['Failed to save language preferences:', profileUpdateError.message]);
            } else {
                logger.info([
                    'User language preferences saved:',
                    {
                        userId: user.id,
                        sourceLanguage: parsedTranslationData.sourceLanguage,
                        targetLanguage: parsedTranslationData.targetLanguage,
                    },
                ]);
            }
        } catch (prefError) {
            // Log but don't fail - preference saving is non-critical
            logger.warn(['Failed to save language preferences:', (prefError as Error).message]);
        }
        // === END SAVE USER LANGUAGE PREFERENCES ===

        // Trigger the Base Translation Task:
        try {
            const handleBaseTranslationTask = await translationTask.trigger(
                {
                    translationId: createdTranslation?.id,
                    userId: user?.id,
                },
                {
                    idempotencyKey: createdTranslation?.id,
                    concurrencyKey: createdTranslation?.id,
                    tags: [
                        `translation`,
                        createdTranslation?.display_name,
                        `user:${user?.id}`,
                        `translation:${createdTranslation?.id}`,
                    ],
                },
            );

            logger.info(['Base Translation Task triggered successfully:', handleBaseTranslationTask]);

            return {
                description: 'The translation has been successfully created.',
                message: 'Translation created successfully.',
                status: 201,
                success: true,
                title: 'Translation Created',
                data: {
                    translation: createdTranslation,
                    baseTranslationTask: handleBaseTranslationTask,
                },
            };
        } catch (error) {
            // - Delete the Translation from the Database.
            const { error: deleteTranslationError } = await supabase
                .from('translations')
                .delete()
                .eq('id', createdTranslation?.id)
                .single();

            if (deleteTranslationError) {
                const errorResponse = standardizeError(deleteTranslationError);
                logger.error(['Error deleting the translation from the database:', errorResponse]);
                return errorResponse;
            }

            const errorResponse: ApiErrorType = isApiError(error)
                ? (error as ApiErrorType)
                : standardizeError(error);
            logger.error(['Error triggering the Base Translation Task:', errorResponse]);
            return errorResponse;
        }
    } catch (error) {
        const errorResponse: ApiErrorType = isApiError(error)
            ? (error as ApiErrorType)
            : standardizeError(error);
        logger.error(['Error creating the translation:', errorResponse]);
        return errorResponse;
    }
}
