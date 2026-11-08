/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { NextResponse } from 'next/server';
import { validateUser } from '@/helpers/validate-user';
import { isApiError, standardizeError } from '@errors/api-errors';
import { getLogger } from '@services/logger';
import { createServerClient } from '@utils/supabase/server';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';

export type SaveDraftResponse = ApiResponseOrError<{ saved: boolean; timestamp: string }> | ApiErrorType;

export async function POST(
    request: Request,
    props: { params: Promise<{ id: string }> },
): Promise<NextResponse<SaveDraftResponse>> {
    const params = await props.params;
    const logger = getLogger('API:TRANSLATIONS:SAVE-DRAFT');

    try {
        const { user } = await validateUser();
        const translationId = params.id;

        if (!translationId) {
            const errorResponse = standardizeError({
                code: 'MISSING_TRANSLATION_ID',
                description: 'A translation ID is required.',
                error: true,
                message: 'Translation ID is required.',
                status: 400,
                title: 'Missing Translation ID',
            });
            return NextResponse.json(errorResponse, { status: 400 });
        }

        // Parse JSON body (sendBeacon sends as Blob with application/json)
        const body = await request.json();
        const { content } = body;

        if (!content) {
            const errorResponse = standardizeError({
                code: 'MISSING_CONTENT',
                description: 'Content is required to save draft.',
                error: true,
                message: 'Content is required.',
                status: 400,
                title: 'Missing Content',
            });
            return NextResponse.json(errorResponse, { status: 400 });
        }

        const supabase = await createServerClient();

        // Fetch current details and merge
        const { data: translation, error: fetchError } = await supabase
            .from('translations')
            .select('details')
            .eq('id', translationId)
            .eq('profile_id', user.id)
            .single();

        if (fetchError || !translation) {
            const errorResponse = standardizeError({
                code: 'TRANSLATION_NOT_FOUND',
                description: 'Translation not found or access denied.',
                error: true,
                message: 'Translation not found.',
                status: 404,
                title: 'Not Found',
            });
            return NextResponse.json(errorResponse, { status: 404 });
        }

        // Merge user_edits into details
        const timestamp = new Date().toISOString();
        const updatedDetails = {
            ...(translation.details || {}),
            user_edits: content,
            last_edited_at: timestamp,
        };

        const { error: updateError } = await supabase
            .from('translations')
            .update({
                details: updatedDetails,
                updated_at: timestamp,
            })
            .eq('id', translationId)
            .eq('profile_id', user.id);

        if (updateError) {
            throw updateError;
        }

        logger.info(['Draft saved via beacon:', { translationId, userId: user.id }]);

        return NextResponse.json(
            {
                code: 'DRAFT_SAVED',
                data: { saved: true, timestamp },
                description: 'Draft saved successfully.',
                error: false,
                message: 'Draft saved.',
                status: 200,
                title: 'Success',
            },
            { status: 200 },
        );
    } catch (error) {
        logger.error(['Error saving draft:', error]);
        const errorResponse = isApiError(error) ? error : standardizeError(error);
        return NextResponse.json(errorResponse, { status: errorResponse.status });
    }
}
