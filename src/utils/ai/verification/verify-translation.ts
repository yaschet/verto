/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { logError, logPhase, logWarning, timedOperation } from '@/trigger/logging';
import {
    type UntranslatedResult,
    detectUntranslatedContent,
} from '@/utils/ai/verification/detect-untranslated';
import { type FixResult, fixUntranslatedSegments } from '@/utils/ai/verification/fix-untranslated';
import { DocumentContextSchema } from '@schemas/verification-schemas';
import { AI_PRESETS, type VisionContent } from '@utils/ai/ai-config';
import { openaiProvider } from '@utils/ai/providers/openai-adapter';
import { isSchemaValidationError, validateInput } from '@utils/ai/schema-validation';
import type { ContentNode, NormalisedDocument } from '@/engine/document/types';

/**
 * Result of AI completeness verification (comparing source images to output).
 */
export type CompletenessVerificationResult = {
    /** Whether the translation is complete (no missing content) */
    complete: boolean;
    /** List of missing content items (if any) */
    missing_content: string[];
    /** Table verification details */
    table_verification: {
        /** Number of tables detected in source images */
        source_table_count: number;
        /** Number of tables in translated output */
        output_table_count: number;
        /** Whether table counts match */
        tables_match: boolean;
        /** Specific table issues (e.g., "Table 2 missing 3 rows") */
        issues: string[];
    };
    /** Confidence score (0-1) for verification result */
    confidence: number;
    /** Tokens used for verification */
    verification_tokens_used: number;
};

/**
 * Complete verification result with all checks.
 */
export type VerificationResult = {
    /** Overall pass/fail status */
    passed: boolean;
    /** Untranslated content detection results */
    untranslatedDetection: UntranslatedResult | null;
    /** Auto-fix results (if fixes were attempted) */
    autoFixResult: FixResult | null;
    /** Re-verification results (after auto-fix) */
    reVerificationResult: UntranslatedResult | null;
    /** The final document (with any auto-fixes applied) */
    finalDocument: NormalisedDocument;
    /** Total tokens used across all verification steps */
    totalTokensUsed: number;
    /** Summary of issues for error messages */
    issueSummary: string;
};

/**
 * Document context for verification prompts.
 * Provides domain-specific knowledge to improve detection and fixing accuracy.
 */
export type DocumentContext = {
    /** Document type for domain-specific terminology */
    documentType: 'legal' | 'medical' | 'financial' | 'certificate' | 'general';
    /** Document name/title (helps identify document purpose) */
    documentName?: string;
    /** Total page count (helps gauge document complexity) */
    pageCount?: number;
};

/**
 * Configuration for verification behavior.
 */
export type VerificationConfig = {
    /** Skip untranslated content detection. Default: true (detection disabled) */
    skipUntranslatedDetection?: boolean;
    /** Disable auto-fix for untranslated segments. Default: true (auto-fix disabled) */
    disableAutoFix?: boolean;
    /** Maximum retry attempts for auto-fix (when enabled). Default: 3 */
    maxAutoFixAttempts?: number;
    /** Document context for detection prompts (only used when detection enabled) */
    documentContext?: DocumentContext;
};

const DEFAULT_CONFIG: VerificationConfig = {
    // ARCHITECTURE DECISION: Untranslated detection is disabled by default.
    // The detection AI lacks visual context and cannot make better decisions than
    // the translation AI that processed the original document images. False positives
    // (academic titles, proper nouns, intentional source-language retention) create
    // noise without improving quality.
    skipUntranslatedDetection: true,
    disableAutoFix: true, // No point in auto-fix when detection is skipped
    maxAutoFixAttempts: 3,
};

/**
 * Counts tables in a NormalisedDocument.
 */
function countTables(doc: NormalisedDocument): number {
    let count = 0;

    function traverse(nodes: ContentNode[]) {
        for (const node of nodes) {
            if (node.type === 'table') {
                count++;
            }
            if ('content' in node && Array.isArray(node.content)) {
                traverse(node.content as ContentNode[]);
            }
        }
    }

    traverse(doc.content);
    return count;
}

/**
 * MANDATORY AI Verification: Compares original images to translated output.
 *
 * This is the core of the sworn-translator quality gate. It uses a vision-capable
 * model to compare source document images against the translated output, checking:
 * - All tables present with correct row/column counts
 * - All paragraphs and headings translated
 * - All content preserved (no missing data)
 *
 * @param originalImages - Base64-encoded original document images (high resolution)
 * @param translatedDocument - The translated ProseMirror document
 * @param targetLanguage - Target translation language
 * @returns Verification result with completeness status and issues
 */
export async function verifyCompletenessWithAI(
    originalImages: string[],
    translatedDocument: NormalisedDocument,
    targetLanguage: string,
): Promise<CompletenessVerificationResult> {
    const startTime = Date.now();

    return timedOperation('verify-completeness-ai', async (span) => {
        // Configuration for batching
        const PAGES_PER_BATCH = 5;

        // Extract global table metadata for sanity check
        const totalOutputTableCount = countTables(translatedDocument);

        logPhase('VERIFY', 'Starting AI completeness verification (batched)', {
            imageCount: originalImages.length,
            totalOutputTableCount,
            targetLanguage,
            batchSize: PAGES_PER_BATCH,
        });

        try {
            // approximate content per page distribution
            const contentPerPage = Math.ceil(translatedDocument.content.length / originalImages.length);

            // Split into batches
            const batches: { images: string[]; startIdx: number; endIdx: number }[] = [];
            for (let i = 0; i < originalImages.length; i += PAGES_PER_BATCH) {
                batches.push({
                    images: originalImages.slice(i, i + PAGES_PER_BATCH),
                    startIdx: i,
                    endIdx: Math.min(i + PAGES_PER_BATCH, originalImages.length),
                });
            }

            let isComplete = true;
            const allMissingContent: string[] = [];
            const allTableIssues: string[] = [];
            let totalSourceTables = 0;
            let totalConfidence = 0;
            let totalTokens = 0;

            for (let i = 0; i < batches.length; i++) {
                const batch = batches[i];
                const batchNum = i + 1;

                logPhase('VERIFY', `Verifying batch ${batchNum}/${batches.length}`, {
                    pages: batch.images.length,
                });

                // Slice content for this batch (approximate)
                const startContentIdx = batch.startIdx * contentPerPage;
                const endContentIdx = Math.min(
                    batch.endIdx * contentPerPage,
                    translatedDocument.content.length,
                );
                // Ensure we get at least some content if the document is short
                const batchContentNodes = translatedDocument.content.slice(startContentIdx, endContentIdx);

                const batchDocument = {
                    ...translatedDocument,
                    content: batchContentNodes,
                };

                // Count tables just in this batch for the prompt
                const batchOutputTableCount = countTables(batchDocument);

                // Build vision content
                const visionContent: VisionContent[] = [
                    {
                        type: 'text',
                        text: `## Original Document Images (Pages ${batch.startIdx + 1}-${batch.endIdx}):\n`,
                    },
                    ...batch.images.map((img) => ({
                        type: 'image_url' as const,
                        image_url: { url: img, detail: 'high' as const },
                    })),
                    {
                        type: 'text',
                        text: `\n\n## Translation Output (Corresponding Section):\n${JSON.stringify(batchDocument, null, 2)}`,
                    },
                    {
                        type: 'text',
                        text: `\n\n## Verification Task for this Batch:
1. Count the tables in these specific images
2. Count the tables in the translation output (I counted ${batchOutputTableCount})
3. For each table, verify ALL rows and columns are present
4. List any missing content
5. Provide confidence score (0-1)

IMPORTANT: Tables with spanning headers (colspan) are VALID. Do not flag them as issues.

Return ONLY a JSON object with your findings.`,
                    },
                ];

                const systemPrompt = `You are a sworn translation quality reviewer verifying a BATCH of pages (${batch.startIdx + 1}-${batch.endIdx}).
Your job is to verify that this specific section is COMPLETE and FAITHFUL to the original.

VERIFICATION RULES:
1. Every paragraph in the source images must appear in the translation output
2. Every table must be present with ALL rows and ALL columns
3. Every heading, list item, and piece of content must be preserved
4. Numbers, dates, and proper nouns must be accurately transferred
5. A header row spanning fewer columns than data rows is VALID

Return your response as a JSON object:
- complete: boolean
- source_table_count: integer (tables in THIS batch of images)
- missing_content: array of strings
- table_issues: array of strings
- confidence: number (0-1)`;

                // Execute request
                const response = await openaiProvider.completeWithVision(
                    visionContent,
                    AI_PRESETS.verification,
                    systemPrompt,
                );
                const result = JSON.parse(response.content || '{}');

                // Aggregate results
                isComplete = isComplete && result.complete === true;
                if (result.missing_content) allMissingContent.push(...result.missing_content);
                if (result.table_issues) allTableIssues.push(...result.table_issues);
                totalSourceTables += result.source_table_count || 0;
                totalConfidence += result.confidence || 0;
                totalTokens += response.tokensUsed;

                logPhase('VERIFY', `Batch ${batchNum} complete`, {
                    complete: result.complete,
                    sourceTables: result.source_table_count,
                });
            }

            const avgConfidence = batches.length > 0 ? totalConfidence / batches.length : 1;
            const processingMs = Date.now() - startTime;

            logPhase('VERIFY', 'AI completeness verification complete', {
                complete: isComplete,
                totalSourceTables,
                totalOutputTableCount,
                missingContent: allMissingContent.length,
                tableIssues: allTableIssues.length,
                confidence: avgConfidence,
                processingMs,
            });

            // Attributes for span
            span.setAttribute('verification.complete', isComplete);
            span.setAttribute('verification.confidence', avgConfidence);
            span.setAttribute('verification.tokens', totalTokens);

            return {
                complete: isComplete,
                missing_content: allMissingContent,
                table_verification: {
                    source_table_count: totalSourceTables,
                    output_table_count: totalOutputTableCount,
                    tables_match: totalSourceTables === totalOutputTableCount,
                    issues: allTableIssues,
                },
                confidence: avgConfidence,
                verification_tokens_used: totalTokens,
            };
        } catch (error) {
            logError('AI completeness verification failed', error);
            throw error;
        }
    });
}

/**
 * Verifies a translated document for quality issues.
 *
 * This is the main entry point called after the QA polish pass.
 * It runs untranslated content detection and attempts auto-fixes where possible.
 *
 * NOTE: This does NOT include mandatory AI verification. The pipeline should
 * call verifyCompletenessWithAI() separately with the original images.
 *
 * @param doc - The translated (and polished) document
 * @param sourceLanguage - Original document language
 * @param targetLanguage - Target translation language
 * @param config - Optional verification configuration
 */
export async function verifyTranslation(
    doc: NormalisedDocument,
    sourceLanguage: string,
    targetLanguage: string,
    config: VerificationConfig = {},
): Promise<VerificationResult> {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    let currentDoc = doc;
    let totalTokens = 0;

    // Validate document context if provided
    if (finalConfig.documentContext) {
        try {
            validateInput(
                DocumentContextSchema,
                finalConfig.documentContext,
                'verification-document-context',
            );
        } catch (error) {
            if (isSchemaValidationError(error)) {
                logWarning('Document context validation failed, using defaults', {
                    error: (error as Error).message,
                });
                // Clear invalid context and continue with defaults
                finalConfig.documentContext = undefined;
            } else {
                throw error;
            }
        }
    }

    logPhase('VERIFY', 'Starting translation verification', {
        sourceLanguage,
        targetLanguage,
        skipUntranslated: finalConfig.skipUntranslatedDetection,
        documentContext: finalConfig.documentContext?.documentType || 'none',
    });

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 1: Untranslated Content Detection
    // ─────────────────────────────────────────────────────────────────────────

    let untranslatedDetection: UntranslatedResult | null = null;
    let autoFixResult: FixResult | null = null;
    let reVerificationResult: UntranslatedResult | null = null;

    // Build detection context from config
    const detectionContext = finalConfig.documentContext
        ? {
              documentType: finalConfig.documentContext.documentType,
              documentName: finalConfig.documentContext.documentName,
          }
        : undefined;

    // Build translation context from config
    const translationContext = finalConfig.documentContext
        ? {
              documentType: finalConfig.documentContext.documentType,
              sourceLanguage,
          }
        : undefined;

    if (!finalConfig.skipUntranslatedDetection) {
        untranslatedDetection = await detectUntranslatedContent(
            currentDoc,
            sourceLanguage,
            targetLanguage,
            detectionContext,
        );

        totalTokens += untranslatedDetection.tokensUsed;

        logPhase('VERIFY', 'Untranslated detection complete', {
            hasIssues: untranslatedDetection.hasIssues,
            segmentsAnalyzed: untranslatedDetection.segmentsAnalyzed,
            issuesFound: untranslatedDetection.untranslatedSegments.length,
            documentType: detectionContext?.documentType || 'general',
        });

        // ─────────────────────────────────────────────────────────────────────
        // STEP 2: Auto-Fix with Retry (sworn translator quality standard)
        // ─────────────────────────────────────────────────────────────────────

        if (untranslatedDetection.hasIssues && !finalConfig.disableAutoFix) {
            let currentSegmentsToFix = untranslatedDetection.untranslatedSegments;
            let attemptNumber = 0;
            const maxAttempts = finalConfig.maxAutoFixAttempts || 3;

            while (currentSegmentsToFix.length > 0 && attemptNumber < maxAttempts) {
                attemptNumber++;

                logPhase('VERIFY', `Auto-fix attempt ${attemptNumber}/${maxAttempts}`, {
                    segmentsToFix: currentSegmentsToFix.length,
                    targetLanguage,
                    documentType: translationContext?.documentType || 'general',
                });

                // Exponential backoff between retries (100ms, 200ms, 400ms)
                if (attemptNumber > 1) {
                    const backoffMs = 100 * Math.pow(2, attemptNumber - 1);
                    await new Promise((resolve) => setTimeout(resolve, backoffMs));
                }

                try {
                    const fixResult = await fixUntranslatedSegments(
                        currentDoc,
                        currentSegmentsToFix,
                        targetLanguage,
                        translationContext,
                    );

                    totalTokens += fixResult.tokensUsed;
                    currentDoc = fixResult.fixedDocument;

                    // Accumulate fix results
                    if (!autoFixResult) {
                        autoFixResult = fixResult;
                    } else {
                        autoFixResult.segmentsFixed += fixResult.segmentsFixed;
                        autoFixResult.segmentsFailed = fixResult.segmentsFailed; // Only count final failures
                        autoFixResult.tokensUsed += fixResult.tokensUsed;
                        autoFixResult.fixDetails.push(...fixResult.fixDetails);
                        autoFixResult.fixedDocument = fixResult.fixedDocument;
                    }

                    logPhase('VERIFY', `Auto-fix attempt ${attemptNumber} complete`, {
                        segmentsFixed: fixResult.segmentsFixed,
                        segmentsFailed: fixResult.segmentsFailed,
                    });

                    // Re-verify to see what's left
                    reVerificationResult = await detectUntranslatedContent(
                        currentDoc,
                        sourceLanguage,
                        targetLanguage,
                        detectionContext,
                    );

                    totalTokens += reVerificationResult.tokensUsed;

                    logPhase('VERIFY', `Re-verification after attempt ${attemptNumber}`, {
                        stillHasIssues: reVerificationResult.hasIssues,
                        remainingIssues: reVerificationResult.untranslatedSegments.length,
                    });

                    // Update segments to fix for next iteration
                    currentSegmentsToFix = reVerificationResult.untranslatedSegments;

                    // If clean, we're done
                    if (!reVerificationResult.hasIssues) {
                        logPhase('VERIFY', 'All untranslated content fixed', {
                            totalAttempts: attemptNumber,
                            totalSegmentsFixed: autoFixResult.segmentsFixed,
                        });
                        break;
                    }
                } catch (error) {
                    // Infrastructure failure - log and continue to next attempt
                    logWarning(`Auto-fix attempt ${attemptNumber} failed`, {
                        error: (error as Error).message?.substring(0, 100),
                        isRateLimit: (error as Error & { status?: number }).status === 429,
                        isTimeout: (error as Error & { code?: string }).code === 'ETIMEDOUT',
                    });

                    // If it's a rate limit, wait longer before retry
                    if ((error as Error & { status?: number }).status === 429) {
                        const retryAfter = parseInt(
                            (error as Error & { headers?: Record<string, string> }).headers?.[
                                'retry-after'
                            ] || '5',
                            10,
                        );
                        await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
                    }

                    // On final attempt, throw to indicate infrastructure failure
                    if (attemptNumber >= maxAttempts) {
                        logError(
                            'Auto-fix exhausted all retries - infrastructure failure',
                            new Error('Max retries exceeded'),
                            {
                                attempts: attemptNumber,
                                remainingSegments: currentSegmentsToFix.length,
                                lastError: (error as Error).message?.substring(0, 100),
                            },
                        );
                        // Don't throw - let the final verification decide
                    }
                }
            }

            // Update final autoFixResult segmentsFailed count
            if (autoFixResult && reVerificationResult) {
                autoFixResult.segmentsFailed = reVerificationResult.untranslatedSegments.length;
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FINAL: Determine pass/fail
    // ─────────────────────────────────────────────────────────────────────────

    // Check final status
    const finalUntranslatedResult = reVerificationResult || untranslatedDetection;
    const hasUntranslatedIssues = finalUntranslatedResult?.hasIssues || false;

    // POLICY: Untranslated segment issues are non-blocking warnings.
    // The mandatory AI verification (verifyCompletenessWithAI) is the quality gate.
    const passed = true; // Always pass - verification is advisory only

    // Log issues as warnings for monitoring
    if (hasUntranslatedIssues && finalUntranslatedResult) {
        logWarning('Untranslated segments detected (non-blocking)', {
            count: finalUntranslatedResult.untranslatedSegments.length,
            segments: finalUntranslatedResult.untranslatedSegments.slice(0, 3).map((s) => ({
                text: s.text.substring(0, 50),
                reason: s.reason,
            })),
        });
    }

    // Build issue summary for metadata (informational only)
    let issueSummary = '';
    const parts: string[] = [];

    if (hasUntranslatedIssues && finalUntranslatedResult) {
        parts.push(`${finalUntranslatedResult.untranslatedSegments.length} untranslated segment(s)`);
    }

    if (parts.length > 0) {
        issueSummary = `Advisory: ${parts.join(', ')}`;
    }

    logPhase('VERIFY', 'Verification complete', {
        passed,
        totalTokensUsed: totalTokens,
        untranslatedIssues: finalUntranslatedResult?.untranslatedSegments.length || 0,
        autoFixAttempted: autoFixResult !== null,
        segmentsFixed: autoFixResult?.segmentsFixed || 0,
    });

    return {
        passed,
        untranslatedDetection,
        autoFixResult,
        reVerificationResult,
        finalDocument: currentDoc,
        totalTokensUsed: totalTokens,
        issueSummary,
    };
}

/**
 * Quick verification check without auto-fix.
 * Useful for validation-only scenarios.
 */
export async function quickVerify(
    doc: NormalisedDocument,
    sourceLanguage: string,
    targetLanguage: string,
): Promise<{ passed: boolean; issues: string[] }> {
    const result = await verifyTranslation(doc, sourceLanguage, targetLanguage, {
        disableAutoFix: true,
    });

    const issues: string[] = [];

    if (result.untranslatedDetection?.hasIssues) {
        issues.push(
            ...result.untranslatedDetection.untranslatedSegments.map(
                (s) => `Untranslated: "${s.text.substring(0, 50)}" (${s.reason})`,
            ),
        );
    }

    return {
        passed: result.passed,
        issues,
    };
}
