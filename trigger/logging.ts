/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * Trigger.dev Logging Utilities
 *
 * Standardized logging helpers for consistent, professional run logs.
 * Designed for easy scanning without clicking into spans.
 *
 * Log Format Standard: [PHASE] Action | key=value, key=value
 *
 * @example
 * logPhase('INIT', 'Starting translation', { pages: 9, lang: 'en→de' });
 * // Output: [INIT] Starting translation | pages=9, lang=en→de
 */

import { logger, metadata, tags } from '@trigger.dev/sdk';
import type { Enums } from '@/types/database/database';
import { redactLogText, safeProviderError } from '@/services/log-safety';

/**
 * Translation phases for consistent logging.
 */
export type LogPhase =
    | 'INIT'
    | 'OCR'
    | 'TRANSLATE'
    | 'POLISH'
    | 'GENERATE'
    | 'SAVE'
    | 'ERROR'
    | 'RETRY'
    | 'EXPORT'
    | 'VERIFY'
    | 'AI_RECOVERY'
    | 'STORAGE';

/**
 * Formats key-value pairs for log messages.
 * @example formatMetrics({ pages: 9, lang: 'en→de' }) → 'pages=9, lang=en→de'
 */
function formatMetrics(data: Record<string, unknown>): string {
    return Object.entries(data)
        .filter(([_, v]) => v !== undefined && v !== null)
        .map(([k, v]) => `${k}=${v}`)
        .join(', ');
}

/**
 * Logs a phase checkpoint with consistent formatting.
 * These appear as top-level messages in the Trigger.dev dashboard.
 *
 * @param phase - The current phase (INIT, OCR, TRANSLATE, POLISH, GENERATE, SAVE)
 * @param message - Short action description (e.g., "Starting translation")
 * @param data - Key-value metrics to include in the log
 *
 * @example
 * logPhase('TRANSLATE', 'Page 3 complete', { chars: 2500, tables: 2 });
 * // Log: [TRANSLATE] Page 3 complete | chars=2500, tables=2
 */
export function logPhase(phase: LogPhase, message: string, data?: Record<string, unknown>): void {
    const metrics = data ? ` | ${formatMetrics(data)}` : '';
    logger.info(redactLogText(`[${phase}] ${message}${metrics}`));
}

/**
 * Logs a summary at the end of a phase.
 * Use for aggregated metrics after completing a batch of operations.
 *
 * @param operation - What completed (e.g., "OCR processing", "Translation")
 * @param metrics - Summary metrics to display
 *
 * @example
 * logSummary('Translation', { pages: 9, tokens: 24500, time: '52s' });
 * // Log: ✓ Translation complete | pages=9, tokens=24500, time=52s
 */
export function logSummary(operation: string, metrics: Record<string, unknown>): void {
    logger.info(redactLogText(`✓ ${operation} complete | ${formatMetrics(metrics)}`));
}

/**
 * Logs a warning with context.
 *
 * @param message - Warning description
 * @param context - Additional context
 *
 * @example
 * logWarning('OCR timeout, retrying', { page: 3, attempt: 2 });
 */
export function logWarning(message: string, context?: Record<string, unknown>): void {
    const metrics = context ? ` | ${formatMetrics(context)}` : '';
    logger.warn(redactLogText(`⚠ ${message}${metrics}`));
}

/**
 * Logs an error with full context for debugging.
 *
 * @param message - Error description
 * @param error - The error object
 * @param context - Additional context
 *
 * @example
 * logError('API request failed', error, { endpoint: '/translate', attempt: 3 });
 */
export function logError(message: string, error: unknown, context?: Record<string, unknown>): void {
    const errorMessage = safeProviderError(error).message;
    const metrics = context ? formatMetrics(context) : '';

    logger.error(redactLogText(`✗ ${message} | error=${errorMessage}${metrics ? `, ${metrics}` : ''}`));
}

/**
 * Sets run-level tags for filtering in the Trigger.dev dashboard.
 * Call this at the start of a translation run.
 *
 * @param translation - Translation record with metadata
 *
 * @example
 * // In run overview: tags: [pages:9, lang:en→de, type:legal]
 * setRunTags({ pageCount: 9, sourceLanguage: 'en', targetLanguage: 'de', documentType: 'legal' });
 */
export function setRunTags(options: {
    pageCount?: number;
    sourceLanguage?: string;
    targetLanguage?: string;
    documentType?: string;
    translationId?: string;
}): void {
    const { documentType, pageCount, sourceLanguage, targetLanguage, translationId } = options;

    // Max 10 tags per run - be selective
    if (pageCount !== undefined) {
        // Group page counts for filtering: 1, 2-5, 6-10, 10+
        const pageGroup = pageCount === 1 ? '1' : pageCount <= 5 ? '2-5' : pageCount <= 10 ? '6-10' : '10+';
        tags.add(`pages:${pageGroup}`);
    }

    if (sourceLanguage && targetLanguage) {
        tags.add(`lang:${sourceLanguage}→${targetLanguage}`);
    } else if (targetLanguage) {
        tags.add(`to:${targetLanguage}`);
    }

    if (documentType && documentType !== 'general') {
        tags.add(`type:${documentType}`);
    }

    if (translationId) {
        // Short ID for quick reference (first 8 chars of UUID)
        tags.add(`id:${translationId.substring(0, 8)}`);
    }
}

/**
 * Updates metadata for live dashboard display.
 * Use for current operation status visible without clicking into spans.
 *
 * @param operation - Current operation description
 * @param progress - Optional progress string (e.g., "3/9 pages")
 *
 * @example
 * updateLiveStatus('Translating', '3/9 pages');
 * // Dashboard shows: current_operation: Translating (3/9 pages)
 */
export function updateLiveStatus(operation: string, progress?: string): void {
    const status = progress ? `${operation} (${progress})` : operation;
    metadata.set('current_operation', status);
}

/**
 * Updates phase metadata for dashboard.
 * Includes both the phase name and progress percentage.
 *
 * @param phase - Current translation status/phase
 * @param progress - Progress percentage (0-100)
 * @param message - Optional status message
 */
export function updatePhaseMetadata(
    phase: Enums<'translation_status'>,
    progress: number,
    message?: string,
): void {
    metadata.set('phase', phase);
    metadata.set('progress', progress);
    if (message) {
        metadata.set('message', message);
    }
}

/**
 * Sets document-specific metadata visible in dashboard.
 *
 * @param doc - Document metadata
 */
export function setDocumentMetadata(doc: {
    translationId: string;
    documentName?: string;
    pageCount?: number;
    sourceLanguage?: string;
    targetLanguage?: string;
}): void {
    metadata.set('translationId', doc.translationId);
    if (doc.documentName) metadata.set('documentName', doc.documentName);
    if (doc.pageCount !== undefined) metadata.set('pageCount', doc.pageCount);
    if (doc.sourceLanguage) metadata.set('sourceLanguage', doc.sourceLanguage);
    if (doc.targetLanguage) metadata.set('targetLanguage', doc.targetLanguage);
}

/**
 * Creates a timed span for an operation.
 * Wrapper around logger.trace with consistent naming.
 *
 * @param name - Span name (e.g., 'translate-page-3')
 * @param fn - Async function to execute and time
 * @param attributes - Optional span attributes
 *
 * @example
 * const result = await timedOperation('translate-page-3', async (span) => {
 *   span.setAttribute('page', 3);
 *   // ... translation work
 *   return translatedContent;
 * });
 */
export async function timedOperation<T>(
    name: string,
    fn: (span: { setAttribute: (key: string, value: string | number | boolean) => void }) => Promise<T>,
    attributes?: Record<string, string | number | boolean>,
): Promise<T> {
    return logger.trace(name, async (span) => {
        // Generic guard: Ensure span is usable even if tracing is no-op (e.g. inside Server Actions)
        const safeSpan = {
            setAttribute: (key: string, value: string | number | boolean) => {
                if (span && typeof span.setAttribute === 'function') {
                    span.setAttribute(key, value);
                }
            },
        };

        // Set initial attributes
        if (attributes) {
            for (const [key, value] of Object.entries(attributes)) {
                safeSpan.setAttribute(key, value);
            }
        }
        return fn(safeSpan);
    });
}

/**
 * Logs the start of a translation run with all relevant context.
 * Call this once at the very beginning of the translation pipeline.
 *
 * @param options - Run initialization options
 */
export function logRunStart(options: {
    translationId: string;
    userId: string;
    pageCount?: number;
    sourceLanguage?: string;
    targetLanguage: string;
    documentType?: string;
    documentName?: string;
}): void {
    const { documentName, documentType, pageCount, sourceLanguage, targetLanguage, translationId } = options;

    // Set tags for filtering
    setRunTags({
        pageCount,
        sourceLanguage,
        targetLanguage,
        documentType,
        translationId,
    });

    // Set document metadata
    setDocumentMetadata({
        translationId,
        documentName,
        pageCount,
        sourceLanguage,
        targetLanguage,
    });

    // Log the start
    logPhase('INIT', 'Starting translation', {
        id: translationId.substring(0, 8),
        pages: pageCount,
        lang: sourceLanguage ? `${sourceLanguage}→${targetLanguage}` : `→${targetLanguage}`,
        type: documentType !== 'general' ? documentType : undefined,
    });
}

/**
 * Logs the completion of a translation run with final metrics.
 *
 * @param options - Run completion metrics
 */
export function logRunComplete(options: {
    translationId: string;
    pageCount: number;
    totalTokens: number;
    totalTimeMs: number;
    qaIssuesFixed?: number;
}): void {
    const { pageCount, qaIssuesFixed, totalTimeMs, totalTokens, translationId } = options;

    // Update final metadata
    metadata.set('phase', 'ready');
    metadata.set('progress', 100);
    metadata.set('current_operation', 'Complete');

    // Log completion summary
    logSummary('Translation', {
        id: translationId.substring(0, 8),
        pages: pageCount,
        tokens: totalTokens,
        time: `${(totalTimeMs / 1000).toFixed(1)}s`,
        fixes: qaIssuesFixed,
    });
}

/**
 * Logs a retry attempt with context.
 *
 * @param options - Retry context
 */
export function logRetry(options: {
    operation: string;
    attempt: number;
    maxAttempts: number;
    error: unknown;
    delayMs?: number;
}): void {
    const { attempt, delayMs, error, maxAttempts, operation } = options;
    const errorMsg = error instanceof Error ? error.message : String(error);

    logWarning(`${operation} retry ${attempt}/${maxAttempts}`, {
        error: errorMsg.substring(0, 100),
        delay: delayMs ? `${delayMs}ms` : undefined,
    });
}
