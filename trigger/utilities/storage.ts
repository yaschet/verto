/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { logger } from '@trigger.dev/sdk';
import mime from 'mime-types';
import { PDFDocument } from 'pdf-lib';
import { env } from '@/env';
import { ApiError } from '@errors/api-errors';
import { logError, timedOperation } from '@/trigger/logging';
import type { ExtendedDatabase } from '@/types/database/database.extended';
import type { OriginalTranslationRow } from '@schemas/translation-schemas';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Converts an image Buffer to a PDF Buffer using pdf-lib.
 * Supports JPEG and PNG images without optimization.
 * @param imageBuffer The image Buffer to convert.
 * @param mimeType The MIME type of the image (e.g., 'image/jpeg', 'image/png').
 * @returns A Buffer containing the PDF data.
 * @throws ApiError if the image format is unsupported or conversion fails.
 */
export async function convertImageToPDF(imageBuffer: Buffer, mimeType: string): Promise<Buffer> {
    return timedOperation('convert-image-to-pdf', async (span) => {
        span.setAttribute('mimeType', mimeType);
        span.setAttribute('bufferLength', imageBuffer.length);

        try {
            // Initialize a new PDFDocument
            const pdfDoc = await PDFDocument.create();

            let embeddedImage;
            let imageDims;

            if (mimeType === 'image/jpeg') {
                embeddedImage = await pdfDoc.embedJpg(imageBuffer);
                imageDims = embeddedImage.scale(1);
            } else if (mimeType === 'image/png') {
                embeddedImage = await pdfDoc.embedPng(imageBuffer);
                imageDims = embeddedImage.scale(1);
            } else {
                throw new ApiError('Unsupported image format for PDF conversion.', {
                    error: true,
                    description: `Unsupported image MIME type: ${mimeType}`,
                    status: 400,
                    title: 'Unsupported Image Format',
                    code: 'UNSUPPORTED_IMAGE_FORMAT',
                });
            }

            // Create a page with dimensions matching the image
            const page = pdfDoc.addPage([imageDims.width, imageDims.height]);

            // Draw the image onto the page
            page.drawImage(embeddedImage, {
                x: 0,
                y: 0,
                width: imageDims.width,
                height: imageDims.height,
            });

            // Serialize the PDFDocument to bytes (a Uint8Array)
            const pdfBytes = await pdfDoc.save();

            span.setAttribute('pdfBytesLength', pdfBytes.length);

            // Only log debug level for this high-frequency internal op
            logger.debug('Image converted to PDF', {
                originalSize: imageBuffer.length,
                pdfSize: pdfBytes.length,
            });

            return Buffer.from(pdfBytes);
        } catch (error) {
            logError('Error converting image to PDF', error, {
                mimeType,
                bufferLength: imageBuffer.length,
            });

            throw new ApiError('Failed to convert image to PDF.', {
                error: true,
                description: (error as Error).message || 'An unknown error occurred during PDF conversion.',
                status: 500,
                title: 'PDF Conversion Failed',
                code: 'PDF_CONVERSION_FAILED',
            });
        }
    });
}

/**
 * Downloads a file from Supabase Storage.
 * @param supabaseClient
 * @param filePath
 * @returns The downloaded file as a Blob.
 * @throws ApiError
 * @categories Utilities, Supabase Storage.
 */
export async function downloadFileFromStorage(
    supabaseClient: SupabaseClient<ExtendedDatabase>,
    filePath: OriginalTranslationRow['file_url'],
): Promise<Blob> {
    return timedOperation('download-file-storage', async (span) => {
        span.setAttribute('filePath', filePath);

        const { data: fileBlob, error: downloadError } = await supabaseClient.storage
            .from(env.NEXT_PUBLIC_FILE_UPLOAD_BUCKET)
            .download(filePath);

        if (downloadError || !fileBlob) {
            throw new ApiError('Failed to download the file from Supabase Storage.', {
                error: true,
                description: downloadError?.message ?? 'Failed to download the file from Supabase Storage.',
                status: 500,
                title: 'Failed to Download File',
                code: 'FAILED_TO_DOWNLOAD_FILE',
            });
        }

        span.setAttribute('size', fileBlob.size);
        return fileBlob;
    });
}

/**
 * Retrieves a signed URL for a file from Supabase Storage.
 * @param supabaseClient
 * @param filePath
 * @returns The signed URL for the file.
 * @throws ApiError
 * @categories Utilities, Supabase Storage.
 */
export async function getSignedUrlForFile(
    supabaseClient: SupabaseClient<ExtendedDatabase>,
    filePath: OriginalTranslationRow['file_url'],
): Promise<string> {
    // Fast operation (<200ms usually), no wrapper needed unless debugging
    // Reducing noise by removing debug log unless error
    const { data: signedUrlData, error: signedUrlError } = await supabaseClient.storage
        .from(env.NEXT_PUBLIC_FILE_UPLOAD_BUCKET)
        .createSignedUrl(filePath, 60);

    if (signedUrlError || !signedUrlData?.signedUrl) {
        throw new ApiError('Failed to get a signed URL for the file.', {
            error: true,
            description: signedUrlError?.message ?? 'Failed to get a signed URL for the file.',
            status: 500,
            title: 'Failed to Get Signed URL',
            code: 'FAILED_TO_GET_SIGNED_URL',
        });
    }

    return signedUrlData.signedUrl;
}

/**
 * Extracts the page count from a PDF file.
 * For images, returns 1 as they will be converted to single-page PDFs.
 * @param supabaseClient The Supabase client instance.
 * @param filePath The path of the file in Supabase Storage.
 * @returns The number of pages in the PDF document.
 * @throws ApiError if the file cannot be downloaded or parsed.
 */
export async function getPdfPageCount(
    supabaseClient: SupabaseClient<ExtendedDatabase>,
    filePath: OriginalTranslationRow['file_url'],
): Promise<number> {
    return timedOperation('get-pdf-page-count', async (span) => {
        span.setAttribute('filePath', filePath);

        try {
            const fileName = filePath.split('/').pop() ?? '';
            const mimeType = mime.lookup(fileName) || 'application/octet-stream';
            const isImage = mimeType.startsWith('image/');

            // Images are always 1 page (they'll be converted to single-page PDF)
            if (isImage) {
                span.setAttribute('isImage', true);
                return 1;
            }

            // Download the PDF from Supabase Storage
            const fileBlob = await downloadFileFromStorage(supabaseClient, filePath);
            const arrayBuffer = await fileBlob.arrayBuffer();

            // Load the PDF document
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const pageCount = pdfDoc.getPageCount();

            span.setAttribute('pageCount', pageCount);
            return pageCount;
        } catch (error) {
            logError('Error getting PDF page count', error, { filePath });

            throw new ApiError('Failed to extract PDF page count.', {
                error: true,
                description:
                    (error as Error).message || 'An unknown error occurred while extracting page count.',
                status: 500,
                title: 'PDF Page Count Extraction Failed',
                code: 'PDF_PAGE_COUNT_FAILED',
            });
        }
    });
}
