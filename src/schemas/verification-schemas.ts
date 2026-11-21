/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

// src/schemas/verification-schemas.ts
// Zod schemas validate the translation verification response.

import { z } from 'zod';

/**
 * Progress Stage Enum.
 * Defines the stages of document processing for progress reporting.
 */
export const ProgressStageSchema = z
    .enum(['analyzing', 'extracting', 'translating', 'polishing', 'finalizing'])
    .describe('Current processing stage in the translation pipeline.');

/**
 * AI Progress Update Schema.
 * Validates progress reports from the report_progress tool.
 */
export const AIProgressUpdateSchema = z
    .object({
        stage: ProgressStageSchema,
        percent: z
            .number()
            .min(0)
            .max(100)
            .describe('Estimated completion percentage for this phase (0-100).'),
        dynamic_label: z
            .string()
            .min(1)
            .max(30)
            .describe('Short label (2-3 words) shown to user in the UI badge.'),
        stage_message: z
            .string()
            .optional()
            .describe('Longer description for tooltip, explaining current activity.'),
    })
    .strict()
    .describe('Schema for progress updates reported by the AI during translation.');

/**
 * Document Type Enum.
 * Categorizes documents for domain-specific handling.
 */
export const DocumentTypeSchema = z
    .enum(['legal', 'medical', 'financial', 'certificate', 'general'])
    .describe('Document category for domain-specific translation handling.');

/**
 * Document Context Schema.
 * Provides context about the document being processed.
 */
export const DocumentContextSchema = z
    .object({
        documentType: DocumentTypeSchema,
        documentName: z.string().optional().describe('Original filename of the document.'),
        pageCount: z.number().int().positive().optional().describe('Total number of pages in the document.'),
    })
    .strict()
    .describe('Context information about the document being verified.');

/**
 * Untranslated Segment Detection Item Schema.
 * Represents a single untranslated segment detected by the AI.
 */
export const UntranslatedSegmentItemSchema = z
    .object({
        index: z.number().int().nonnegative().describe('Index of the text segment in the analyzed batch.'),
        text: z.string().min(1).describe('The untranslated text content that was detected.'),
        confidence: z
            .number()
            .min(0.8)
            .max(1.0)
            .describe('Confidence score (0.8-1.0) that this segment is untranslated.'),
        reason: z.string().min(1).describe('Explanation of why this segment was flagged as untranslated.'),
    })
    .strict()
    .describe('A single untranslated segment detected during verification.');

/**
 * Untranslated Detection Response Schema.
 * Validates the AI response from the untranslated content detection prompt.
 * Note: AI may return empty object {} if no issues found or analysis fails
 */
export const UntranslatedDetectionResponseSchema = z
    .object({
        analysis_summary: z
            .string()
            .optional()
            .default('No analysis provided')
            .describe('Brief summary of the analysis performed on the document segments.'),
        untranslated: z
            .array(UntranslatedSegmentItemSchema)
            .optional()
            .default([])
            .describe(
                'Array of detected untranslated segments. Empty if all content is properly translated.',
            ),
    })
    .describe('AI response schema for untranslated content detection.');

/**
 * Translation Fix Response Schema.
 * Validates the AI response from the auto-fix translation prompt.
 */
export const TranslationFixResponseSchema = z
    .object({
        translations: z
            .record(
                z.string().regex(/^\d+$/, 'Keys must be numeric indices as strings'),
                z.string().min(1, 'Translations must not be empty'),
            )
            .describe(
                'Map of segment indices to their translated text. Keys are string indices, values are translations.',
            ),
    })
    .strict()
    .describe('AI response schema for translation fix requests.');

/**
 * Translation Context Schema.
 * Context passed to the AI for translation operations.
 */
export const TranslationContextSchema = z
    .object({
        documentType: DocumentTypeSchema,
        sourceLanguage: z
            .string()
            .min(2)
            .max(10)
            .describe('ISO language code of the source document (e.g., "en", "fr").'),
        targetLanguage: z
            .string()
            .min(2)
            .max(10)
            .describe('ISO language code of the target translation (e.g., "ar", "de").'),
        documentName: z.string().optional().describe('Original filename for context.'),
    })
    .strict()
    .describe('Context for translation operations including language pair and document type.');

/**
 * Verification Config Schema.
 * Configuration options for the verification process.
 */
export const VerificationConfigSchema = z
    .object({
        maxRetries: z
            .number()
            .int()
            .min(1)
            .max(5)
            .default(3)
            .describe('Maximum number of auto-fix retry attempts.'),
        confidenceThreshold: z
            .number()
            .min(0.7)
            .max(1.0)
            .default(0.85)
            .describe('Minimum confidence score to flag a segment as untranslated.'),
        batchSize: z
            .number()
            .int()
            .min(10)
            .max(100)
            .default(50)
            .describe('Number of text segments to analyze per API call.'),
        enableTableValidation: z
            .boolean()
            .default(true)
            .describe('Whether to validate table structure integrity.'),
        enableAutoFix: z.boolean().default(true).describe('Whether to attempt automatic translation fixes.'),
    })
    .strict()
    .describe('Configuration options for the translation verification process.');

/**
 * Batch Context Schema.
 * Context carried between translation batches for consistency.
 */
export const BatchContextSchema = z
    .object({
        entities: z
            .array(z.string())
            .optional()
            .describe('Named entities detected (names, companies, places) that should not be translated.'),
        terminology: z
            .record(z.string(), z.string())
            .optional()
            .describe('Domain-specific terms with their translations for consistency.'),
        recentHeadings: z
            .array(z.string())
            .optional()
            .describe('Recent document headings for context continuity.'),
        structureSummary: z.string().optional().describe('Brief summary of document structure seen so far.'),
    })
    .describe('Context accumulated across translation batches.');

/**
 * Batch Translation Response Schema.
 * Validates AI response from a single translation batch.
 */
export const BatchTranslationResponseSchema = z
    .object({
        content: z.array(z.any()).describe('Array of translated content nodes for this batch.'),
        context: BatchContextSchema.optional().describe('Updated context for the next batch.'),
    })
    .describe('AI response schema for a translation batch.');

/**
 * QA Issue Fixed Schema.
 * Describes a single issue fixed during QA.
 */
export const QAIssueFixedSchema = z
    .object({
        type: z.string().describe('Type of issue fixed (formatting, alignment, translation, etc.).'),
        description: z.string().describe('Brief description of what was fixed.'),
        location: z.string().optional().describe('Location in the document where the fix was applied.'),
    })
    .describe('A single issue that was fixed during QA pass.');

/**
 * QA Batch Response Schema.
 * Validates AI response from a single QA/polish batch.
 * Note: AI may return either 'polishedContent' or 'content' depending on recovery
 */
export const QABatchResponseSchema = z
    .object({
        // AI returns 'polishedContent' normally, but 'content' when recovered from truncation
        polishedContent: z
            .array(z.any())
            .optional()
            .describe('Array of polished content nodes for this batch.'),
        content: z
            .array(z.any())
            .optional()
            .describe('Alternative field name for content (used during recovery).'),
        issuesFixed: z
            .array(QAIssueFixedSchema)
            .optional()
            .describe('List of issues that were fixed during polishing.'),
        confidence: z
            .number()
            .min(0)
            .max(1)
            .optional()
            .describe('Confidence score (0-1) in the polishing quality.'),
        context: z.any().optional().describe('Context for next batch (if any).'),
        _recovered: z.boolean().optional().describe('Flag indicating recovery was applied.'),
        _partialRecovery: z.boolean().optional().describe('Flag indicating partial recovery.'),
    })
    .refine((data) => data.polishedContent !== undefined || data.content !== undefined, {
        message: 'Either polishedContent or content must be provided',
    })
    .describe('AI response schema for a QA/polish batch.');

// Type exports for TypeScript inference
export type BatchContext = z.infer<typeof BatchContextSchema>;
export type BatchTranslationResponse = z.infer<typeof BatchTranslationResponseSchema>;
export type QAIssueFixed = z.infer<typeof QAIssueFixedSchema>;
export type QABatchResponse = z.infer<typeof QABatchResponseSchema>;
export type ProgressStage = z.infer<typeof ProgressStageSchema>;
export type AIProgressUpdate = z.infer<typeof AIProgressUpdateSchema>;
export type DocumentType = z.infer<typeof DocumentTypeSchema>;
export type DocumentContext = z.infer<typeof DocumentContextSchema>;
export type UntranslatedSegmentItem = z.infer<typeof UntranslatedSegmentItemSchema>;
export type UntranslatedDetectionResponse = z.infer<typeof UntranslatedDetectionResponseSchema>;
export type TranslationFixResponse = z.infer<typeof TranslationFixResponseSchema>;
export type TranslationContext = z.infer<typeof TranslationContextSchema>;
export type VerificationConfig = z.infer<typeof VerificationConfigSchema>;
