/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { validateUser } from '@/helpers/validate-user';
import { standardizeError } from '@/src/errors/api-errors';
import { createServerClient } from '@/src/utils/supabase/server';
import { getLogger } from '@services/logger';
import type { ApiResponseOrError } from '@/types/rest/response';
import type { JSONContent } from '@tiptap/react';

/**
 * Save a draft of the translation review (auto-save)
 * @async
 * @param {Object} params - The save draft parameters
 * @param {string} params.translationId - The ID of the translation to save
 * @param {JSONContent} params.content - The ProseMirror JSON content
 * @returns {Promise<ApiResponseOrError<{ saved: boolean; timestamp: string }>>} - Success status or an error
 */
export async function saveReviewDraft({
    content,
    translationId,
}: {
    translationId: string;
    content: JSONContent;
}): Promise<ApiResponseOrError<{ saved: boolean; timestamp: string }>> {
    const logger = getLogger('ACTIONS:SERVICES:TRANSLATIONS:SAVE_REVIEW_DRAFT');

    try {
        const { user } = await validateUser();

        if (!translationId || !content) {
            const errorResponse = standardizeError({
                description: 'Translation ID and content are required.',
                message: 'Missing required fields.',
                status: 400,
                success: false,
                title: 'Invalid Request',
            });
            logger.error(['Missing required fields:', errorResponse]);
            return errorResponse;
        }

        const supabase = await createServerClient();

        // First, check if the translation belongs to the user and is in reviewing status
        const { data: translation, error: fetchError } = await supabase
            .from('translations')
            .select('id, profile_id, status, details')
            .eq('id', translationId)
            .eq('profile_id', user.id)
            .single();

        if (fetchError || !translation) {
            const errorResponse = standardizeError({
                description: 'Translation not found or you do not have permission to edit it.',
                message: 'Translation not found.',
                status: 404,
                success: false,
                title: 'Not Found',
            });
            logger.error(['Translation not found:', errorResponse]);
            return errorResponse;
        }

        // Check if translation is in an editable state
        const editableStatuses = ['ready', 'generating', 'completed'];
        if (!editableStatuses.includes(translation.status)) {
            const errorResponse = standardizeError({
                description: `Translation cannot be edited in ${translation.status} status.`,
                message: 'Translation is not editable.',
                status: 403,
                success: false,
                title: 'Not Editable',
            });
            logger.error(['Translation not editable:', errorResponse]);
            return errorResponse;
        }

        // Merge the new user_edits into the existing details
        const existingDetails = translation.details || {};
        const updatedDetails = {
            ...existingDetails,
            user_edits: content,
            last_edited_at: new Date().toISOString(),
        };

        // Update the translation with the new draft content
        const { error: updateError } = await supabase
            .from('translations')
            .update({
                details: updatedDetails,
                updated_at: new Date().toISOString(),
            })
            .eq('id', translationId)
            .eq('profile_id', user.id);

        if (updateError) {
            const errorResponse = standardizeError(updateError);
            logger.error(['Error saving draft:', errorResponse]);
            return errorResponse;
        }

        const timestamp = new Date().toISOString();

        logger.info([
            'Draft saved successfully:',
            {
                translationId,
                userId: user.id,
                timestamp,
                contentSize: JSON.stringify(content).length,
            },
        ]);

        return {
            description: 'Draft saved successfully.',
            message: 'Draft saved.',
            status: 200,
            success: true,
            title: 'Success',
            data: {
                saved: true,
                timestamp,
            },
        };
    } catch (error) {
        const errorResponse = standardizeError(error);
        logger.error(['Error saving review draft:', errorResponse]);
        return errorResponse;
    }
}
