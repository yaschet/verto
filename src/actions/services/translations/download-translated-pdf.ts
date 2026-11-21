/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { getServerUserId } from '@/helpers/user';
import { env } from '@/env';
import { createServerClient } from '@utils/supabase/server';
import type { ApiResponseOrError } from '@/types/rest/response';

export async function downloadTranslatedPdf({
    translationId,
}: {
    translationId: string;
}): Promise<ApiResponseOrError<{ downloadUrl: string }>> {
    try {
        const userId = await getServerUserId();
        if (!userId) {
            return {
                success: false,
                message: 'Unauthorized',
                data: undefined,
            };
        }

        const supabase = await createServerClient();

        // Get translation to verify ownership and status
        const { data: translation, error: translationError } = await supabase
            .from('translations')
            .select('*, profiles!inner(id)')
            .eq('id', translationId)
            .eq('profiles.id', userId)
            .single();

        if (translationError || !translation) {
            return {
                success: false,
                message: 'Translation not found',
                data: undefined,
            };
        }

        // Check if translation is approved or completed
        if (translation.status !== 'approved' && translation.status !== 'completed') {
            return {
                success: false,
                message: 'Translation must be approved before downloading',
                data: undefined,
            };
        }

        // Get the generated document URL from translation details
        const generatedDocUrl = translation.details?.generated_docx?.file_url;

        if (!generatedDocUrl) {
            return {
                success: false,
                message: 'Generated document not found. Please regenerate the document.',
                data: undefined,
            };
        }

        // Generate a signed URL for download
        const urlParts = generatedDocUrl.split('/');
        const _fileName = urlParts[urlParts.length - 1];
        const filePath = urlParts.slice(3).join('/'); // Remove domain parts

        const { data: signedUrl, error: signError } = await supabase.storage
            .from(env.NEXT_PUBLIC_FILE_UPLOAD_BUCKET)
            .createSignedUrl(filePath, 60); // 60 seconds expiry

        if (signError || !signedUrl) {
            console.error('Error generating signed URL:', signError);
            return {
                success: false,
                message: 'Failed to generate download link',
                data: undefined,
            };
        }

        return {
            success: true,
            message: 'Download link generated',
            data: {
                downloadUrl: signedUrl.signedUrl,
            },
        };
    } catch (error) {
        console.error('Download error:', error);
        return {
            success: false,
            message: error instanceof Error ? (error as Error).message : 'Failed to download document',
            data: undefined,
        };
    }
}
