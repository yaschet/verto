/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { revalidatePath } from 'next/cache';
import { validateUser } from '@/helpers/validate-user';
import { isApiError, standardizeError } from '@errors/api-errors';
import { getLogger } from '@services/logger';
import { exportGoogleDocToFormat, getContentTypeForFormat } from '@utils/gcp/drive/export-from-drive';
import { createServerClient } from '@utils/supabase/server';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';
import type { UploadedDocumentUrls } from '@utils/gcp/docx/functions/generate-google-doc-and-exports';

const logger = getLogger('ACTIONS:SERVICES:TRANSLATIONS:RETRY_FORMAT_EXPORT');

/**
 * Supported formats for retry
 */
export type RetryableFormat = 'pdf' | 'html' | 'md' | 'epub' | 'odt' | 'rtf' | 'txt';

/**
 * Signed URL expiration time (7 days in seconds)
 */
const SIGNED_URL_EXPIRATION = 60 * 60 * 24 * 7;

/**
 * Retry exporting a specific format (PDF or HTML) from an existing Google Doc
 *
 * This is a lightweight operation that:
 * 1. Uses the existing Google Doc (already uploaded during generation)
 * 2. Calls Google Drive files.export API
 * 3. Uploads the result to Supabase Storage
 * 4. Updates the translation record with the new URL
 *
 * Time: ~2-5 seconds (vs ~60 seconds for full regeneration)
 *
 * @param translationId - The translation to retry export for
 * @param format - The format to export ('pdf' or 'html')
 */
export async function retryFormatExport({
    translationId,
    format,
}: {
    translationId: string;
    format: RetryableFormat;
}): Promise<ApiResponseOrError> {
    try {
        const { user } = await validateUser();

        if (!translationId) {
            return standardizeError({
                title: 'Missing Translation ID',
                message: 'Translation ID is required.',
                description: 'Please provide a valid translation ID.',
                status: 400,
                success: false,
            });
        }

        if (!format || !['pdf', 'html', 'md', 'epub', 'odt', 'rtf', 'txt'].includes(format)) {
            return standardizeError({
                title: 'Invalid Format',
                message: `Format "${format}" is not supported for individual export.`,
                description: 'Supported formats are PDF, HTML, Markdown, EPUB, ODT, RTF, and TXT.',
                status: 400,
                success: false,
            });
        }

        const supabase = await createServerClient();

        // 1. Fetch translation and verify ownership
        const { data: translation, error: fetchError } = await supabase
            .from('translations')
            .select('id, profile_id, details')
            .eq('id', translationId)
            .eq('profile_id', user.id)
            .single();

        if (fetchError || !translation) {
            return standardizeError({
                title: 'Translation Not Found',
                message: 'Translation not found or access denied.',
                description: 'The translation was not found or you do not have permission to modify it.',
                status: 404,
                success: false,
            });
        }

        // 2. Get the Google Drive file ID from existing generation
        const details = translation.details as { generated_docx?: UploadedDocumentUrls } | null;
        const generatedDocx = details?.generated_docx;
        const googleDriveFileId = generatedDocx?.googleDriveFileId;

        if (!googleDriveFileId) {
            return standardizeError({
                title: 'Google Doc Not Found',
                message: 'No Google Doc available for export.',
                description:
                    'The document must be generated first before exporting formats. Try regenerating the document.',
                status: 400,
                success: false,
            });
        }

        logger.info(['Retrying format export', { translationId, format, googleDriveFileId }]);

        // 3. Export from Google Drive
        const buffer = await exportGoogleDocToFormat(googleDriveFileId, format);

        if (!buffer || buffer.length === 0) {
            return standardizeError({
                title: 'Export Failed',
                message: `Failed to export ${format.toUpperCase()} from Google Docs.`,
                description: 'The Google Drive API returned an empty response. Please try again.',
                status: 500,
                success: false,
            });
        }

        // 4. Upload to Supabase Storage
        const documentName = generatedDocx?.storagePath?.split('/').pop()?.replace('.docx', '') || 'document';
        const timestamp = Date.now();
        const extension = format === 'html' ? '.html.zip' : `.${format}`;
        const storagePath = `exports/${translationId}/${documentName}-${timestamp}${extension}`;

        const { error: uploadError } = await supabase.storage.from('exports').upload(storagePath, buffer, {
            contentType: getContentTypeForFormat(format),
            upsert: true,
        });

        if (uploadError) {
            logger.error(['Failed to upload format to storage', { format, error: uploadError }]);
            return standardizeError({
                title: 'Upload Failed',
                message: `Failed to upload ${format.toUpperCase()} to storage.`,
                description: uploadError.message,
                status: 500,
                success: false,
            });
        }

        // 5. Generate signed URL
        const { data: signedUrlData, error: signError } = await supabase.storage
            .from('exports')
            .createSignedUrl(storagePath, SIGNED_URL_EXPIRATION);

        if (signError || !signedUrlData?.signedUrl) {
            return standardizeError({
                title: 'URL Generation Failed',
                message: 'Failed to create download URL.',
                description: signError?.message || 'Unknown error creating signed URL.',
                status: 500,
                success: false,
            });
        }

        // 6. Update translation record with new URL
        const updatedDocx: UploadedDocumentUrls = {
            ...generatedDocx,
            [`${format === 'md' ? 'markdown' : format}DownloadUrl`]: signedUrlData.signedUrl,
            [`${format === 'md' ? 'markdown' : format}FileSizeBytes`]: buffer.length,
            [`${format === 'md' ? 'markdown' : format}ExportResult`]: { success: true },
        };

        const { error: updateError } = await supabase
            .from('translations')
            .update({
                details: {
                    ...details,
                    generated_docx: updatedDocx,
                },
            })
            .eq('id', translationId);

        if (updateError) {
            logger.error(['Failed to update translation record', { error: updateError }]);
            return standardizeError({
                title: 'Update Failed',
                message: 'Failed to save the exported file URL.',
                description: updateError.message,
                status: 500,
                success: false,
            });
        }

        // Revalidate the page
        revalidatePath(`/app/translations/${translationId}`);

        logger.info([
            'Format export retry successful',
            {
                translationId,
                format,
                fileSize: buffer.length,
            },
        ]);

        return {
            success: true,
            status: 200,
            title: 'Export Successful',
            message: `${format.toUpperCase()} is now available.`,
            description: `The ${format.toUpperCase()} file has been generated and is ready for download.`,
            data: {
                format,
                downloadUrl: signedUrlData.signedUrl,
                fileSizeBytes: buffer.length,
            },
        };
    } catch (error) {
        const errorResponse: ApiErrorType = isApiError(error)
            ? (error as ApiErrorType)
            : standardizeError(error);
        logger.error(['Error retrying format export', errorResponse]);
        return errorResponse;
    }
}
