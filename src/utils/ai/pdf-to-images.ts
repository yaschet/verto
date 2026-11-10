/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '@trigger.dev/sdk';
import { PDFDocument } from 'pdf-lib';

/**
 * PDF to Images Converter using MuPDF
 *
 * This is the official Trigger.dev recommended approach for PDF to image conversion.
 * See: https://trigger.dev/docs/guides/examples/pdf-to-image
 *
 * MuPDF (mutool) is a lightweight, high-quality PDF renderer that:
 * - Works natively in Node.js/Linux environments
 * - Produces high-quality images
 * - Has no browser API dependencies (no DOMMatrix errors)
 * - Is installed via aptGet build extension in trigger.config.ts
 */

export type PdfToImagesConfig = {
    /** DPI for rendering (72 = screen, 150 = good quality, 300 = print quality) */
    dpi: number;
    /** Maximum width in pixels (to control token usage) */
    maxWidth: number;
    /** Maximum height in pixels */
    maxHeight: number;
    /** Image format */
    format: 'png' | 'jpeg';
    /** JPEG quality (0-100, only used for JPEG format) */
    quality: number;
};

const DEFAULT_CONFIG: PdfToImagesConfig = {
    dpi: 150,
    maxWidth: 2048, // OpenAI Vision max recommended
    maxHeight: 2048,
    format: 'png',
    quality: 90,
};

/**
 * Converts a PDF buffer to an array of base64-encoded images using MuPDF.
 *
 * This uses the `mutool` CLI which is installed via the aptGet build extension.
 * For local development, install mupdf-tools: `brew install mupdf-tools` (macOS)
 * or `apt-get install mupdf-tools` (Linux/Ubuntu).
 *
 * @param pdfBuffer - The PDF file as a Buffer or Uint8Array
 * @param config - Rendering configuration
 * @returns Array of base64 data URIs (data:image/png;base64,...)
 */
export async function convertPdfToImages(
    pdfBuffer: Buffer | Uint8Array,
    config: Partial<PdfToImagesConfig> = {},
): Promise<string[]> {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    const images: string[] = [];

    // Create a unique temp directory for this conversion
    const tempDir = `/tmp/pdf-convert-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const pdfPath = path.join(tempDir, 'input.pdf');

    try {
        // Create temp directory
        fs.mkdirSync(tempDir, { recursive: true });

        // Write PDF buffer to temp file
        fs.writeFileSync(pdfPath, Buffer.from(pdfBuffer));

        logger.info('PDF saved to temp file for MuPDF conversion', {
            tempDir,
            pdfSize: pdfBuffer.length,
            dpi: finalConfig.dpi,
        });

        // Use mutool to convert PDF to images
        // mutool convert -o output/page-%d.png -O resolution=150 input.pdf
        const outputPattern = path.join(tempDir, `page-%d.${finalConfig.format}`);

        // Build mutool command
        // -o: output pattern
        // -O: options (resolution for DPI)
        // -F: output format (png or jpeg)
        const formatFlag = finalConfig.format === 'jpeg' ? 'jpeg' : 'png';
        const mutoolCmd = `mutool convert -F ${formatFlag} -O resolution=${finalConfig.dpi} -o "${outputPattern}" "${pdfPath}"`;

        logger.info('Running MuPDF conversion', { command: mutoolCmd });

        try {
            execSync(mutoolCmd, {
                stdio: 'pipe',
                timeout: 120000, // 2 minute timeout
            });
        } catch (execError) {
            // Check if mutool is available
            try {
                execSync('which mutool', { stdio: 'pipe' });
            } catch {
                throw new Error(
                    'MuPDF (mutool) is not installed. ' +
                        'For local development: brew install mupdf-tools (macOS) or apt-get install mupdf-tools (Linux). ' +
                        'For Trigger.dev deployment: ensure aptGet({ packages: ["mupdf-tools"] }) is in trigger.config.ts',
                );
            }
            throw new Error(`MuPDF conversion failed: ${(execError as Error).message}`);
        }

        // Read all generated images
        const files = fs
            .readdirSync(tempDir)
            .filter((f) => f.startsWith('page-') && f.endsWith(`.${finalConfig.format}`));

        // Sort files numerically (page-1.png, page-2.png, etc.)
        files.sort((a, b) => {
            const numA = parseInt(a.match(/page-(\d+)/)?.[1] || '0', 10);
            const numB = parseInt(b.match(/page-(\d+)/)?.[1] || '0', 10);
            return numA - numB;
        });

        logger.info('MuPDF conversion complete', {
            pageCount: files.length,
            files,
        });

        // Convert each image to base64 data URI
        for (const file of files) {
            const imagePath = path.join(tempDir, file);
            const imageBuffer = fs.readFileSync(imagePath);
            const mimeType = finalConfig.format === 'jpeg' ? 'image/jpeg' : 'image/png';
            const base64 = imageBuffer.toString('base64');
            const dataUri = `data:${mimeType};base64,${base64}`;
            images.push(dataUri);
        }

        logger.info('PDF to images conversion complete', {
            totalPages: images.length,
            format: finalConfig.format,
            dpi: finalConfig.dpi,
        });

        return images;
    } catch (error) {
        logger.error('PDF to images conversion failed', { error });
        throw error;
    } finally {
        // Clean up temp directory
        try {
            if (fs.existsSync(tempDir)) {
                fs.rmSync(tempDir, { recursive: true, force: true });
            }
        } catch (cleanupError) {
            logger.warn('Failed to clean up temp directory', { tempDir, error: cleanupError });
        }
    }
}

/**
 * Gets the page count of a PDF without full conversion.
 */
export async function getPdfPageCount(pdfBuffer: Buffer | Uint8Array): Promise<number> {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    return pdfDoc.getPageCount();
}

/**
 * Converts a single image buffer to a base64 data URI.
 */
export function imageBufferToDataUri(buffer: Buffer, mimeType: string): string {
    const base64 = buffer.toString('base64');
    return `data:${mimeType};base64,${base64}`;
}

/**
 * Estimates token usage for images based on OpenAI's pricing model.
 * OpenAI charges based on image dimensions.
 *
 * For high detail mode:
 * - Images are scaled to fit within 2048x2048
 * - Then divided into 512x512 tiles
 * - Each tile costs 170 tokens
 * - Plus 85 base tokens per image
 */
export function estimateImageTokens(width: number, height: number, detail: 'low' | 'high' = 'high'): number {
    if (detail === 'low') {
        return 85; // Fixed cost for low detail
    }

    // Scale to fit 2048x2048
    const maxDim = 2048;
    let scaledWidth = width;
    let scaledHeight = height;

    if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        scaledWidth = Math.floor(width * scale);
        scaledHeight = Math.floor(height * scale);
    }

    // Scale shortest side to 768px (OpenAI's processing)
    const minDim = 768;
    if (Math.min(scaledWidth, scaledHeight) > minDim) {
        const scale = minDim / Math.min(scaledWidth, scaledHeight);
        scaledWidth = Math.floor(scaledWidth * scale);
        scaledHeight = Math.floor(scaledHeight * scale);
    }

    // Calculate tiles
    const tilesX = Math.ceil(scaledWidth / 512);
    const tilesY = Math.ceil(scaledHeight / 512);
    const totalTiles = tilesX * tilesY;

    // 170 tokens per tile + 85 base
    return totalTiles * 170 + 85;
}

/**
 * Estimates total token usage for a PDF document.
 */
export async function estimatePdfTokenUsage(
    pdfBuffer: Buffer | Uint8Array,
    config: Partial<PdfToImagesConfig> = {},
): Promise<{ totalTokens: number; pageCount: number; tokensPerPage: number }> {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pageCount = pdfDoc.getPageCount();

    // Estimate based on typical A4 page at configured DPI
    const typicalWidth = Math.min(8.5 * finalConfig.dpi, finalConfig.maxWidth);
    const typicalHeight = Math.min(11 * finalConfig.dpi, finalConfig.maxHeight);
    const tokensPerPage = estimateImageTokens(typicalWidth, typicalHeight);

    return {
        totalTokens: tokensPerPage * pageCount,
        pageCount,
        tokensPerPage,
    };
}
