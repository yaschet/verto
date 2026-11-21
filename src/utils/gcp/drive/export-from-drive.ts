/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

// src/utils/gcp/drive/export-from-drive.ts

/**
 * Google Drive Export Utility
 *
 * Uses Google Drive API files.export to convert Google Docs to various formats.
 * This is the same mechanism as File > Download > PDF in Google Docs - instant, identical output.
 *
 * @see https://developers.google.com/workspace/drive/api/guides/manage-downloads#export-content
 */

import { google } from 'googleapis';
import { redactLogText, safeProviderError } from '@/services/log-safety';
import { getGoogleAuth } from '@utils/gcp/google-clients';

/**
 * Supported export formats from Google Docs
 */
export type DriveExportFormat = 'pdf' | 'html' | 'docx' | 'txt' | 'rtf' | 'md' | 'odt' | 'epub';

/**
 * MIME types for Google Drive export
 * @see https://developers.google.com/workspace/drive/api/guides/ref-export-formats
 */
const EXPORT_MIME_TYPES: Record<DriveExportFormat, string> = {
    pdf: 'application/pdf',
    html: 'application/zip', // Google exports HTML as a zip file
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    txt: 'text/plain',
    rtf: 'application/rtf',
    md: 'text/markdown',
    odt: 'application/vnd.oasis.opendocument.text',
    epub: 'application/epub+zip',
};

/**
 * File extensions for each format
 */
export const EXPORT_EXTENSIONS: Record<DriveExportFormat, string> = {
    pdf: '.pdf',
    html: '.html.zip', // HTML is exported as a zip
    docx: '.docx',
    txt: '.txt',
    rtf: '.rtf',
    md: '.md',
    odt: '.odt',
    epub: '.epub',
};

/**
 * Export a Google Doc to the specified format using Drive API files.export
 *
 * This is instant - no Puppeteer, no Chrome, no processing.
 * The output is identical to File > Download > [Format] in Google Docs.
 *
 * @param fileId - Google Drive file ID (from uploaded DOCX converted to Google Docs)
 * @param format - Target format (pdf, html, docx, txt, rtf, md)
 * @returns Buffer containing the exported file
 *
 * @example
 * ```ts
 * const pdfBuffer = await exportGoogleDocToFormat(fileId, 'pdf');
 * const htmlZipBuffer = await exportGoogleDocToFormat(fileId, 'html');
 * ```
 *
 * @throws Error if export fails (file not found, permission denied, etc.)
 */
export async function exportGoogleDocToFormat(fileId: string, format: DriveExportFormat): Promise<Buffer> {
    const mimeType = EXPORT_MIME_TYPES[format];

    // Initialize Drive client with service account auth
    const auth = getGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });

    const response = await drive.files.export(
        {
            fileId,
            mimeType,
        },
        {
            responseType: 'arraybuffer',
        },
    );

    return Buffer.from(response.data as ArrayBuffer);
}

/**
 * Export multiple formats in parallel
 *
 * @param fileId - Google Drive file ID
 * @param formats - Array of formats to export
 * @returns Map of format to Buffer
 *
 * @example
 * ```ts
 * const exports = await exportMultipleFormats(fileId, ['pdf', 'html']);
 * const pdfBuffer = exports.get('pdf');
 * const htmlBuffer = exports.get('html');
 * ```
 */
export async function exportMultipleFormats(
    fileId: string,
    formats: DriveExportFormat[],
): Promise<Map<DriveExportFormat, Buffer>> {
    const results = await Promise.all(
        formats.map(async (format) => {
            const buffer = await exportGoogleDocToFormat(fileId, format);
            return { format, buffer };
        }),
    );

    return new Map(results.map((r) => [r.format, r.buffer]));
}

/**
 * Get content type for a format (for upload to storage)
 */
export function getContentTypeForFormat(format: DriveExportFormat): string {
    return EXPORT_MIME_TYPES[format];
}

/**
 * Result of an export attempt with retry
 */
export type ExportWithRetryResult = {
    success: boolean;
    buffer: Buffer | null;
    error?: string;
    attempts: number;
};

/**
 * Export a Google Doc with retry logic and exponential backoff
 *
 * Retries transient errors (network, rate limits, server errors) up to maxRetries times.
 * Uses exponential backoff: 0ms, 1000ms, 2000ms between attempts.
 *
 * @param fileId - Google Drive file ID
 * @param format - Target format (pdf, html, etc.)
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns ExportWithRetryResult with success status, buffer, error message, and attempt count
 */
export async function exportGoogleDocToFormatWithRetry(
    fileId: string,
    format: DriveExportFormat,
    maxRetries: number = 3,
): Promise<ExportWithRetryResult> {
    let lastError: string | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const buffer = await exportGoogleDocToFormat(fileId, format);

            if (buffer && buffer.length > 0) {
                return {
                    success: true,
                    buffer,
                    attempts: attempt,
                };
            }

            lastError = 'Export returned empty buffer';
        } catch (error) {
            const errorMessage = error instanceof Error ? (error as Error).message : String(error);

            // Check if this is a retryable error
            const isRetryable =
                errorMessage.includes('UNAVAILABLE') ||
                errorMessage.includes('DEADLINE_EXCEEDED') ||
                errorMessage.includes('Internal Error') ||
                errorMessage.includes('429') ||
                errorMessage.includes('500') ||
                errorMessage.includes('502') ||
                errorMessage.includes('503') ||
                errorMessage.includes('504') ||
                errorMessage.includes('ECONNRESET') ||
                errorMessage.includes('ETIMEDOUT') ||
                errorMessage.includes('socket hang up');

            lastError = redactLogText(errorMessage);

            // If not retryable, fail immediately
            if (!isRetryable) {
                console.error(
                    `[${format.toUpperCase()}] Export failed (non-retryable):`,
                    safeProviderError(error),
                );
                return {
                    success: false,
                    buffer: null,
                    error: lastError,
                    attempts: attempt,
                };
            }

            // If we have more retries left, wait and try again
            if (attempt < maxRetries) {
                const delayMs = Math.pow(2, attempt - 1) * 1000; // 0ms, 1000ms, 2000ms
                console.warn(
                    `[${format.toUpperCase()}] Export failed (attempt ${attempt}/${maxRetries}), retrying in ${delayMs}ms:`,
                    safeProviderError(error),
                );
                await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
        }
    }

    // All retries exhausted
    console.error(`[${format.toUpperCase()}] Export failed after ${maxRetries} attempts:`, lastError);
    return {
        success: false,
        buffer: null,
        error: lastError,
        attempts: maxRetries,
    };
}
