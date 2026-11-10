/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { safeProviderError } from '@/services/log-safety';

import { logger } from '@trigger.dev/sdk';
import { OpenAI } from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { env } from '@/env';
import { AI_PRESETS, type ReasoningLevel } from '@/utils/ai/ai-config';
import { getModelForTask } from '@/utils/ai/providers/openai-adapter';
import { ApiError } from '@errors/api-errors';
import type { ContentNode, NormalisedDocument } from '@/engine/document/types';

/**
 * Maps ReasoningLevel to OpenAI Responses API reasoning effort values.
 *
 * Per OpenAI SDK (shared.d.ts):
 * - gpt-5.1: supports 'none', 'low', 'medium', 'high' (defaults to 'none')
 * - gpt-5-mini, gpt-5-nano: supports 'low', 'medium', 'high' only (no 'none')
 *
 * ReasoningLevel already uses OpenAI values directly, so no mapping needed.
 */
function mapReasoningToOpenAI(reasoning: ReasoningLevel): 'low' | 'medium' | 'high' {
    // metadata uses 'gpt-5-mini' which doesn't support 'minimal' or 'none'
    if (reasoning === 'minimal') return 'low';
    return reasoning;
}

/**
 * Zod schema for document metadata generation
 * Ensures AI returns properly formatted English title and description
 */
const MetadataSchema = z.object({
    displayName: z
        .string()
        .min(3, 'Display name must be at least 3 characters')
        .max(100, 'Display name must not exceed 100 characters')
        .describe('A concise English title for the document'),
    description: z
        .string()
        .min(10, 'Description must be at least 10 characters')
        .max(500, 'Description must not exceed 500 characters')
        .describe('A brief English summary of the document content'),
});

export type DocumentMetadata = z.infer<typeof MetadataSchema>;

/**
 * Extract readable text from normalized document content nodes
 * Traverses the document tree and collects text from various node types
 *
 * @param doc - The normalized document to extract text from
 * @param maxLength - Maximum number of characters to extract (default: 2000)
 * @returns Extracted text string, truncated to maxLength
 */
function extractDocumentText(doc: NormalisedDocument, maxLength = 2000): string {
    const textParts: string[] = [];
    let currentLength = 0;

    /**
     * Recursively traverse content nodes and extract text
     */
    function traverseNode(node: ContentNode) {
        if (currentLength >= maxLength) return;

        switch (node.type) {
            case 'text':
                if (node.text) {
                    textParts.push(node.text);
                    currentLength += node.text.length;
                }
                break;

            case 'paragraph':
            case 'heading':
            case 'blockQuote':
                if (node.content && Array.isArray(node.content)) {
                    node.content.forEach(traverseNode);
                    textParts.push('\n');
                }
                break;

            case 'bulletList':
            case 'orderedList':
                if (node.content && Array.isArray(node.content)) {
                    node.content.forEach((listItem) => {
                        if (listItem.content && Array.isArray(listItem.content)) {
                            listItem.content.forEach(traverseNode);
                            textParts.push('\n');
                        }
                    });
                }
                break;

            case 'table':
                if (node.content && Array.isArray(node.content)) {
                    node.content.forEach((row) => {
                        if (row.content && Array.isArray(row.content)) {
                            row.content.forEach((cell) => {
                                if (cell.content && Array.isArray(cell.content)) {
                                    cell.content.forEach(traverseNode);
                                    textParts.push(' | ');
                                }
                            });
                            textParts.push('\n');
                        }
                    });
                }
                break;

            case 'keyValuePair':
                if (node.attrs?.key) textParts.push(`${node.attrs.key}: `);
                if (node.attrs?.value) textParts.push(`${node.attrs.value}\n`);
                break;

            default:
                // Handle other node types that might have content
                if ('content' in node && Array.isArray(node.content)) {
                    (node.content as ContentNode[]).forEach(traverseNode);
                }
        }
    }

    // Start traversal from document root
    if (doc.content && Array.isArray(doc.content)) {
        doc.content.forEach(traverseNode);
    }

    // Join and clean up the extracted text
    const extractedText = textParts.join('').trim();

    // Truncate to maxLength if needed
    return extractedText.length > maxLength ? extractedText.substring(0, maxLength) + '...' : extractedText;
}

/**
 * Generate English display name and description for a document using OpenAI
 *
 * Analyzes the document content and creates appropriate metadata regardless of source language.
 * Falls back to placeholders if generation fails (non-blocking).
 *
 * @param refinedDocument - The refined normalized document
 * @param sourceLanguage - The source language of the document (e.g., 'fr', 'ar', 'es')
 * @returns Promise containing generated displayName and description in English
 *
 * @example
 * const metadata = await generateDocumentMetadata(refinedDoc, 'fr');
 * // Returns: { displayName: "Purchase Agreement", description: "Contract for..." }
 */
export async function generateDocumentMetadata(
    refinedDocument: NormalisedDocument,
    sourceLanguage: string,
): Promise<DocumentMetadata> {
    try {
        // Initialize OpenAI client
        const openai = new OpenAI({
            apiKey: env.OPEN_AI_API_KEY,
        });

        // Extract document content for analysis (first 2000 chars to avoid token overflow)
        const documentExcerpt = extractDocumentText(refinedDocument, 2000);

        if (!documentExcerpt || documentExcerpt.trim().length === 0) {
            throw new ApiError('Document content is empty or could not be extracted', {
                description: 'Unable to generate metadata for empty document',
                status: 400,
                title: 'Empty Document Content',
                code: 'EMPTY_DOCUMENT_CONTENT',
            });
        }

        // Detect document type for better context
        const documentType = refinedDocument.documentType || 'general document';

        // Get model from centralized config
        const modelName = getModelForTask('metadata');
        const preset = AI_PRESETS.metadata;

        const systemPrompt = `You are a professional document metadata expert. Your task is to analyze documents in any language and generate concise, accurate English metadata.

Requirements:
- Display Name: 3-100 characters, clear and professional
- Description: 10-500 characters, informative summary
- Always generate in English, regardless of document language
- Be specific and descriptive
- Use professional tone
- Focus on key information (type, parties, dates, purpose)`;

        const userPrompt = `Analyze this ${sourceLanguage} document (type: ${documentType}) and generate English metadata:

Document Content:
${documentExcerpt}

Generate:
1. A concise English display name (3-100 chars) that clearly identifies this document
2. A brief English description (10-500 chars) summarizing the key information

Focus on: document type, main parties involved, purpose, key dates/amounts if applicable.`;

        // Use Responses API with parse for structured output
        const response = await openai.responses.parse({
            model: modelName,
            input: userPrompt,
            instructions: systemPrompt,
            text: {
                format: zodTextFormat(MetadataSchema, 'document_metadata'),
            },
            reasoning: { effort: mapReasoningToOpenAI(preset.reasoning) },
            max_output_tokens: preset.maxOutputTokens || 500,
        });

        const parsed = response.output_parsed;

        if (
            !parsed ||
            typeof parsed !== 'object' ||
            !('displayName' in parsed) ||
            !('description' in parsed)
        ) {
            throw new ApiError('OpenAI returned no metadata', {
                description: 'Failed to parse metadata from OpenAI response',
                status: 500,
                title: 'Metadata Generation Failed',
                code: 'METADATA_GENERATION_FAILED',
            });
        }

        return parsed as DocumentMetadata;
    } catch (error) {
        // Log error but don't throw - fall back to placeholders
        console.error('Failed to generate document metadata:', safeProviderError(error));

        return {
            displayName: 'Pending AI Generated Name',
            description: 'Pending AI Generated Description',
        };
    }
}

/**
 * Generate English display name and description from document IMAGES using GPT-5.1 Vision.
 *
 * This function is designed to run EARLY in the pipeline (during 'processing' stage)
 * before translation begins. It uses vision to understand the document from images.
 *
 * @param documentImages - Array of base64 data URI images (first 1-2 pages are enough)
 * @param sourceLanguage - Optional hint about source language
 * @returns Promise containing generated displayName and description in English
 */
export async function generateMetadataFromImages(
    documentImages: string[],
    sourceLanguage?: string,
): Promise<DocumentMetadata> {
    const startTime = Date.now();

    try {
        const openai = new OpenAI({
            apiKey: env.OPEN_AI_API_KEY,
        });

        // Use only first 1-2 pages for metadata (faster, cheaper)
        const imagesToAnalyze = documentImages.slice(0, 2);

        logger.info('Generating document metadata from images', {
            pageCount: imagesToAnalyze.length,
            totalPages: documentImages.length,
        });

        // Build image content items for the Responses API
        // input_image/input_text are CONTENT types, not INPUT types - must be wrapped in message
        const imageContent = imagesToAnalyze.map((imageBase64) => ({
            type: 'input_image' as const,
            image_url: imageBase64,
            detail: 'low' as const, // Low detail is enough for metadata extraction
        }));

        const languageHint =
            sourceLanguage && sourceLanguage !== 'auto'
                ? `The document appears to be in ${sourceLanguage}.`
                : 'Detect the document language.';

        // Get model from centralized config
        const modelName = getModelForTask('metadata');
        const preset = AI_PRESETS.metadata;

        const systemPrompt = `You are a professional document analyst. Look at the document image(s) and generate English metadata.

Requirements:
- Display Name: 3-100 characters, clear and professional English title
- Description: 10-500 characters, informative English summary
- Always generate in ENGLISH, regardless of document language
- Be specific: identify document type, parties, purpose
- Use professional tone`;

        const userPrompt = `${languageHint}

Look at this document and generate:
1. A concise English display name (3-100 chars) that clearly identifies this document type
2. A brief English description (10-500 chars) summarizing the key information

Examples:
- "Academic Results Report" / "Synthetic grade report for an example learner at an example school"
- "French Birth Certificate" / "Official birth certificate issued by the City of Paris for Jean Dupont, born January 15, 1990"
- "Employment Contract" / "Synthetic full-time agreement between an example employer and employee"`;

        const textContent = { type: 'input_text' as const, text: userPrompt };

        // Wrap content in a user message - Responses API requires message objects at top level
        const inputMessage = {
            role: 'user' as const,
            content: [...imageContent, textContent],
        };

        // Use Responses API with parse for structured output + vision
        const response = await openai.responses.parse({
            model: modelName,
            input: [inputMessage],
            instructions: systemPrompt,
            text: {
                format: zodTextFormat(MetadataSchema, 'document_metadata'),
            },
            reasoning: { effort: mapReasoningToOpenAI(preset.reasoning) },
            max_output_tokens: preset.maxOutputTokens || 500,
        });

        const parsed = response.output_parsed;

        if (
            !parsed ||
            typeof parsed !== 'object' ||
            !('displayName' in parsed) ||
            !('description' in parsed)
        ) {
            throw new Error('OpenAI returned no metadata');
        }

        const metadata = parsed as DocumentMetadata;
        const processingTime = Date.now() - startTime;
        logger.info('Document metadata generated from images', {
            displayName: metadata.displayName,
            descriptionPreview: metadata.description.substring(0, 50) + '...',
            processingTimeMs: processingTime,
        });

        return metadata;
    } catch (error) {
        logger.warn('Failed to generate document metadata from images', {
            error: (error as Error).message,
            processingTimeMs: Date.now() - startTime,
        });

        return {
            displayName: 'Pending AI Generated Name',
            description: 'Pending AI Generated Description',
        };
    }
}
