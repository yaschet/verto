/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import type { drive_v3 } from 'googleapis';
import type { TranslationDetails } from '@/types/database/database.extended';
import { google } from 'googleapis';
import { Readable } from 'stream';
import { NormalisedDocument } from '@/engine/document/types';
import { getGoogleAuth } from '@utils/gcp/google-clients';
import { GoogleDocsMapper } from '../../google-docs/mapper';
import {
    transformColumnsToExtendedBranding,
    ExtendedResolvedBrandingSettings,
} from '@/types/document/branding-settings';

import { createAdminClient } from '@utils/supabase/server';
import {
    exportGoogleDocToFormatWithRetry,
    EXPORT_EXTENSIONS,
    getContentTypeForFormat,
} from '@utils/gcp/drive/export-from-drive';
import { env } from '@/env';
import { getLogger } from '@/services/logger';
import { safeProviderError } from '@/services/log-safety';
import { downloadBrandingImage } from './download-branding-image';

const logger = getLogger('generateGoogleDoc');

/**
 * Return type matching usage in generate-document.ts
 */
export interface UploadedDocumentUrls {
    id: string;
    downloadUrl: string; // DOCX Signed URL
    storagePath?: string; // DOCX Storage Path
    fileSizeBytes: number;
    googleDocsEditUrl?: string | null;
    googleDocsCopyUrl?: string;
    pdfDownloadUrl?: string; // PDF Signed URL
    pdfFileSizeBytes?: number;
    htmlDownloadUrl?: string;
    htmlFileSizeBytes?: number;
    markdownDownloadUrl?: string;
    markdownFileSizeBytes?: number;
    epubDownloadUrl?: string;
    epubFileSizeBytes?: number;
    odtDownloadUrl?: string;
    odtFileSizeBytes?: number;
    rtfDownloadUrl?: string;
    rtfFileSizeBytes?: number;
    txtDownloadUrl?: string;
    txtFileSizeBytes?: number;
    pdfExportResult?: { success: boolean; error?: string };
    htmlExportResult?: { success: boolean; error?: string };
    markdownExportResult?: { success: boolean; error?: string };
    epubExportResult?: { success: boolean; error?: string };
    odtExportResult?: { success: boolean; error?: string };
    rtfExportResult?: { success: boolean; error?: string };
    txtExportResult?: { success: boolean; error?: string };
    googleDriveFileId?: string;
    generated_at?: string; // ISO 8601 Timestamp
    source_last_edited_at?: string; // Timestamp of the user edits this doc was generated from
}

/**
 * Generates Google Doc natively via API, then exports to DOCX/PDF and uploads to Supabase.
 */
export async function generateGoogleDocAndExports(
    document: NormalisedDocument,
    user: { id: string; email?: string | null },
    translationId: string,
    fileName?: string,
    folderOptions?: {
        customerName?: string | null;
        customerId?: string | null;
    },
): Promise<UploadedDocumentUrls> {
    logger.info('[generateGoogleDoc] Starting native Google Doc generation...');

    // 1. Auth & Clients
    const auth = getGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });
    const docs = google.docs({ version: 'v1', auth });
    const supabase = await createAdminClient();

    try {
        // 1.1 Fetch Branding Settings
        let brandingSettings: ExtendedResolvedBrandingSettings | undefined;
        let headerId: string | undefined;
        let footerId: string | undefined;

        if (user?.id) {
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

            if (profile) {
                brandingSettings = transformColumnsToExtendedBranding(
                    profile,
                ) as unknown as ExtendedResolvedBrandingSettings;

                // HOSTING STRATEGY: Upload branding images to Google Drive to ensure they are accessible by Google Docs API.
                // Supabase Public/Signed URLs often fail due to user-agent blocking or latency.
                // Google Docs reads this image through a Drive link.
                brandingSettings = await ensureBrandingImagesAccessible(drive, brandingSettings, user.id);
            }
        }

        // 2. Folder Organization Logic
        // Structure: Verto / [User Email] / [Customer Name] (Optional)
        let parentFolderId: string | undefined;

        const findOrCreateFolder = async (name: string, parentId?: string): Promise<string> => {
            const query = [
                `mimeType = 'application/vnd.google-apps.folder'`,
                `name = '${name.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`,
                `trashed = false`,
                parentId ? `'${parentId}' in parents` : `'root' in parents`,
            ].join(' and ');

            const res = await drive.files.list({
                q: query,
                fields: 'files(id)',
                spaces: 'drive',
            });

            if (res.data.files && res.data.files.length > 0) {
                return res.data.files[0].id!;
            }

            const createRes = await drive.files.create({
                requestBody: {
                    name,
                    mimeType: 'application/vnd.google-apps.folder',
                    parents: parentId ? [parentId] : undefined,
                },
                fields: 'id',
            });
            return createRes.data.id!;
        };

        try {
            // 2.1 Ensure Root Folder "Verto"
            const rootFolderId = await findOrCreateFolder('Verto');

            // 2.2 Ensure User Folder
            // Use email if available for readability, fallback to ID
            const userFolderName = user?.email || user?.id || 'Unknown User';
            const userFolderId = await findOrCreateFolder(userFolderName, rootFolderId);
            parentFolderId = userFolderId;

            // 2.3 Ensure Customer Folder (if applicable)
            if (folderOptions?.customerName) {
                const customerFolderId = await findOrCreateFolder(folderOptions.customerName, userFolderId);
                parentFolderId = customerFolderId;
            }
        } catch (folderError) {
            logger.error(
                '[generateGoogleDoc] Folder organization failed, falling back to root:',
                safeProviderError(folderError),
            );
            // Fallback to root (undefined parent defaults to root in create call)
        }

        // 3. Create Empty Google Doc
        const createRes = await drive.files.create({
            requestBody: {
                name:
                    fileName ||
                    (document.documentType ? `Generated ${document.documentType}` : 'Generated Document'),
                mimeType: 'application/vnd.google-apps.document',
                parents: parentFolderId ? [parentFolderId] : undefined,
            },
            fields: 'id, webViewLink',
        });

        const fileId = createRes.data.id;
        if (!fileId) throw new Error('Failed to create Google Doc');

        logger.info(`[generateGoogleDoc] Created empty doc: ${fileId}`);

        // Link viewers can copy the document into their own Drive without changing the master.
        await drive.permissions.create({
            fileId: fileId,
            requestBody: {
                role: 'reader',
                type: 'anyone',
                allowFileDiscovery: false,
            },
        });
        logger.info('Set link-viewer permissions', { fileId });

        // 2.2 Create Header/Footer if Branding Enabled
        if (brandingSettings?.enabled) {
            logger.info('[generateGoogleDoc] Initializing Header/Footer...');
            const setupRes = await docs.documents.batchUpdate({
                documentId: fileId,
                requestBody: {
                    requests: [{ createHeader: { type: 'DEFAULT' } }, { createFooter: { type: 'DEFAULT' } }],
                },
            });

            const replies = setupRes.data.replies;
            if (replies) {
                headerId = replies[0]?.createHeader?.headerId || undefined;
                footerId = replies[1]?.createFooter?.footerId || undefined;
                logger.info(`[generateGoogleDoc] Header ID: ${headerId}, Footer ID: ${footerId}`);
            }
        }

        // 3. Map Content
        const mapper = new GoogleDocsMapper(document, brandingSettings, headerId, footerId);
        const { headerFooterRequests, bodyRequests } = await mapper.convert();

        // 3.1 Execute Header/Footer requests FIRST (separate batch to avoid API errors)
        if (headerFooterRequests.length > 0) {
            logger.info(
                `[generateGoogleDoc] Executing ${headerFooterRequests.length} header/footer requests...`,
            );
            await docs.documents.batchUpdate({
                documentId: fileId,
                requestBody: { requests: headerFooterRequests },
            });
            logger.info('[generateGoogleDoc] Header/footer batch update complete.');
        }

        // 3.2 Execute Body requests
        if (bodyRequests.length > 0) {
            logger.info(`[generateGoogleDoc] Executing ${bodyRequests.length} body requests...`);
            await docs.documents.batchUpdate({
                documentId: fileId,
                requestBody: { requests: bodyRequests },
            });
            logger.info('[generateGoogleDoc] Body batch update complete.');
        } else {
            logger.warn('[generateGoogleDoc] No body requests generated from document.');
        }

        // 3.3 DEBUG: Save API requests to database for debugging
        if (env.DEBUG_GOOGLE_DOCS_GENERATION) {
            logger.info('[generateGoogleDoc] DEBUG: Saving API requests to database...');
            const debugData = {
                headerFooterRequestCount: headerFooterRequests.length,
                bodyRequestCount: bodyRequests.length,
                documentDirection: document.direction,
                headerFooterRequests: headerFooterRequests,
                bodyRequests: bodyRequests,
                generatedAt: new Date().toISOString(),
            };

            const { data: currentData } = await supabase
                .from('translations')
                .select('details')
                .eq('id', translationId)
                .single();

            if (currentData?.details) {
                const updatedDetails = {
                    ...currentData.details,
                    generated_docx: {
                        ...(currentData.details as TranslationDetails).generated_docx,
                        debug_api_requests: debugData,
                    },
                };
                await supabase
                    .from('translations')
                    .update({ details: updatedDetails })
                    .eq('id', translationId);
                logger.info(
                    '[generateGoogleDoc] DEBUG: API requests saved to details.generated_docx.debug_api_requests',
                );
            }
        }

        // 4. Export & Upload (DOCX)
        logger.info('[generateGoogleDoc] Exporting to DOCX...');
        const docxExport = await drive.files.export(
            {
                fileId: fileId,
                mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            },
            { responseType: 'arraybuffer' },
        );

        const docxBuffer = Buffer.from(docxExport.data as unknown as ArrayBuffer);
        const docxPath = `exports/${translationId}/${fileId}.docx`;

        logger.info(
            `[generateGoogleDoc] Uploading DOCX to Supabase Storage (${docxBuffer.byteLength} bytes)...`,
        );
        const { error: docxUploadError } = await supabase.storage
            .from('exports')
            .upload(docxPath, docxBuffer, {
                contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                upsert: true,
            });

        if (docxUploadError) throw new Error(`Failed to upload DOCX: ${docxUploadError.message}`);

        const { data: docxUrlData } = await supabase.storage
            .from('exports')
            .createSignedUrl(docxPath, 60 * 60 * 24 * 7); // 7 days

        if (!docxUrlData?.signedUrl) throw new Error('Failed to generate DOCX signed URL');

        // 5. Secondary Exports (PDF, HTML, MD, EPUB, ODT, RTF, TXT)
        // We do these in series/parallel to avoid rate limits and provide resilient results
        const secondaryFormats = ['pdf', 'html', 'md', 'epub', 'odt', 'rtf', 'txt'] as const;
        const results: Partial<UploadedDocumentUrls> = {};

        logger.info(`[generateGoogleDoc] Starting secondary exports for: ${secondaryFormats.join(', ')}`);

        // Run exports
        for (const format of secondaryFormats) {
            try {
                logger.info(`[generateGoogleDoc] Exporting to ${format.toUpperCase()}...`);
                const exportResult = await exportGoogleDocToFormatWithRetry(fileId, format);

                if (exportResult.success && exportResult.buffer) {
                    const buffer = exportResult.buffer;
                    const extension = EXPORT_EXTENSIONS[format];
                    const storagePath = `exports/${translationId}/${fileId}${extension}`;
                    const contentType = getContentTypeForFormat(format);

                    logger.info(
                        `[generateGoogleDoc] Uploading ${format.toUpperCase()} (${buffer.byteLength} bytes)...`,
                    );
                    const { error: uploadError } = await supabase.storage
                        .from('exports')
                        .upload(storagePath, buffer, {
                            contentType,
                            upsert: true,
                        });

                    if (uploadError) throw uploadError;

                    const { data: urlData } = await supabase.storage
                        .from('exports')
                        .createSignedUrl(storagePath, 60 * 60 * 24 * 7);

                    if (urlData?.signedUrl) {
                        // Map to UploadedDocumentUrls properties
                        const keyPrefix =
                            format === 'html'
                                ? 'html'
                                : format === 'md'
                                  ? 'markdown'
                                  : format === 'odt'
                                    ? 'odt'
                                    : format === 'epub'
                                      ? 'epub'
                                      : format === 'rtf'
                                        ? 'rtf'
                                        : format === 'txt'
                                          ? 'txt'
                                          : format === 'pdf'
                                            ? 'pdf'
                                            : format;

                        // Special case for HTML Zip vs HTML property
                        const finalPrefix = format === 'html' ? 'html' : keyPrefix;

                        results[`${finalPrefix}DownloadUrl`] = urlData.signedUrl;
                        results[`${finalPrefix}FileSizeBytes`] = buffer.byteLength;
                        results[`${finalPrefix}ExportResult`] = { success: true };
                    }
                } else {
                    results[`${format === 'md' ? 'markdown' : format}ExportResult`] = {
                        success: false,
                        error: exportResult.error || 'Export failed',
                    };
                }
            } catch (err) {
                logger.error(`${format.toUpperCase()} export failed`, safeProviderError(err));
                results[`${format === 'md' ? 'markdown' : format}ExportResult`] = {
                    success: false,
                    error: (err as Error).message,
                };
            }
        }

        // 6. Return Details
        return {
            id: fileId,
            downloadUrl: docxUrlData.signedUrl,
            storagePath: docxPath,
            fileSizeBytes: docxBuffer.byteLength,
            googleDocsEditUrl: createRes.data.webViewLink,
            googleDocsCopyUrl: `https://docs.google.com/document/d/${fileId}/copy`,
            generated_at: new Date().toISOString(),
            ...results,
        } as UploadedDocumentUrls;
    } catch (error) {
        logger.error('Document generation failed', safeProviderError(error));
        throw error;
    }
}

async function ensureBrandingImagesAccessible(
    drive: drive_v3.Drive,
    settings: ExtendedResolvedBrandingSettings,
    ownerId: string,
): Promise<ExtendedResolvedBrandingSettings> {
    const updated = { ...settings };

    // Helper: Upload buffer to accessible Drive file
    const hostOnDrive = async (buffer: Buffer, mime: string): Promise<string | null> => {
        try {
            // 1. Create File on Drive
            const createRes = await drive.files.create({
                requestBody: {
                    name: 'temp-branding-asset',
                    mimeType: mime,
                },
                media: {
                    mimeType: mime,
                    body: Readable.from(buffer),
                },
                fields: 'id, webContentLink',
            });
            const fileId = createRes.data.id;
            const link = createRes.data.webContentLink;

            if (!fileId || !link) return null;

            // 2. Make Public (Reader)
            await drive.permissions.create({
                fileId,
                requestBody: {
                    role: 'reader',
                    type: 'anyone',
                },
            });
            logger.info(`[generateGoogleDoc] Hosted asset on Drive: ${fileId}`);
            return link;
        } catch (e) {
            logger.error('Branding image hosting failed', safeProviderError(e));
            return null;
        }
    };

    // Download only this owner's images from the configured storage origin.
    const processUrl = async (
        fullUrl: string,
        bucket: 'document_logos' | 'document_stamps',
    ): Promise<string> => {
        const { buffer, mimeType } = await downloadBrandingImage(fullUrl, bucket, ownerId);
        const driveLink = await hostOnDrive(buffer, mimeType);
        if (!driveLink) throw new Error(`Failed to host ${bucket} image on Google Drive`);
        return driveLink;
    };

    // Process Logo
    if (updated.logoUrl) {
        updated.logoUrl = (await processUrl(updated.logoUrl, 'document_logos')) || updated.logoUrl;
    }

    // Process Stamp
    if (updated.certificationStampUrl) {
        updated.certificationStampUrl =
            (await processUrl(updated.certificationStampUrl, 'document_stamps')) ||
            updated.certificationStampUrl;
    }

    return updated;
}
