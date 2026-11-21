/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * Dynamic Batch Sizing for Translation Pipeline
 *
 * Calculates optimal batch sizes based on document complexity to prevent
 * "length limit reached" errors from OpenAI token truncation.
 *
 * Conservative batch sizes reserve output-token headroom.
 */

import { logPhase, logWarning } from '../diagnostics';

// Document types that affect complexity estimation
export type DocumentType = 'legal' | 'medical' | 'financial' | 'certificate' | 'general';

export type BatchSizeResult = {
    /** Recommended pages per batch */
    batchSize: number;
    /** Document complexity assessment */
    complexity: 'simple' | 'medium' | 'complex';
    /** Estimated output tokens per page */
    estimatedOutputPerPage: number;
    /** Confidence in the estimate (0-1) */
    confidence: number;
};

export type BatchValidation = {
    /** Whether batch is likely to fit within token limits */
    isValid: boolean;
    /** Expected total output tokens for the batch */
    expectedTokens: number;
    /** Safe token limit (with margin applied) */
    safeLimit: number;
    /** Remaining token headroom */
    margin: number;
};

type BatchSizeConfig = {
    /** Maximum completion tokens allowed (default: 16384) */
    maxCompletionTokens: number;
    /** Safety margin percentage (default: 0.70 = 70% for maximum resilience) */
    safetyMargin: number;
    /** Minimum batch size (default: 1) */
    minBatchSize: number;
    /** Maximum batch size (default: 3 for complex, 5 for simple) */
    maxBatchSize: number;
    /** Base tokens per page for simple documents */
    baseTokensPerPage: number;
};

const DEFAULT_CONFIG: BatchSizeConfig = {
    maxCompletionTokens: 16384,
    safetyMargin: 0.7, // 70% - extra conservative for maximum resilience
    minBatchSize: 1,
    maxBatchSize: 5,
    baseTokensPerPage: 1000, // Higher estimate for safety
};

/**
 * Complexity multipliers by document type.
 * Higher values = more output tokens expected per page.
 */
const TYPE_MULTIPLIERS: Record<DocumentType, number> = {
    certificate: 2.5, // Dense formatting, key-value pairs
    legal: 2.2, // Tables, numbered clauses, formal structure
    financial: 3.0, // Complex tables, numbers, calculations
    medical: 1.8, // Mixed structured content
    general: 1.0, // Default baseline
};

/**
 * Maximum batch sizes by complexity level.
 * Conservative limits for maximum resilience.
 */
const MAX_BATCH_BY_COMPLEXITY: Record<'simple' | 'medium' | 'complex', number> = {
    simple: 5, // Simple docs can handle larger batches
    medium: 3, // Mixed content - be cautious
    complex: 2, // Dense tables/forms - very conservative
};

/**
 * Calculates the optimal batch size for a document based on complexity.
 *
 * Uses conservative estimates to prevent token limit errors:
 * - 70% safety margin on max_completion_tokens
 * - Document type affects complexity multiplier
 * - Input token density indicates content complexity
 *
 * @param pageCount - Total pages in document
 * @param inputTokensPerPage - Estimated input tokens per page (from image analysis)
 * @param documentType - Document type hint for complexity estimation
 * @param config - Optional configuration overrides
 */
export function calculateConservativeBatchSize(
    pageCount: number,
    inputTokensPerPage: number,
    documentType?: DocumentType,
    config: Partial<BatchSizeConfig> = {},
): BatchSizeResult {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };

    // Determine complexity based on input tokens and document type
    const complexity = estimateComplexity(inputTokensPerPage, documentType);

    // Calculate expected output tokens per page
    const typeMultiplier = TYPE_MULTIPLIERS[documentType || 'general'];
    const outputPerPage = finalConfig.baseTokensPerPage * complexity.multiplier * typeMultiplier;

    // Apply safety margin to max completion tokens
    const safeLimit = Math.floor(finalConfig.maxCompletionTokens * finalConfig.safetyMargin);

    // Calculate optimal batch size
    let batchSize = Math.floor(safeLimit / outputPerPage);

    // Apply complexity-based maximum
    const maxForComplexity = MAX_BATCH_BY_COMPLEXITY[complexity.level];
    batchSize = Math.min(batchSize, maxForComplexity, finalConfig.maxBatchSize);

    // Ensure minimum batch size
    batchSize = Math.max(finalConfig.minBatchSize, batchSize);

    // Don't exceed page count
    batchSize = Math.min(batchSize, pageCount);

    logPhase('TRANSLATE', 'Dynamic batch sizing applied', {
        staticMaxBatchSize: finalConfig.maxBatchSize,
        calculatedOptimal: batchSize,
        effectiveBatchSize: batchSize,
        complexity: complexity.level,
        confidence: complexity.confidence,
    });

    return {
        batchSize,
        complexity: complexity.level,
        estimatedOutputPerPage: Math.round(outputPerPage),
        confidence: complexity.confidence,
    };
}

/**
 * Estimates document complexity based on input token density.
 *
 * Higher input tokens per page typically indicates:
 * - Larger/higher resolution images
 * - More content on page (dense tables, small text)
 * - Complex layouts
 */
function estimateComplexity(
    inputTokensPerPage: number,
    documentType?: DocumentType,
): { level: 'simple' | 'medium' | 'complex'; multiplier: number; confidence: number } {
    // Standard A4 at 150 DPI produces approximately 1275 input tokens
    const baselineInputTokens = 1275;
    const inputRatio = inputTokensPerPage / baselineInputTokens;

    // Document type adjustments
    const complexTypes: DocumentType[] = ['financial', 'certificate', 'legal'];
    const isComplexType = documentType && complexTypes.includes(documentType);

    // Thresholds adjusted for maximum resilience (lower = more conservative)
    if (inputRatio < 0.9 && !isComplexType) {
        return { level: 'simple', multiplier: 1.0, confidence: 0.85 };
    } else if (inputRatio < 1.3 && !isComplexType) {
        return { level: 'medium', multiplier: 1.5, confidence: 0.75 };
    } else {
        // Complex: high input tokens OR complex document type
        return { level: 'complex', multiplier: 2.0, confidence: 0.65 };
    }
}

/**
 * Validates whether a batch will fit within token limits.
 *
 * Call BEFORE sending batch to API as a safety check.
 * If validation fails, consider reducing batch size.
 *
 * @param pagesInBatch - Number of pages in this batch
 * @param estimatedOutputPerPage - Estimated output tokens per page
 * @param maxCompletionTokens - API token limit (default: 16384)
 * @param safetyMargin - Safety factor (default: 0.70)
 */
export function validateBatchFitness(
    pagesInBatch: number,
    estimatedOutputPerPage: number,
    maxCompletionTokens = 16384,
    safetyMargin = 0.7,
): BatchValidation {
    const expectedTokens = pagesInBatch * estimatedOutputPerPage;
    const safeLimit = Math.floor(maxCompletionTokens * safetyMargin);
    const margin = safeLimit - expectedTokens;

    const validation: BatchValidation = {
        isValid: expectedTokens <= safeLimit,
        expectedTokens,
        safeLimit,
        margin,
    };

    if (!validation.isValid) {
        logWarning('Batch may exceed safe token limit', {
            pagesInBatch,
            estimatedOutputPerPage,
            expectedTokens,
            safeLimit,
            deficit: -margin,
        });
    }

    return validation;
}

/**
 * Calculates the reduced batch size for retry attempts.
 *
 * Called when a batch fails due to truncation.
 * Progressively reduces batch size with each retry.
 *
 * @param currentBatchSize - Current batch size that failed
 * @param attempt - Current retry attempt number (1-based)
 * @param minBatchSize - Minimum allowed batch size (default: 1)
 */
export function calculateRetryBatchSize(
    currentBatchSize: number,
    attempt: number,
    minBatchSize = 1,
): { newBatchSize: number; maxTokens: number } {
    // Reduction strategy:
    // Attempt 1: original size (already failed)
    // Attempt 2: halve the batch size
    // Attempt 3: single page with increased token limit

    let newBatchSize: number;
    let maxTokens = 16384;

    if (attempt === 1) {
        // First retry: halve the batch size
        newBatchSize = Math.max(minBatchSize, Math.ceil(currentBatchSize / 2));
    } else if (attempt === 2) {
        // Second retry: single page
        newBatchSize = minBatchSize;
    } else {
        // Third retry: single page with increased token limit
        newBatchSize = minBatchSize;
        maxTokens = 24576; // 1.5x the normal limit for single pages
    }

    logPhase('RETRY', 'Dynamic batch resizing for retry', {
        originalSize: currentBatchSize,
        attempt,
        newBatchSize,
        strategy: attempt === 1 ? 'halve' : 'single-page',
    });

    return { newBatchSize, maxTokens };
}

/**
 * Splits pages into batches using the calculated optimal batch size.
 *
 * @param pageCount - Total number of pages
 * @param batchSize - Calculated optimal batch size
 */
export function createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
        batches.push(items.slice(i, i + batchSize));
    }
    return batches;
}
