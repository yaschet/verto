/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { logger } from '@trigger.dev/sdk';
import { AI_PRESETS, type OutputVerbosity, type ReasoningLevel } from '@/utils/ai/ai-config';
import { isTruncationError, parseWithRecovery } from '@/engine/translation/json-recovery';
import {
    type AIProgressUpdate,
    PROGRESS_INSTRUCTION,
    type VisionContent,
    translateWithProgress,
} from '@/utils/ai/openai-responses-client';
import { getModelForTask } from '@/utils/ai/providers/openai-adapter';
import { validateAIResponseSafe } from '@/utils/ai/schema-validation';
import { QABatchResponseSchema } from '@schemas/verification-schemas';
import type { BatchAudit, QAIssueBreakdown, QAStageAudit } from '@/types/ai-audit';
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
    // QA uses 'gpt-5-mini' which doesn't support 'minimal' or 'none'
    if (reasoning === 'minimal') return 'low';
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

/**
 * Configuration for the QA pass
 */
export type QAConfig = {
    /** Maximum pages to process in a single QA batch */
    maxPagesPerBatch: number;
    /** Target language (for context) */
    targetLanguage: string;
    /** Focus areas for QA */
    focusAreas: QAFocusArea[];
};

export type QAFocusArea =
    | 'alignment' // Text alignment (left, center, right, justify)
    | 'tables' // Table structure, colspan, rowspan, cell alignment
    | 'headings' // Heading levels and centering
    | 'formatting' // Bold, italic, underline consistency
    | 'spacing' // Paragraph and section spacing
    | 'translation' // Translation accuracy and consistency
    | 'entities' // Proper noun protection verification
    | 'all'; // All of the above

const DEFAULT_CONFIG: QAConfig = {
    maxPagesPerBatch: 5,
    targetLanguage: 'fr',
    focusAreas: ['all'],
};

/**
 * Result of the QA pass
 */
export type QAResult = {
    /** The polished document */
    polishedDocument: NormalisedDocument;
    /** Issues found and fixed */
    issuesFixed: QAIssue[];
    /** Confidence score (0-1) */
    confidence: number;
    /** Processing metadata */
    metadata: {
        tokensUsed: number;
        processingTimeMs: number;
        batchesProcessed: number;
    };
    /** AI audit data for comprehensive logging */
    audit: QAStageAudit;
};

export type QAIssue = {
    type: 'alignment' | 'table' | 'heading' | 'formatting' | 'spacing' | 'translation' | 'entity';
    description: string;
    location: string;
    originalValue?: string;
    fixedValue?: string;
};

/**
 * Builds the QA prompt that instructs the AI to compare and fix.
 *
 * KEY INSIGHT: The AI receives BOTH the original images AND the translated JSON.
 * It compares them and fixes the JSON to match the original's layout.
 */
function buildQAPrompt(config: QAConfig): string {
    const focusInstructions = config.focusAreas.includes('all')
        ? `
CHECK AND FIX ALL OF THE FOLLOWING:
1. TEXT ALIGNMENT - Match the original document exactly:
   - If a heading was centered in the original → set textAlign: "center"
   - If a date was right-aligned → set textAlign: "right"
   - If text was justified → set textAlign: "justify"

2. TABLE STRUCTURE - Preserve the original table layout:
   - Correct colspan/rowspan to match original merged cells
   - Fix cell alignment (some cells may be centered, others left-aligned)
   - Preserve header row formatting
   - Fix indentation within cells

3. HEADING HIERARCHY - Match the original document:
   - Main titles should be level 1, centered if they were centered
   - Section headers should be level 2
   - Subsections should be level 3

4. FORMATTING MARKS - Preserve visual emphasis:
   - Bold text should remain bold
   - Italic text should remain italic
   - Underlined text should remain underlined

5. SPACING - Match the original document's visual rhythm:
   - Section breaks should have appropriate spacer heights
   - Paragraph spacing should feel natural

6. TRANSLATION QUALITY - Fix errors WITHOUT changing language:
   - Fix awkward phrasing (keep in ${config.targetLanguage})
   - Fix terminology inconsistencies (keep in ${config.targetLanguage})
   - NOTE: Content is already in ${config.targetLanguage} - do NOT translate back to source
   - Only proper nouns (names, addresses, company names) should remain in original language

7. ENTITY PROTECTION - Verify proper nouns are preserved:
   - Names should NOT be translated
   - Company names should NOT be translated
   - Addresses should NOT be translated`
        : config.focusAreas
              .map((area) => {
                  switch (area) {
                      case 'alignment':
                          return 'TEXT ALIGNMENT - Match original alignment (left, center, right, justify)';
                      case 'tables':
                          return 'TABLE STRUCTURE - Fix colspan, rowspan, cell alignment to match original';
                      case 'headings':
                          return 'HEADING HIERARCHY - Fix levels and centering to match original';
                      case 'formatting':
                          return 'FORMATTING MARKS - Preserve bold, italic, underline from original';
                      case 'spacing':
                          return 'SPACING - Match original document visual rhythm';
                      case 'translation':
                          return 'TRANSLATION QUALITY - Fix errors, untranslated words, awkward phrasing';
                      case 'entities':
                          return 'ENTITY PROTECTION - Verify proper nouns are NOT translated';
                      default:
                          return '';
                  }
              })
              .filter(Boolean)
              .join('\n');

    return `You are a SENIOR DOCUMENT QUALITY ASSURANCE SPECIALIST with 25+ years of experience in certified document translation.

YOUR MISSION: Polish and perfect a translated document by comparing it to the ORIGINAL for LAYOUT ONLY.

═══════════════════════════════════════════════════════════════════════════════
LANGUAGE PRESERVATION - READ THIS FIRST
═══════════════════════════════════════════════════════════════════════════════

The content you receive is ALREADY TRANSLATED into ${config.targetLanguage}.
You MUST preserve this translation. Your job is FORMATTING, not translation.
NEVER translate content back to the source language.
NEVER change the language of ANY text.

═══════════════════════════════════════════════════════════════════════════════

You will receive:
1. ORIGINAL DOCUMENT IMAGES - The source document (for LAYOUT reference only, NOT for language)
2. TRANSLATED JSON - Already translated to ${config.targetLanguage}, needs formatting polish

YOUR TASK: Look at the ORIGINAL images and FIX the translated JSON's FORMATTING to match:
- Layout and alignment
- Table structure
- Heading positioning
- Visual formatting

DO NOT change the language. ALL content must remain in ${config.targetLanguage}.

${focusInstructions}

═══════════════════════════════════════════════════════════════════════════════
CRITICAL RULES
═══════════════════════════════════════════════════════════════════════════════

1. DO NOT re-translate content - only fix formatting and layout
2. PRESERVE all entity protection (names, addresses, company names must stay in original language)
3. MATCH the original document's visual layout as closely as possible
4. Return ONLY valid ProseMirror JSON
5. LANGUAGE PRESERVATION - CRITICAL:
   - The translated content is already in ${config.targetLanguage} - KEEP IT THAT WAY
   - NEVER translate content back to the source language
   - Even if the original images are in a different language, keep ALL content in ${config.targetLanguage}

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════

Return a JSON object with:
{
  "polishedContent": [...], // The fixed content array
  "issuesFixed": [
    {
      "type": "alignment" | "table" | "heading" | "formatting" | "spacing" | "translation" | "entity",
      "description": "What was fixed",
      "location": "Where in the document",
      "originalValue": "What it was",
      "fixedValue": "What it is now"
    }
  ],
  "confidence": 0.95 // Your confidence in the polish quality (0-1)
}

═══════════════════════════════════════════════════════════════════════════════
ALIGNMENT REFERENCE
═══════════════════════════════════════════════════════════════════════════════

For headings and paragraphs, use these textAlign values:
- "left" - Default, left-aligned text
- "center" - Centered text (common for main titles)
- "right" - Right-aligned text (common for dates, signatures)
- "justify" - Justified text (common for body paragraphs in formal documents)

═══════════════════════════════════════════════════════════════════════════════
TABLE STRUCTURE - CRITICAL VERIFICATION RULES
═══════════════════════════════════════════════════════════════════════════════

Tables are the #1 source of errors. VERIFY CAREFULLY by comparing to source images.

STEP 1: COUNT COLUMNS IN THE ORIGINAL IMAGE
- Look at the header row(s) in the source image
- Count the total number of distinct columns (including merged cells)
- This is the EXPECTED column count for the entire table

STEP 2: VERIFY EVERY ROW HAS CORRECT CELL COUNT
- For each row: sum of all (colspan values) must equal EXPECTED column count
- If a cell from previous row has rowspan > 1, that column is OCCUPIED
- Occupied columns DO NOT need a cell in the current row

STEP 3: MATCH MERGED CELLS TO SOURCE IMAGE
- Look at each merged cell in the original image
- If a header spans 2 columns visually → set colspan: 2
- If a category spans 3 rows visually → set rowspan: 3
- DO NOT guess - verify against the actual source image

RULE: ALWAYS INCLUDE attrs ON TABLE CELLS
- Every tableCell and tableHeader MUST have "attrs" with:
  { "colspan": 1, "rowspan": 1, "textAlign": "left", "colwidth": null }
- For merged cells: increase colspan/rowspan to match visual span

EXAMPLE - VALID TABLE ROW:
If original has 4 columns and first cell spans 2 columns:
Row should have 3 cells: [colspan=2] + [colspan=1] + [colspan=1] = 4 ✓

EXAMPLE - INVALID TABLE ROW (DO NOT OUTPUT):
Row with cells: [colspan=1] + [colspan=1] + [colspan=1] = 3 ✗ (missing column!)

EXAMPLE - CORRECT TABLE CELL:
{
  "type": "tableCell",
  "attrs": { "colspan": 1, "rowspan": 1, "textAlign": "center", "colwidth": null },
  "content": [{ "type": "paragraph", "attrs": { "textAlign": "center" }, "content": [{ "type": "text", "text": "Value" }] }]
}

EXAMPLE - WRONG (missing attrs):
{
  "type": "tableCell",
  "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Value" }] }]
}

IF TABLE IS MALFORMED:
- Count columns in the source image header
- Verify each row's cells sum to that count
- Fix colspan/rowspan to match visual structure
- Add missing cells if needed (empty cells are valid)
- Report in issuesFixed with type: "table"

═══════════════════════════════════════════════════════════════════════════════
QUALITY STANDARD
═══════════════════════════════════════════════════════════════════════════════

The polished document should be INDISTINGUISHABLE from a human-certified translation.
A professional translator reviewing your output should find ZERO formatting errors.`;
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

    if (!node.type || typeof node.type !== 'string') {
        logger.warn('Rejecting node without valid type', { node });
        return null;
    }

    const nodeType = node.type.trim();

    if (nodeType.length === 0 || /^[\s:;,.\-_]+$/.test(nodeType)) {
        logger.warn('Rejecting malformed node type', { type: node.type });
        return null;
    }

    if (!VALID_NODE_TYPES.has(nodeType)) {
        logger.warn('Rejecting unknown node type', { type: nodeType });
        return null;
    }

    if (nodeType === 'text') {
        if (!node.text || typeof node.text !== 'string' || node.text.length === 0) {
            return null;
        }
        return {
            type: 'text',
            text: node.text,
            marks: Array.isArray(node.marks) ? node.marks : [],
        } as unknown as ContentNode;
    }

    if (node.content && Array.isArray(node.content)) {
        const sanitizedContent = node.content
            .map((child: unknown) => sanitizeNode(child))
            .filter((child: unknown) => child !== null);

        if (sanitizedContent.length === 0 && !['spacer', 'keyValuePair', 'hardBreak'].includes(nodeType)) {
            return null;
        }

        return {
            ...node,
            type: nodeType,
            content: sanitizedContent,
        } as unknown as ContentNode;
    }

    return {
        ...node,
        type: nodeType,
    } as unknown as ContentNode;
}

async function processQABatch(
    originalImages: string[],
    translatedContent: ContentNode[],
    config: QAConfig,
    batchIndex: number,
    onProgress?: (update: AIProgressUpdate) => Promise<void>,
): Promise<{
    content: ContentNode[];
    issues: QAIssue[];
    tokensUsed: number;
    confidence: number;
    batchAudit: BatchAudit;
}> {
    const batchStartTime = Date.now();

    // Get model and reasoning from centralized AI_PRESETS
    const modelName = getModelForTask('qa');
    const preset = AI_PRESETS.qa;

    return await logger.trace('QA Batch Processing', async (span) => {
        span.setAttribute('batch.index', batchIndex);
        span.setAttribute('batch.pages', originalImages.length);
        span.setAttribute('batch.model', modelName);
        span.setAttribute('batch.reasoning', preset.reasoning);

        logger.info(
            '[QA] Processing batch | batch=' +
                (batchIndex + 1) +
                ', pages=' +
                originalImages.length +
                ', contentNodes=' +
                translatedContent.length +
                ', model=' +
                modelName +
                ', reasoning=' +
                preset.reasoning,
        );

        // Build vision content for the wrapper
        const visionContent: VisionContent[] = [
            // Original images first
            ...originalImages.map((imageBase64) => ({
                type: 'image_url' as const,
                image_url: {
                    url: imageBase64,
                    detail: 'high' as const,
                },
            })),
            // Then the polishing instruction
            {
                type: 'text' as const,
                text: `ORIGINAL DOCUMENT IMAGES: See the ${originalImages.length} image(s) above.

TRANSLATED CONTENT TO POLISH:
\`\`\`json
${JSON.stringify(translatedContent, null, 2)}
\`\`\`

Compare the translated content to the original images and fix any formatting, alignment, or layout issues to match the original document's appearance.`,
            },
        ];

        // System prompt with progress instruction appended
        const systemPrompt = `${buildQAPrompt(config)}

${PROGRESS_INSTRUCTION}`;

        try {
            // Uses AI_PRESETS.qa for centralized config management
            const { completionTokens, finishReason, promptTokens, text, tokensUsed, truncated } =
                await translateWithProgress(
                    visionContent,
                    {
                        model: modelName,
                        reasoningEffort: mapReasoningToOpenAI(preset.reasoning),
                        verbosity: mapVerbosityToOpenAI(preset.verbosity),
                        systemPrompt,
                    },
                    onProgress,
                );

            // Log truncation warning if detected
            if (truncated) {
                logger.warn('[QA] Response truncated - attempting recovery', {
                    batchIndex,
                    finishReason,
                    tokensUsed,
                    contentLength: text?.length || 0,
                });
            }

            // Use JSON recovery for parsing (handles truncated responses)
            const recovery = parseWithRecovery(text);

            if (!recovery.success) {
                logger.error('[QA] JSON recovery failed', {
                    batchIndex,
                    errorType: recovery.errorType,
                    truncated,
                });
                const batchProcessingMs = Date.now() - batchStartTime;

                return {
                    content: translatedContent,
                    issues: [],
                    tokensUsed,
                    confidence: 0.5,
                    batchAudit: {
                        index: batchIndex,
                        pages: Array.from({ length: originalImages.length }, (_, i) => i + 1),
                        tokens_used: tokensUsed,
                        tokens_prompt: promptTokens,
                        tokens_completion: completionTokens,
                        processing_ms: batchProcessingMs,
                        finish_reason: finishReason || 'parse_failed',
                        truncated,
                    },
                };
            }

            const parsed = recovery.data as Omit<
                import('zod').infer<typeof QABatchResponseSchema>,
                'issuesFixed'
            > & { content?: ContentNode[]; issuesFixed?: QAIssue[] };

            // Log recovery status
            if (recovery.recovered) {
                logger.info('[QA] JSON recovered during parsing', {
                    batchIndex,
                    errorType: recovery.errorType,
                    extractedNodes: recovery.extractedNodes,
                });
            }

            // Validate parsed response against schema
            const validationResult = validateAIResponseSafe(
                QABatchResponseSchema,
                parsed,
                `qa-batch-${batchIndex}`,
            );

            if (!validationResult.success) {
                logger.warn('[QA] Batch response failed schema validation', {
                    batchIndex,
                    error: validationResult.error.message,
                    hasPolishedContent: !!parsed?.polishedContent,
                });
                // Continue with the parsed data - sanitization will handle malformed nodes
            }

            // Sanitize the polished content (AI returns 'polishedContent' or 'content' during recovery)
            const rawContent = parsed.polishedContent || parsed.content || translatedContent;
            const sanitizedContent = sanitizeContentNodes(rawContent);

            const batchProcessingMs = Date.now() - batchStartTime;

            // Build batch audit data
            const batchAudit: BatchAudit = {
                index: batchIndex,
                pages: Array.from({ length: originalImages.length }, (_, i) => i + 1),
                tokens_used: tokensUsed,
                tokens_prompt: promptTokens,
                tokens_completion: completionTokens,
                processing_ms: batchProcessingMs,
                finish_reason: finishReason || 'unknown',
                truncated,
            };

            logger.info(
                '[QA] Batch success | batch=' +
                    (batchIndex + 1) +
                    ', fixes=' +
                    (parsed.issuesFixed?.length || 0) +
                    ', tokens=' +
                    (tokensUsed / 1000).toFixed(1) +
                    'K, confidence=' +
                    ((parsed.confidence || 0.9) * 100).toFixed(0) +
                    '%',
            );

            return {
                content: sanitizedContent,
                issues: parsed.issuesFixed || [],
                tokensUsed,
                confidence: parsed.confidence || 0.9,
                batchAudit,
            };
        } catch (error) {
            // Check if truncation-related error for logging
            const wasTruncation = isTruncationError(error);
            const batchProcessingMs = Date.now() - batchStartTime;
            logger.error('[QA] Batch failed | error=' + (error as Error).message, {
                batchIndex,
                wasTruncation,
                processingMs: batchProcessingMs,
            });

            return {
                content: translatedContent,
                issues: [],
                tokensUsed: 0,
                confidence: 0.5,
                batchAudit: {
                    index: batchIndex,
                    pages: Array.from({ length: originalImages.length }, (_, i) => i + 1),
                    tokens_used: 0,
                    tokens_prompt: 0,
                    tokens_completion: 0,
                    processing_ms: batchProcessingMs,
                    finish_reason: 'error',
                    truncated: wasTruncation,
                },
            };
        }
    });
}

export type QAProgressCallback = (progress: {
    stage: 'preparing' | 'polishing' | 'finalizing';
    percent: number;
    batchIndex?: number;
    totalBatches?: number;
    message: string;
    /** AI-reported short label (2-3 words) for UI display */
    dynamic_label?: string;
    /** AI-reported longer description for tooltip */
    stage_message?: string;
}) => Promise<void>;

/**
 * Main entry point: Polishes a translated document by comparing to original.
 *
 * This is the QUALITY ASSURANCE pass that makes translations "beautiful."
 *
 * @param originalImages - Original document page images (for visual comparison)
 * @param translatedDocument - The translated document from the vision translator
 * @param config - QA configuration
 * @param onProgress - Progress callback
 */
export async function polishTranslatedDocument(
    originalImages: string[],
    translatedDocument: NormalisedDocument,
    config: Partial<QAConfig> = {},
    onProgress?: QAProgressCallback,
): Promise<QAResult> {
    const startTime = Date.now();
    const finalConfig: QAConfig = { ...DEFAULT_CONFIG, ...config };

    logger.info('Starting QA polish pass', {
        totalPages: originalImages.length,
        contentNodes: translatedDocument.content.length,
        focusAreas: finalConfig.focusAreas,
    });

    await onProgress?.({
        stage: 'preparing',
        percent: 5,
        message: 'Preparing quality assurance pass...',
    });

    // Split into batches (matching the original page batches)
    const pagesPerBatch = finalConfig.maxPagesPerBatch;
    const batches: { images: string[]; startIdx: number; endIdx: number }[] = [];

    for (let i = 0; i < originalImages.length; i += pagesPerBatch) {
        batches.push({
            images: originalImages.slice(i, i + pagesPerBatch),
            startIdx: i,
            endIdx: Math.min(i + pagesPerBatch, originalImages.length),
        });
    }

    // Estimate content distribution per batch
    // This is approximate - we assume content is roughly evenly distributed
    const contentPerPage = Math.ceil(translatedDocument.content.length / originalImages.length);

    const allPolishedContent: ContentNode[] = [];
    const allIssues: QAIssue[] = [];
    const allBatchAudits: BatchAudit[] = [];
    let totalTokens = 0;
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let anyTruncated = false;
    let lastFinishReason = 'unknown';
    let totalConfidence = 0;

    // Track model and settings for audit
    const modelName = getModelForTask('qa');
    const preset = AI_PRESETS.qa;

    for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];

        // Calculate the progress range for this batch within the polishing phase (10-90%)
        const batchStartProgress = 10 + Math.round((i / batches.length) * 80);
        const batchEndProgress = 10 + Math.round(((i + 1) / batches.length) * 80);

        // IMPORTANT: batchIndex is 0-indexed - task callback adds +1 for display/calculation
        await onProgress?.({
            stage: 'polishing',
            percent: batchStartProgress,
            batchIndex: i, // 0-indexed
            totalBatches: batches.length,
            message: `Polishing batch ${i + 1} of ${batches.length}...`,
        });

        // Extract content for this batch (approximate)
        const startContentIdx = batch.startIdx * contentPerPage;
        const endContentIdx = Math.min(batch.endIdx * contentPerPage, translatedDocument.content.length);
        const batchContent = translatedDocument.content.slice(startContentIdx, endContentIdx);

        // If this is the last batch, include any remaining content
        const contentToProcess =
            i === batches.length - 1 ? translatedDocument.content.slice(startContentIdx) : batchContent;

        // Create AI progress callback that scales 0-100 to batch's range and passes through dynamic labels
        const aiProgressCallback = onProgress
            ? async (aiProgress: AIProgressUpdate) => {
                  // Scale AI's 0-100% progress to this batch's range
                  const scaledPercent =
                      batchStartProgress +
                      Math.round((aiProgress.percent / 100) * (batchEndProgress - batchStartProgress));

                  await onProgress({
                      stage: 'polishing',
                      percent: scaledPercent,
                      batchIndex: i, // 0-indexed, task callback adds +1
                      totalBatches: batches.length,
                      message: aiProgress.stage_message || `Polishing batch ${i + 1}...`,
                      dynamic_label: aiProgress.dynamic_label,
                      stage_message: aiProgress.stage_message,
                  });
              }
            : undefined;

        const batchResult = await processQABatch(
            batch.images,
            contentToProcess,
            finalConfig,
            i,
            aiProgressCallback,
        );

        allPolishedContent.push(...batchResult.content);
        allIssues.push(...batchResult.issues);
        allBatchAudits.push(batchResult.batchAudit);
        totalTokens += batchResult.tokensUsed;
        totalPromptTokens += batchResult.batchAudit.tokens_prompt;
        totalCompletionTokens += batchResult.batchAudit.tokens_completion;
        anyTruncated = anyTruncated || batchResult.batchAudit.truncated;
        lastFinishReason = batchResult.batchAudit.finish_reason;
        totalConfidence += batchResult.confidence;

        logger.info('QA batch completed', {
            batchIndex: i,
            issuesFixed: batchResult.issues.length,
            tokensUsed: batchResult.tokensUsed,
            promptTokens: batchResult.batchAudit.tokens_prompt,
            completionTokens: batchResult.batchAudit.tokens_completion,
            processingMs: batchResult.batchAudit.processing_ms,
            confidence: batchResult.confidence,
        });
    }

    await onProgress?.({
        stage: 'finalizing',
        percent: 95,
        message: 'Finalizing polished document...',
    });

    const processingTime = Date.now() - startTime;
    const avgConfidence = batches.length > 0 ? totalConfidence / batches.length : 0.9;

    // Build issue breakdown for audit
    const issueBreakdown: QAIssueBreakdown = {
        alignment: allIssues.filter((i) => i.type === 'alignment').length,
        table: allIssues.filter((i) => i.type === 'table').length,
        heading: allIssues.filter((i) => i.type === 'heading').length,
        formatting: allIssues.filter((i) => i.type === 'formatting').length,
        spacing: allIssues.filter((i) => i.type === 'spacing').length,
        translation: allIssues.filter((i) => i.type === 'translation').length,
        entity: allIssues.filter((i) => i.type === 'entity').length,
    };

    // Build complete QA stage audit
    const qaAudit: QAStageAudit = {
        model: modelName,
        reasoning_effort: mapReasoningToOpenAI(preset.reasoning),
        verbosity: mapVerbosityToOpenAI(preset.verbosity),
        tokens_prompt: totalPromptTokens,
        tokens_completion: totalCompletionTokens,
        tokens_total: totalTokens,
        processing_ms: processingTime,
        finish_reason: lastFinishReason,
        truncated: anyTruncated,
        batch_count: batches.length,
        batches: allBatchAudits,
        issues_fixed: allIssues.length,
        issue_breakdown: issueBreakdown,
        confidence: avgConfidence,
        warnings: anyTruncated ? ['One or more batches were truncated but recovered'] : [],
    };

    const result: QAResult = {
        polishedDocument: {
            ...translatedDocument,
            content: allPolishedContent,
        },
        issuesFixed: allIssues,
        confidence: avgConfidence,
        metadata: {
            tokensUsed: totalTokens,
            processingTimeMs: processingTime,
            batchesProcessed: batches.length,
        },
        audit: qaAudit,
    };

    await onProgress?.({
        stage: 'finalizing',
        percent: 100,
        message: 'Quality assurance complete!',
    });

    logger.info('QA polish pass complete', {
        totalIssuesFixed: allIssues.length,
        tokensUsed: totalTokens,
        promptTokens: totalPromptTokens,
        completionTokens: totalCompletionTokens,
        processingTimeMs: processingTime,
        batchCount: batches.length,
        avgConfidence,
        issueBreakdown,
    });

    return result;
}

/**
 * Quick polish for single-page documents.
 */
export async function polishSinglePageDocument(
    originalImage: string,
    translatedDocument: NormalisedDocument,
    targetLanguage: string,
): Promise<QAResult> {
    return polishTranslatedDocument([originalImage], translatedDocument, {
        targetLanguage,
        maxPagesPerBatch: 1,
        focusAreas: ['all'],
    });
}

/**
 * Factory function to create a configured QA instance.
 */
export function createDocumentQA(config: Partial<QAConfig> = {}) {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };

    return {
        polish: (originalImages: string[], translatedDoc: NormalisedDocument) =>
            polishTranslatedDocument(originalImages, translatedDoc, finalConfig),
        polishSinglePage: (originalImage: string, translatedDoc: NormalisedDocument) =>
            polishSinglePageDocument(originalImage, translatedDoc, finalConfig.targetLanguage),
        config: finalConfig,
    };
}
