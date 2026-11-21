/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { logger } from '@trigger.dev/sdk';
import OpenAI from 'openai';
import * as undici from 'undici';
import { env } from '@/env';
import { AI_PRESETS, type OutputVerbosity, type ReasoningLevel } from '@/utils/ai/ai-config';
import {
    type BatchSizeResult,
    type DocumentType,
    calculateConservativeBatchSize,
    calculateRetryBatchSize,
    createBatches,
} from '@/engine/translation/batch-sizing';
import { TruncationError, isTruncationError, parseWithRecovery } from '@/engine/translation/json-recovery';
import {
    type AIProgressUpdate,
    PROGRESS_INSTRUCTION,
    type VisionContent,
    translateWithProgress,
} from '@/utils/ai/openai-responses-client';
import { getModelForTask } from '@/utils/ai/providers/openai-adapter';
import { validateAIResponseSafe } from '@/utils/ai/schema-validation';
import { logError, logPhase, logWarning } from '@/trigger/logging';
import { BatchTranslationResponseSchema } from '@schemas/verification-schemas';
import type { BatchAudit, TranslationStageAudit } from '@/types/ai-audit';

/**
 * Maps ReasoningLevel to OpenAI Responses API reasoning effort values.
 *
 * Per OpenAI SDK (shared.d.ts):
 * - High-reasoning models: supports 'none', 'low', 'medium', 'high' (defaults to 'none')
 * - Lightweight models: supports 'low', 'medium', 'high' only (no 'none')
 *
 * ReasoningLevel already uses OpenAI values directly, so no mapping needed.
 */
function mapReasoningToOpenAI(reasoning: ReasoningLevel): 'minimal' | 'low' | 'medium' | 'high' {
    return reasoning;
}

/**
 * Maps abstract OutputVerbosity to OpenAI API verbosity values.
 */
function mapVerbosityToOpenAI(verbosity?: OutputVerbosity): 'low' | 'medium' | 'high' {
    switch (verbosity) {
        case 'concise':
            return 'low';
        case 'standard':
            return 'medium';
        case 'detailed':
            return 'high';
        default:
            return 'medium';
    }
}
import type { ContentNode, NormalisedDocument } from '@/engine/document/types';
import { getTextDirection } from '@/constants/translations';

// Configure robust HTTP agent to prevent TCP drops during long-running requests
// Configure robust HTTP agent to prevent TCP drops during long-running requests
const dispatcher = new undici.Agent({
    keepAliveTimeout: 30000, // Keep connection active for 30s
    keepAliveMaxTimeout: 86400000, // Max keepalive timeout 24 hours
    bodyTimeout: 86400000, // 24 hours body timeout
    headersTimeout: 86400000, // 24 hours headers timeout
});

new OpenAI({
    apiKey: env.OPEN_AI_API_KEY,
    timeout: 86400 * 1000, // 24 hours
    fetchOptions: {
        dispatcher,
    },
});

/**
 * Configuration for vision-based translation
 */
export type VisionTranslationConfig = {
    /** Maximum pages to process in a single batch (OpenAI supports up to 10 images) */
    maxPagesPerBatch: number;
    /** Target language code (e.g., 'fr', 'es', 'ar') */
    targetLanguage: string;
    /** Source language code (optional, auto-detected if not provided) */
    sourceLanguage?: string;
    /** Document type hint for better context */
    documentType?: 'legal' | 'medical' | 'financial' | 'certificate' | 'general';
    /** Whether to preserve original formatting strictly */
    preserveFormatting: boolean;
    /** DPI for PDF to image conversion (higher = better quality, more tokens) */
    imageDpi: number;
    /** Enable dynamic batch sizing based on content complexity (default: true) */
    dynamicBatching?: boolean;
    /** Maximum completion tokens for API (default: 16384) */
    maxCompletionTokens?: number;
    /** Estimated input tokens per page (from PDF analysis) - used for batch sizing */
    estimatedInputTokensPerPage?: number;
    /** Concurrency limit for batch processing (default: 5) */
    concurrency?: number;
};

const DEFAULT_CONFIG: VisionTranslationConfig = {
    maxPagesPerBatch: 5, // Now serves as MAXIMUM, actual is calculated dynamically
    targetLanguage: 'fr',
    preserveFormatting: true,
    imageDpi: 150, // Balance between quality and token usage
    dynamicBatching: true, // Enable dynamic batch sizing by default
    maxCompletionTokens: 16384,
};

/**
 * Result of a vision-based translation
 */
export type VisionTranslationResult = {
    /** The translated document in ProseMirror format */
    translatedDocument: NormalisedDocument;
    /** Detected source language */
    detectedLanguage: string;
    /** Confidence score (0-1) */
    confidence: number;
    /** Processing metadata */
    metadata: {
        totalPages: number;
        batchesProcessed: number;
        tokensUsed: number;
        processingTimeMs: number;
        /** Context accumulated across batches - useful for debugging */
        finalContext?: BatchContext;
    };
    /** AI audit data for comprehensive logging */
    audit: TranslationStageAudit;
};

// Re-export PDF conversion utilities from the dedicated module
// This avoids duplicate implementations and keeps the code DRY
export {
    convertPdfToImages,
    imageBufferToDataUri,
    estimatePdfTokenUsage,
    getPdfPageCount,
} from './pdf-to-images';

/**
 * Builds the system prompt for vision-based document translation.
 * This is the CORE of the legendary approach.
 *
 * The prompt is carefully crafted to:
 * 1. Produce valid ProseMirror JSON that TipTap can render
 * 2. Preserve document structure exactly
 * 3. Protect entities intelligently
 * 4. Achieve sworn-translator level accuracy
 */
function buildVisionTranslationPrompt(config: VisionTranslationConfig): string {
    const documentTypeContext = config.documentType
        ? `This is a ${config.documentType} document. Apply appropriate terminology and formality.`
        : 'Analyze the document type and apply appropriate translation style.';

    const targetLang = config.targetLanguage;
    const sourceLang = config.sourceLanguage
        ? `SOURCE LANGUAGE: ${config.sourceLanguage}`
        : 'AUTO-DETECT source language';

    return `You are a SWORN TRANSLATOR producing certified translations for legal use.

${documentTypeContext}

TARGET LANGUAGE: ${targetLang}
${sourceLang}

═══════════════════════════════════════════════════════════════════════════════
THE SWORN TRANSLATOR'S MANDATE
═══════════════════════════════════════════════════════════════════════════════

A certified translation must render the COMPLETE semantic content of the source
document into the target language. Courts, immigration authorities, and government
agencies will REJECT any translation that leaves meaningful content untranslated.

THE UNIVERSAL RULE:
If text carries meaning, it must be translated. If text identifies a specific
person, place, or reference number, it stays in original form.

═══════════════════════════════════════════════════════════════════════════════
WHAT TO PROTECT (keep in original language)
═══════════════════════════════════════════════════════════════════════════════

PROTECTED: Text that identifies specific individuals or locations
- Personal names: The name "張偉" or "محمد أحمد" or "Jean Dupont" stays as-is
- Physical addresses: Street addresses, postal codes, building numbers
- Reference numbers: Case numbers, file numbers, document IDs, account numbers
- Dates: Keep in original format (the reader needs to match to source)

THE TEST: "Does this text identify WHO or WHERE specifically?"
If yes → protect it. If no → translate it.

═══════════════════════════════════════════════════════════════════════════════
WHAT TO TRANSLATE (render in target language)
═══════════════════════════════════════════════════════════════════════════════

TRANSLATE: Text that describes functions, titles, institutions, or concepts

CATEGORY 1 - GOVERNMENT & INSTITUTIONS (always translate):
- Ministries, departments, bureaus, agencies → translate the function
- Courts, tribunals, legal bodies → translate the type of court
- Universities, schools, faculties → translate the institution type
- Country names, region names → translate to target language equivalent

CATEGORY 2 - TITLES & CREDENTIALS (always translate):
- Academic degrees (Bachelor's, Master's, Doctorate equivalents)
- Professional titles (Director, Manager, Officer)
- Official designations (Certified, Registered, Licensed)
- Academic levels (primary, secondary, higher education)

CATEGORY 3 - DOCUMENT CONTENT (always translate):
- Section headings, chapter titles, labels
- Table headers, column names, row labels
- Form field labels, instructions, notes
- Legal clauses, terms, conditions
- Financial descriptions (transaction types, account types)

CATEGORY 4 - TECHNICAL TERMS (translate with precision):
- Legal terminology → use target language legal terms
- Medical terminology → use target language medical terms
- Financial terminology → use target language financial terms
- If no exact equivalent exists, translate the concept and note original in brackets

THE TEST: "Does this text describe WHAT something is or does?"
If yes → translate it.

═══════════════════════════════════════════════════════════════════════════════
DOCUMENT-TYPE AWARENESS
═══════════════════════════════════════════════════════════════════════════════

Apply these principles regardless of document origin or type:

ACADEMIC DOCUMENTS (transcripts, diplomas, certificates):
- Translate: institution names, degree titles, course names, grading scales
- Protect: student name, student ID, dates

FINANCIAL DOCUMENTS (bank statements, invoices, contracts):
- Translate: transaction descriptions, account types, terms and conditions
- Protect: account numbers, reference numbers, amounts (keep format)

LEGAL DOCUMENTS (contracts, court orders, certificates):
- Translate: all clauses, headings, legal terms, party descriptions
- Protect: party names, case numbers, addresses

IDENTITY DOCUMENTS (passports, IDs, birth certificates):
- Translate: field labels, issuing authority, document type
- Protect: personal details (name, ID number, address)

MEDICAL DOCUMENTS (reports, prescriptions, records):
- Translate: diagnoses, procedures, instructions, medical terms
- Protect: patient name, ID numbers, dates

═══════════════════════════════════════════════════════════════════════════════
QUALITY STANDARDS
═══════════════════════════════════════════════════════════════════════════════

1. COMPLETENESS: Every meaningful word in source appears in target
2. ACCURACY: Terminology matches target-language professional standards
3. REGISTER: Formal tone appropriate for official documents
4. STRUCTURE: Preserve document hierarchy (headings, tables, lists)

ARTIFACTS TO EXCLUDE:
- Page numbers, headers/footers that repeat
- Watermarks, stamps (describe if legally relevant)
- Scanning artifacts, visual noise

═══════════════════════════════════════════════════════════════════════════════
FAILURE CONDITIONS
═══════════════════════════════════════════════════════════════════════════════

A translation FAILS if:
- Any heading remains in source language
- Any institution name remains untranslated
- Any degree or title remains untranslated
- Any descriptive text remains in source language
- Protected entities (names, addresses) are incorrectly translated

═══════════════════════════════════════════════════════════════════════════════
ABSOLUTE RULES - VIOLATION = LEGAL LIABILITY
═══════════════════════════════════════════════════════════════════════════════

1. NEVER delete or omit ANY content from the source document
2. Tables must preserve ALL data - every cell, every value, every row
3. A header row spanning fewer columns than data rows is VALID - do not "fix" it
4. Academic transcripts: ALL subjects, ALL grades, ALL scores must appear
5. Missing content = failed translation = legal liability

BEFORE FINALIZING:
- Count tables in source vs output
- Count rows in each table
- Verify all headings are present
- Verify all paragraphs are present

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT - PROSEMIRROR/TIPTAP COMPATIBLE JSON
═══════════════════════════════════════════════════════════════════════════════

Return ONLY valid JSON. No markdown, no explanations.

CRITICAL JSON RULES:
1. Every node MUST have a valid "type" field with one of these EXACT values:
   - "heading", "paragraph", "text", "table", "tableRow", "tableCell"
   - "bulletList", "orderedList", "listItem", "spacer", "keyValuePair"
2. NEVER use empty strings or special characters as type values
3. NEVER create nodes like {"type": ": "} or {"type": ""} - these are INVALID
4. Every "text" node MUST have non-empty "text" field
5. Always include "marks": [] even if empty for text nodes

HEADING NODE:
{
  "type": "heading",
  "attrs": { "level": 1, "textAlign": "left" },
  "content": [{ "type": "text", "text": "Translated Title", "marks": [{ "type": "bold" }] }]
}

PARAGRAPH NODE:
{
  "type": "paragraph",
  "attrs": { "textAlign": "justify" },
  "content": [{ "type": "text", "text": "Translated paragraph text.", "marks": [] }]
}

TEXT NODE (inside paragraph/heading):
{ "type": "text", "text": "The text content", "marks": [{ "type": "bold" }] }

MARKS (optional array):
- { "type": "bold" }
- { "type": "italic" }
- { "type": "underline" }

═══════════════════════════════════════════════════════════════════════════════
TABLE STRUCTURE - CRITICAL VERIFICATION RULES
═══════════════════════════════════════════════════════════════════════════════

Tables are the #1 source of errors. BUILD THEM CORRECTLY by following these steps:

STEP 1: COUNT COLUMNS IN THE SOURCE TABLE
- Look at the header row(s) in the source image
- Count the total number of distinct columns (including any merged cells)
- This is the EXPECTED column count for the entire table
- Example: If you see "Category | Revenue | Expenses | Variance" → 4 columns

STEP 2: EVERY ROW MUST MATCH THE COLUMN COUNT
- For each row: sum of all colspan values MUST equal the expected column count
- If a cell from a previous row has rowspan > 1, that column is OCCUPIED
- Occupied columns DO NOT need a cell in the current row

STEP 3: PRESERVE MERGED CELLS EXACTLY
- If a header spans 2 columns visually → set colspan: 2
- If a category spans 3 rows visually → set rowspan: 3
- Merged cells carry semantic meaning - do NOT flatten them

VALIDATION BEFORE OUTPUT:
□ Count columns in first row (accounting for colspan)
□ Verify every subsequent row has same total column count
□ Verify rowspan cells correctly reduce subsequent row cell counts

ALWAYS INCLUDE attrs ON EVERY TABLE CELL:
{
  "type": "tableCell",
  "attrs": { "colspan": 1, "rowspan": 1, "textAlign": "left", "colwidth": null },
  "content": [{ "type": "paragraph", "attrs": { "textAlign": "left" }, "content": [{ "type": "text", "text": "Cell content", "marks": [] }] }]
}

EXAMPLE - VALID 4-COLUMN TABLE WITH MERGED HEADER:
Row 1 (header): [colspan=2: "Category"] + [colspan=1: "Q1"] + [colspan=1: "Q2"] = 4 ✓
Row 2 (data): [colspan=1: "Sales"] + [colspan=1: "$100"] + [colspan=1: "$120"] + [colspan=1: "$80"] = 4 ✓

EXAMPLE - INVALID TABLE (DO NOT CREATE):
Row 1: [colspan=2] + [colspan=1] = 3 columns
Row 2: [colspan=1] + [colspan=1] + [colspan=1] + [colspan=1] = 4 columns
❌ MISMATCH - Row 1 has 3 columns, Row 2 has 4 columns

ROWSPAN EXAMPLE:
If row 1 column 1 has rowspan=3:
- Row 1: 4 cells (column 1 spans into rows 2,3)
- Row 2: 3 cells (column 1 is occupied by row 1's cell)
- Row 3: 3 cells (column 1 is occupied by row 1's cell)
- Row 4: 4 cells (rowspan ended)

LIST NODES:
{
  "type": "bulletList",
  "content": [
    {
      "type": "listItem",
      "content": [{ "type": "paragraph", "attrs": { "textAlign": "left" }, "content": [{ "type": "text", "text": "List item", "marks": [] }] }]
    }
  ]
}

{
  "type": "orderedList",
  "attrs": { "order": 1 },
  "content": [
    {
      "type": "listItem",
      "content": [{ "type": "paragraph", "attrs": { "textAlign": "left" }, "content": [{ "type": "text", "text": "Numbered item", "marks": [] }] }]
    }
  ]
}

SPACER (between sections):
{ "type": "spacer", "attrs": { "height": 24 } }

═══════════════════════════════════════════════════════════════════════════════
KEY-VALUE PAIRS - MANDATORY FOR LABEL:VALUE CONTENT
═══════════════════════════════════════════════════════════════════════════════

RULE: When you see "Label: Value" or "Field: Data" patterns, ALWAYS use keyValuePair nodes.
NEVER put "Label: Value" content inside a paragraph - that is WRONG.

EXAMPLES OF CONTENT THAT MUST USE keyValuePair:
- "Name: John Doe" → keyValuePair
- "Date of Birth: 15/01/1990" → keyValuePair
- "Student ID: 12345" → keyValuePair
- "Nationality: French" → keyValuePair
- "Grade: A+" → keyValuePair (when standalone, not in a table)
- "Issued by: Ministry of Education" → keyValuePair

KEY-VALUE PAIR FORMAT:
{ "type": "keyValuePair", "attrs": { "key": "Date of Birth", "value": "January 15, 1990" } }

WHEN TO USE keyValuePair vs TABLE:
- Single field-value pairs or short lists → keyValuePair
- Structured grid with multiple columns → table
- Form-like content with labels and values → keyValuePair

═══════════════════════════════════════════════════════════════════════════════
QUALITY STANDARD
═══════════════════════════════════════════════════════════════════════════════

Your translation must be indistinguishable from a human certified translator's work.
A professional translator reviewing your output should find ZERO errors.`;
}

/**
 * Valid node types for ProseMirror/TipTap documents.
 */
const VALID_NODE_TYPES = new Set([
    'text',
    'paragraph',
    'heading',
    'bulletList',
    'orderedList',
    'listItem',
    'table',
    'tableRow',
    'tableCell',
    'tableHeader',
    'spacer',
    'keyValuePair',
    'hardBreak',
    'blockquote',
    'codeBlock',
    'image',
]);

/**
 * Sanitizes content nodes from AI response to prevent malformed types.
 * Removes nodes with invalid types like {"type": ": "} or empty types.
 */
function sanitizeContentNodes(nodes: unknown[]): ContentNode[] {
    if (!Array.isArray(nodes)) {
        logger.warn('sanitizeContentNodes received non-array', { type: typeof nodes });
        return [];
    }

    return nodes.map((node) => sanitizeNode(node)).filter((node): node is ContentNode => node !== null);
}

/**
 * Recursively sanitizes a single node and its children.
 */
function sanitizeNode(candidate: unknown): ContentNode | null {
    if (!candidate || typeof candidate !== 'object') {
        return null;
    }
    const node = candidate as Record<string, unknown>;

    // Reject nodes with invalid or malformed types
    if (!node.type || typeof node.type !== 'string') {
        logger.warn('Rejecting node without valid type', { node });
        return null;
    }

    const nodeType = node.type.trim();

    // Reject empty or malformed types
    if (nodeType.length === 0 || /^[\s:;,.\-_]+$/.test(nodeType)) {
        logger.warn('Rejecting malformed node type', { type: node.type });
        return null;
    }

    // Reject unknown node types (AI hallucination)
    if (!VALID_NODE_TYPES.has(nodeType)) {
        logger.warn('Rejecting unknown node type', { type: nodeType });
        return null;
    }

    // Handle text nodes
    if (nodeType === 'text') {
        if (!node.text || typeof node.text !== 'string' || node.text.length === 0) {
            return null; // Skip empty text nodes
        }
        return {
            type: 'text',
            text: node.text,
            marks: Array.isArray(node.marks) ? node.marks : [],
        } as unknown as ContentNode;
    }

    // Handle nodes with content arrays
    if (node.content && Array.isArray(node.content)) {
        const sanitizedContent = node.content
            .map((child: unknown) => sanitizeNode(child))
            .filter((child: unknown) => child !== null);

        // If container is now empty, skip it (except for certain types)
        if (sanitizedContent.length === 0 && !['spacer', 'keyValuePair', 'hardBreak'].includes(nodeType)) {
            return null;
        }

        return {
            ...node,
            type: nodeType,
            content: sanitizedContent,
        } as unknown as ContentNode;
    }

    // Pass through other valid nodes (spacer, keyValuePair, etc.)
    return {
        ...node,
        type: nodeType,
    } as unknown as ContentNode;
}

export type BatchContext = {
    /** Entities found so far (names, companies, addresses) */
    entities: string[];
    /** Key terminology translations for consistency */
    terminology: Record<string, string>;
    /** Last few headings for structure continuity */
    recentHeadings: string[];
    /** Summary of document structure so far */
    structureSummary: string;
};

/**
 * Result of processing a batch, including truncation info for retry logic.
 */
type BatchProcessResult = {
    content: ContentNode[];
    context: BatchContext;
    tokensUsed: number;
    truncated: boolean;
    recovered: boolean;
    /** Per-batch audit data */
    batchAudit: BatchAudit;
};

async function processPageBatch(
    pageImages: string[],
    config: VisionTranslationConfig,
    batchIndex: number,
    previousContext?: BatchContext,
    onProgress?: (progress: AIProgressUpdate) => Promise<void>,
    _maxCompletionTokens?: number,
): Promise<BatchProcessResult> {
    const batchStartTime = Date.now();
    const _batchId = `batch-${batchIndex + 1}`;

    // Get model and reasoning from centralized AI_PRESETS
    const modelName = getModelForTask('translation');
    const preset = AI_PRESETS.translation;

    return await logger.trace('process-batch', async (span) => {
        span.setAttribute('batch.index', batchIndex);
        span.setAttribute('batch.pages', pageImages.length);
        span.setAttribute('batch.model', modelName);
        span.setAttribute('batch.reasoning', preset.reasoning);

        logPhase('TRANSLATE', `Batch ${batchIndex + 1} Processing started`, {
            pages: pageImages.length,
            context: previousContext ? 'YES' : 'NO',
            model: modelName,
        });

        // Build vision content for the wrapper
        const imageContent: VisionContent[] = [
            // Original images first
            ...pageImages.map((imageBase64) => ({
                type: 'image_url' as const,
                image_url: {
                    url: imageBase64,
                    detail: 'high' as const,
                },
            })),
            // Then the translation instruction
            {
                type: 'text' as const,
                text: `DOCUMENT PAGES TO TRANSLATE: See the ${pageImages.length} image(s) above.

CONTEXT FROM PREVIOUS BATCHES:
${
    previousContext
        ? `
- Entities found so far: ${previousContext.entities.join(', ')}
- Terminology used: ${JSON.stringify(previousContext.terminology)}
- Recent headings: ${previousContext.recentHeadings.join(' > ')}
- Structure summary: ${previousContext.structureSummary}
`
        : 'None (First batch)'
}

Translate the content visible in the images above into ${config.targetLanguage}. Follow the SWORN TRANSLATOR'S MANDATE.`,
            },
        ];

        // Build context-aware instruction for this batch
        let batchInstruction: string;

        if (batchIndex === 0) {
            batchInstruction = `Analyze and translate this document section (pages 1-${pageImages.length}).

Return a JSON object with:
1. "content": Array of translated content nodes (ProseMirror format)
2. "context": Object containing:
   - "entities": Array of proper nouns found (names, companies, addresses) - DO NOT translate these
   - "terminology": Object mapping key terms to their translations for consistency
   - "recentHeadings": Last 3 heading texts (translated)
   - "structureSummary": Brief description of document structure seen so far`;
        } else {
            // Format batch context clearly to distinguish translated vs protected content
            const entitiesList = previousContext?.entities.length
                ? previousContext.entities.map((e, i) => `   ${i + 1}. "${e}"`).join('\n')
                : '   None identified yet';

            const terminologyJson =
                previousContext?.terminology && Object.keys(previousContext.terminology).length > 0
                    ? JSON.stringify(previousContext.terminology, null, 2)
                    : '   {}';

            const headingsList = previousContext?.recentHeadings.length
                ? previousContext.recentHeadings.map((h, i) => `   ${i + 1}. "${h}"`).join('\n')
                : '   None yet';

            batchInstruction = `Continue translating this document (batch ${batchIndex + 1}).

═══════════════════════════════════════════════════════════════════════════════
CONTEXT FROM PREVIOUS BATCHES
═══════════════════════════════════════════════════════════════════════════════

1. PROTECTED ENTITIES (keep in original language - proper nouns ONLY):
${entitiesList}

2. TERMINOLOGY CONSISTENCY (use these established translations):
${terminologyJson}

3. TRANSLATED HEADINGS SO FAR (these are ALREADY in ${config.targetLanguage} - for reference):
${headingsList}

4. Document Structure So Far: ${previousContext?.structureSummary || 'Starting document'}

═══════════════════════════════════════════════════════════════════════════════
BATCH RULES - MANDATORY
═══════════════════════════════════════════════════════════════════════════════

- TRANSLATE all new headings into ${config.targetLanguage} (do NOT leave in source language)
- USE the terminology map for consistency with previous batches
- PROTECT only the entities listed above (proper nouns)
- Do NOT re-translate content from previous batches
- Continue numbering/structure from where previous batch ended

Return a JSON object with:
1. "content": Array of translated content nodes for THIS BATCH ONLY
2. "context": Updated context object (add new entities, terms, headings found in this batch)`;
        }

        const textInstruction: VisionContent = {
            type: 'text' as const,
            text: batchInstruction,
        };

        try {
            // Build system prompt with progress reporting instruction
            const systemPrompt = buildVisionTranslationPrompt(config) + '\n\n' + PROGRESS_INSTRUCTION;

            // Use the new wrapper with progress tool support
            // Note: No max tokens - let the model complete the full translation
            // Uses AI_PRESETS.translation for centralized config management
            const result = await translateWithProgress(
                [...imageContent, textInstruction],
                {
                    model: modelName,
                    systemPrompt,
                    reasoningEffort: mapReasoningToOpenAI(preset.reasoning),
                    verbosity: mapVerbosityToOpenAI(preset.verbosity),
                    progressDebounceMs: 1000, // Debounce rapid updates
                },
                onProgress,
            );

            const { completionTokens, finishReason, promptTokens, text, tokensUsed, truncated } = result;

            // Check for truncation BEFORE parsing
            if (truncated) {
                logWarning('Response truncated - will attempt recovery', {
                    batchIndex,
                    finishReason,
                    tokensUsed,
                    contentLength: text?.length || 0,
                });
            }

            if (!text) {
                throw new Error('Empty response from vision model');
            }

            // Use JSON recovery for parsing (handles truncated responses)
            const recovery = parseWithRecovery(text);

            if (!recovery.success) {
                logError(
                    'JSON recovery failed completely',
                    new Error(`Failed to parse AI response: ${recovery.errorType}`),
                    {
                        batchIndex,
                        originalError: String(recovery.originalError),
                        truncated,
                    },
                );

                // Throw TruncationError if truncated, so retry logic can catch it
                if (truncated) {
                    throw new TruncationError(
                        `Batch ${batchIndex} response truncated and could not be recovered`,
                        text,
                        tokensUsed,
                    );
                }
                throw new Error(`Failed to parse AI response: ${recovery.errorType}`);
            }

            const parsed = recovery.data as import('zod').infer<typeof BatchTranslationResponseSchema>;

            // Log recovery status
            if (recovery.recovered) {
                logPhase('AI_RECOVERY', 'JSON recovered during parsing', {
                    batchIndex,
                    errorType: recovery.errorType,
                    extractedNodes: recovery.extractedNodes,
                    truncated,
                });
            }

            // Validate parsed response against schema
            const validationResult = validateAIResponseSafe(
                BatchTranslationResponseSchema,
                parsed,
                `batch-translation-${batchIndex}`,
            );

            if (!validationResult.success) {
                logWarning('Batch response failed schema validation', {
                    batchIndex,
                    error: validationResult.error.message,
                    hasContent: !!parsed?.content,
                });
                // Continue with the parsed data - sanitization will handle malformed nodes
            }

            // Validate and sanitize content nodes to prevent malformed types
            const sanitizedContent = sanitizeContentNodes(parsed.content || []);

            // Extract context for next batch
            const newContext: BatchContext = {
                entities: [...(previousContext?.entities || []), ...(parsed.context?.entities || [])].filter(
                    (v, i, a) => a.indexOf(v) === i,
                ), // Deduplicate
                terminology: {
                    ...(previousContext?.terminology || {}),
                    ...(parsed.context?.terminology || {}),
                },
                recentHeadings: parsed.context?.recentHeadings || previousContext?.recentHeadings || [],
                structureSummary: parsed.context?.structureSummary || previousContext?.structureSummary || '',
            };

            const batchProcessingMs = Date.now() - batchStartTime;

            // Build batch audit data
            const batchAudit: BatchAudit = {
                index: batchIndex,
                pages: Array.from({ length: pageImages.length }, (_, i) => i + 1), // Page numbers in this batch
                tokens_used: tokensUsed,
                tokens_prompt: promptTokens,
                tokens_completion: completionTokens,
                processing_ms: batchProcessingMs,
                finish_reason: finishReason || 'unknown',
                truncated,
            };

            return {
                content: sanitizedContent,
                context: newContext,
                tokensUsed,
                truncated,
                recovered: recovery.recovered,
                batchAudit,
            };
        } catch (error) {
            logError('Vision batch processing failed', error, { batchIndex });
            throw error;
        }
    }); // End of logger.trace block
}

/**
 * Retry configuration for batch processing.
 */
type BatchRetryConfig = {
    maxRetries: number;
    minBatchSize: number;
};

const DEFAULT_RETRY_CONFIG: BatchRetryConfig = {
    maxRetries: 3,
    minBatchSize: 1,
};

async function processPageBatchWithRetry(
    pageImages: string[],
    config: VisionTranslationConfig,
    batchIndex: number,
    previousContext?: BatchContext,
    onProgress?: (progress: AIProgressUpdate) => Promise<void>,
    retryConfig: BatchRetryConfig = DEFAULT_RETRY_CONFIG,
): Promise<BatchProcessResult> {
    let currentBatchSize = pageImages.length;
    let attempt = 0;
    let lastError: Error | null = null;
    let maxTokens = config.maxCompletionTokens || 16384;

    while (attempt < retryConfig.maxRetries) {
        attempt++;

        // Split the original pages into sub-batches if batch size was reduced
        const subBatches: string[][] = createBatches(pageImages, currentBatchSize);

        try {
            // Process all sub-batches and accumulate results
            const allContent: ContentNode[] = [];
            const allBatchAudits: BatchAudit[] = [];
            let context = previousContext;
            let totalTokens = 0;
            let totalPromptTokens = 0;
            let totalCompletionTokens = 0;
            let totalProcessingMs = 0;
            let anyTruncated = false;
            let anyRecovered = false;
            let lastFinishReason = 'unknown';

            for (let subIdx = 0; subIdx < subBatches.length; subIdx++) {
                const result = await processPageBatch(
                    subBatches[subIdx],
                    config,
                    batchIndex,
                    context,
                    onProgress,
                    maxTokens,
                );

                // If truncated but recovered, we can continue
                // But if truncated and content is empty, we need to retry smaller
                if (result.truncated && result.content.length === 0) {
                    throw new TruncationError(
                        `Sub-batch ${subIdx} truncated with no recoverable content`,
                        '',
                        result.tokensUsed,
                    );
                }

                allContent.push(...result.content);
                allBatchAudits.push(result.batchAudit);
                context = result.context;
                totalTokens += result.tokensUsed;
                totalPromptTokens += result.batchAudit.tokens_prompt;
                totalCompletionTokens += result.batchAudit.tokens_completion;
                totalProcessingMs += result.batchAudit.processing_ms;
                lastFinishReason = result.batchAudit.finish_reason;
                anyTruncated = anyTruncated || result.truncated;
                anyRecovered = anyRecovered || result.recovered;
            }

            // Success!
            if (anyTruncated || anyRecovered) {
                logPhase('AI_RECOVERY', 'Batch completed with recovery', {
                    batchIndex,
                    attempt,
                    totalContent: allContent.length,
                    anyTruncated,
                    anyRecovered,
                });
            }

            // Aggregate batch audit (combine sub-batches into single audit for this retry group)
            const aggregatedBatchAudit: BatchAudit = {
                index: batchIndex,
                pages: pageImages.map((_, i) => i + 1), // All pages in this batch group
                tokens_used: totalTokens,
                tokens_prompt: totalPromptTokens,
                tokens_completion: totalCompletionTokens,
                processing_ms: totalProcessingMs,
                finish_reason: lastFinishReason,
                truncated: anyTruncated,
            };

            return {
                content: allContent,
                context: context!,
                tokensUsed: totalTokens,
                truncated: anyTruncated,
                recovered: anyRecovered,
                batchAudit: aggregatedBatchAudit,
            };
        } catch (error) {
            lastError = error as Error;

            // Check if this is a truncation error that we should retry
            const shouldRetry = isTruncationError(error) || error instanceof TruncationError;

            if (!shouldRetry) {
                // Non-truncation error - don't retry
                throw error;
            }

            logWarning('Batch truncated, calculating retry parameters', {
                batchIndex,
                attempt,
                currentBatchSize,
                errorMessage: (error as Error).message,
            });

            // Calculate new batch size for retry
            const retryParams = calculateRetryBatchSize(currentBatchSize, attempt, retryConfig.minBatchSize);
            currentBatchSize = retryParams.newBatchSize;
            maxTokens = retryParams.maxTokens;

            // If batch size didn't change and we've already tried, give up
            if (currentBatchSize >= pageImages.length && attempt > 1) {
                logError('Cannot reduce batch size further', new Error('Batch size reduction failed'), {
                    batchIndex,
                    currentBatchSize,
                    pageImages: pageImages.length,
                });
                throw error;
            }

            logPhase('AI_RECOVERY', 'Retrying batch with reduced size', {
                batchIndex,
                nextAttempt: attempt + 1,
                newBatchSize: currentBatchSize,
                newMaxTokens: maxTokens,
            });
        }
    }

    // Exhausted all retries
    throw lastError || new Error(`Batch ${batchIndex} failed after ${retryConfig.maxRetries} retries`);
}

/**
 * Progress callback for tracking translation progress.
 * This integrates with your existing status tracking system.
 *
 * The callback receives either:
 * - Batch-level progress (stage, percent, batchIndex, totalBatches, message)
 * - AI-reported progress (stage, percent, dynamic_label, stage_message)
 */
export type ProgressCallback = (progress: {
    stage: 'converting' | 'translating' | 'finalizing';
    percent: number;
    batchIndex?: number;
    totalBatches?: number;
    message: string;
    /** Short label (2-3 words) for UI display - from AI progress tool */
    dynamic_label?: string;
    /** Longer description for tooltip - from AI progress tool */
    stage_message?: string;
}) => Promise<void>;

/**
 * Main entry point: Translates a document using vision-first approach.
 *
 * This is the LEGENDARY function that achieves document accuracy.
 *
 * KEY FEATURE: Context preservation across batches prevents:
 * - Hallucinations (AI making up content)
 * - Duplicates (same content translated twice)
 * - Inconsistencies (different translations for same term)
 *
 * @param documentImages - Array of base64-encoded page images (with data URI prefix)
 * @param config - Translation configuration
 * @param onProgress - Optional callback for progress updates (integrates with your status system)
 * @returns Complete translated document
 */
export async function translateDocumentWithVision(
    documentImages: string[],
    config: Partial<VisionTranslationConfig> = {},
    onProgress?: ProgressCallback,
): Promise<VisionTranslationResult> {
    const startTime = Date.now();
    const finalConfig: VisionTranslationConfig = { ...DEFAULT_CONFIG, ...config };

    logPhase('TRANSLATE', 'Starting vision-first document translation', {
        totalPages: documentImages.length,
        targetLanguage: finalConfig.targetLanguage,
        maxPagesPerBatch: finalConfig.maxPagesPerBatch,
        dynamicBatching: finalConfig.dynamicBatching,
    });

    // Report initial progress
    await onProgress?.({
        stage: 'converting',
        percent: 10,
        message: 'Preparing document for translation...',
    });

    // Calculate optimal batch size using dynamic sizing (if enabled)
    let effectiveBatchSize = finalConfig.maxPagesPerBatch;
    let batchSizeResult: BatchSizeResult | undefined;

    if (finalConfig.dynamicBatching !== false) {
        // Use dynamic batch sizing based on document complexity
        const inputTokensPerPage = finalConfig.estimatedInputTokensPerPage || 1275; // Default A4 at 150 DPI
        batchSizeResult = calculateConservativeBatchSize(
            documentImages.length,
            inputTokensPerPage,
            finalConfig.documentType as DocumentType,
        );

        // Use the smaller of configured max and calculated optimal
        effectiveBatchSize = Math.min(batchSizeResult.batchSize, finalConfig.maxPagesPerBatch);

        logPhase('TRANSLATE', 'Dynamic batch sizing applied', {
            staticMaxBatchSize: finalConfig.maxPagesPerBatch,
            calculatedOptimal: batchSizeResult.batchSize,
            effectiveBatchSize,
            complexity: batchSizeResult.complexity,
            confidence: batchSizeResult.confidence,
        });
    }

    // Split pages into batches using effective batch size
    const batches = createBatches(documentImages, effectiveBatchSize);

    logPhase('TRANSLATE', 'Document split into batches', {
        totalBatches: batches.length,
        effectiveBatchSize,
        dynamicBatching: finalConfig.dynamicBatching !== false,
    });

    // Process each batch WITH CONTEXT PRESERVATION
    const allContent: ContentNode[] = [];
    const allBatchAudits: BatchAudit[] = [];
    let totalTokens = 0;
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let anyTruncated = false;
    let lastFinishReason = 'unknown';

    // Track model and settings for audit
    const modelName = getModelForTask('translation');
    const preset = AI_PRESETS.translation;

    // Process batches SEQUENTIALLY to preserve context and allow accurate progress tracking
    // This is slower but much more reliable than parallel processing
    const totalBatches = batches.length;

    // Initial context scan logic would go here if we were doing the Hybrid approach.
    let currentContext: BatchContext | undefined = undefined;

    logger.info('[TRANSLATE] Starting sequential batch processing', {
        totalBatches,
        effectiveBatchSize,
    });

    await logger.trace('translate-document-batch-loop', async (loopSpan) => {
        loopSpan.setAttribute('batches.total', totalBatches);
        loopSpan.setAttribute('pages.effective_batch_size', effectiveBatchSize);

        for (let i = 0; i < totalBatches; i++) {
            const batchImages = batches[i];
            const batchId = `BATCH ${i + 1}/${totalBatches}`;
            const startBatchTime = performance.now();

            // Log with uppercase prefix as requested
            logPhase('TRANSLATE', `Batch ${batchId} / ${totalBatches} processing`, {
                pageCount: batchImages.length,
                hasPreviousContext: !!currentContext,
            });

            // Calculate global progress
            // Map 0-100% of this batch to a segment of the global 15-90% range
            const globalStart = 15;
            const globalRange = 75;
            const segmentSize = globalRange / totalBatches;
            const batchStartPercent = globalStart + i * segmentSize;

            const batchProgressCallback = onProgress
                ? async (aiProgress: AIProgressUpdate) => {
                      // Calculate strictly linear progress: Base + (BatchProgress * SegmentSize)
                      const currentBatchContribution = (aiProgress.percent / 100) * segmentSize;
                      const globalPercent = Math.round(batchStartPercent + currentBatchContribution);

                      // Only update if we have a new stage message or significant % change
                      if (aiProgress.percent % 10 === 0 || aiProgress.stage_message) {
                          await onProgress({
                              stage: 'translating',
                              percent: globalPercent,
                              batchIndex: i,
                              totalBatches: totalBatches,
                              message: `[${batchId}] ${aiProgress.stage_message || 'Translating...'}`,
                              dynamic_label: aiProgress.dynamic_label, // "Translating Header"
                              stage_message: aiProgress.stage_message,
                          });
                      }
                  }
                : undefined;

            try {
                // Process the batch - now waiting for it to finish before starting next
                const result = await processPageBatchWithRetry(
                    batchImages,
                    finalConfig,
                    i,
                    currentContext, // Pass context from PREVIOUS batch
                    batchProgressCallback,
                );

                // Update context for the NEXT batch
                // Logic: Merge new entities/terms into the growing context object
                currentContext = {
                    entities: [...new Set([...(currentContext?.entities || []), ...result.context.entities])],
                    terminology: { ...(currentContext?.terminology || {}), ...result.context.terminology },
                    recentHeadings: result.context.recentHeadings,
                    structureSummary: result.context.structureSummary,
                };

                const duration = ((performance.now() - startBatchTime) / 1000).toFixed(1);

                logPhase('TRANSLATE', `Batch ${batchId} Completed successfully`, {
                    duration: `${duration}s`,
                    tokens: result.tokensUsed,
                    nodes: result.content.length,
                    contextSize: currentContext.entities.length,
                });

                // Store results
                allContent.push(...result.content);
                allBatchAudits.push(result.batchAudit);
                totalTokens += result.tokensUsed;
                totalPromptTokens += result.batchAudit.tokens_prompt;
                totalCompletionTokens += result.batchAudit.tokens_completion;
                anyTruncated = anyTruncated || result.truncated;
                lastFinishReason = result.batchAudit.finish_reason;

                // Add spacer between batches (except for the last one)
                if (i < totalBatches - 1) {
                    allContent.push({
                        type: 'spacer',
                        attrs: { height: 48 },
                    } as ContentNode);
                }
            } catch (error) {
                const duration = ((performance.now() - startBatchTime) / 1000).toFixed(1);
                logError(`Batch ${batchId} FAILED`, error, { duration: `${duration}s` });
                // Propagate error up to trigger task retry logic
                // Since we are sequential, a failure here stops the chain, which is safer
                throw error;
            }
        }
    });

    // Final context for audit is the state after the last batch
    // We cast to bypass TS 'never' inference issue due to closure modification
    const finalContext = currentContext as BatchContext | undefined;
    const batchContext = finalContext;

    await onProgress?.({
        stage: 'finalizing',
        percent: 95,
        message: 'Finalizing translation...',
    });

    const processingTime = Date.now() - startTime;

    // Build complete translation stage audit
    const translationAudit: TranslationStageAudit = {
        model: modelName,
        reasoning_effort: mapReasoningToOpenAI(preset.reasoning),
        verbosity: mapVerbosityToOpenAI(preset.verbosity),
        image_detail: 'high', // We always use high detail for documents
        tokens_prompt: totalPromptTokens,
        tokens_completion: totalCompletionTokens,
        tokens_total: totalTokens,
        processing_ms: processingTime,
        finish_reason: lastFinishReason,
        truncated: anyTruncated,
        batch_count: batches.length,
        batches: allBatchAudits,
        confidence: 0.95, // High confidence for vision-based approach
        detected_language: finalConfig.sourceLanguage || 'auto',
        entities_protected: batchContext?.entities || [],
        warnings: anyTruncated ? ['One or more batches were truncated but recovered'] : [],
    };

    const result: VisionTranslationResult = {
        translatedDocument: {
            type: 'doc',
            content: allContent,
            documentType: finalConfig.documentType || 'document',
            detectedLanguages: [], // Would be populated from first batch response
            translatedLanguage: finalConfig.targetLanguage,
            direction: getTextDirection(finalConfig.targetLanguage),
        },
        detectedLanguage: finalConfig.sourceLanguage || 'auto',
        confidence: 0.95, // High confidence for vision-based approach
        metadata: {
            totalPages: documentImages.length,
            batchesProcessed: batches.length,
            tokensUsed: totalTokens,
            processingTimeMs: processingTime,
            // Include final context for debugging/auditing
            finalContext: batchContext,
        },
        audit: translationAudit,
    };

    await onProgress?.({
        stage: 'finalizing',
        percent: 100,
        message: 'Translation complete!',
    });

    logPhase('TRANSLATE', 'Vision-first translation complete', {
        totalPages: documentImages.length,
        contentNodes: allContent.length,
        processingTimeMs: processingTime,
        totalTokens,
        promptTokens: totalPromptTokens,
        completionTokens: totalCompletionTokens,
        batchCount: batches.length,
        entitiesProtected: batchContext?.entities?.length || 0,
        terminologyConsistency: Object.keys(batchContext?.terminology || {}).length,
    });

    return result;
}

/**
 * Convenience function for single-image documents (certificates, single-page docs).
 */
export async function translateSinglePageDocument(
    imageBase64: string,
    targetLanguage: string,
    documentType?: VisionTranslationConfig['documentType'],
): Promise<VisionTranslationResult> {
    return translateDocumentWithVision([imageBase64], {
        targetLanguage,
        documentType,
        maxPagesPerBatch: 1,
    });
}

/**
 * Factory function to create a configured translator instance.
 */
export function createVisionTranslator(config: Partial<VisionTranslationConfig> = {}) {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };

    return {
        translate: (images: string[]) => translateDocumentWithVision(images, finalConfig),
        translateSinglePage: (image: string) =>
            translateSinglePageDocument(image, finalConfig.targetLanguage, finalConfig.documentType),
        config: finalConfig,
    };
}
