/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { validateUser } from '@/helpers/validate-user';
import { standardizeError } from '@errors/api-errors';
import { getLogger } from '@services/logger';
import { createAdminClient } from '@utils/supabase/server';
import { EXPORT_EXTENSIONS, type DriveExportFormat } from '@utils/gcp/drive/export-from-drive';
import type { SignedUrlResponse } from './get-signed-url';

const logger = getLogger('API:STORAGE:GET_GENERATED_DOCUMENT_URL');

export async function getGeneratedDocumentUrl({
    translationId,
    format,
    fileId,
}: {
    translationId: string;
    format: DriveExportFormat;
    fileId: string;
}): Promise<SignedUrlResponse> {
    try {
        // Step 1: Validate user authentication
        const { user } = await validateUser();

        // Step 2: Create Supabase Admin Client (Admin bypasses RLS - required for exports bucket)
        const supabase = await createAdminClient();

        // Step 3: Verify ownership of the translation
        // We check if a translation exists with this ID and belongs to the user
        const { data: translation, error: translationError } = await supabase
            .from('translations')
            .select('id')
            .eq('id', translationId)
            .eq('profile_id', user.id)
            .single();

        if (translationError || !translation) {
            logger.error(
                `Unauthorized access attempt or translation not found: ${translationId} for user ${user.id}`,
            );
            return standardizeError({
                code: 'NOT_FOUND',
                title: 'Translation Not Found',
                status: 404,
                description: 'The translation could not be found or you do not have permission to access it.',
            });
        }

        // Step 4: Construct the storage path INSIDE the 'exports' bucket
        // Pattern: exports/[translationId]/[fileId][extension]
        // Note: Files are uploaded with 'exports/' prefix inside the bucket (historical design)
        const extension = EXPORT_EXTENSIONS[format];
        if (!extension) {
            return standardizeError({
                code: 'INVALID_FORMAT',
                title: 'Invalid Format',
                status: 400,
                description: `The requested file format '${format}' is not supported.`,
            });
        }

        const storagePath = `exports/${translationId}/${fileId}${extension}`;
        console.log(
            `[DOWNLOAD] Request params: translationId=${translationId}, fileId=${fileId}, format=${format}`,
        );
        console.log(`[DOWNLOAD] Full storage path: ${storagePath}`);

        // Step 5: Generate Signed URL (valid for 60 seconds)
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from('exports')
            .createSignedUrl(storagePath, 60, {
                download: true, // Force download
            });

        if (signedUrlError || !signedUrlData) {
            // User-friendly error for "not found" case
            if (signedUrlError?.message?.includes('not found')) {
                logger.error(`File not found: ${storagePath}`, signedUrlError);
                return standardizeError({
                    code: 'FILE_NOT_FOUND',
                    title: 'File Not Found',
                    status: 404,
                    description: 'This export format is not yet generated. Try regenerating the document.',
                });
            }

            logger.error(`Failed to generate signed URL for path: ${storagePath}`, {
                error: signedUrlError,
                errorMessage: signedUrlError?.message,
            });
            return standardizeError({
                code: 'STORAGE_ERROR',
                title: 'Download Failed',
                status: 500,
                description: 'Could not generate a download link. Please try again.',
            });
        }

        return {
            code: 'SUCCESS',
            status: 200,
            title: 'URL Generated',
            message: 'Download URL generated successfully',
            data: {
                signedUrl: signedUrlData.signedUrl,
            },
        };
    } catch (error) {
        logger.error('Unexpected error in getGeneratedDocumentUrl', error);
        return standardizeError(error);
    }
}
