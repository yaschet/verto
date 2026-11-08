/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * JSON Recovery Utilities for Truncated AI Responses
 *
 * When OpenAI hits max_completion_tokens, it returns truncated JSON.
 * These utilities attempt to salvage as much valid content as possible.
 *
 * Recovery strategies:
 * 1. Direct parse (happy path)
 * 2. Bracket balancing (add missing closing brackets)
 * 3. Extract complete content nodes from partial array
 */

import { logger } from '../diagnostics';

export type JSONRecoveryResult = {
    /** Whether parsing succeeded (with or without recovery) */
    success: boolean;
    /** Parsed data (may be partial if recovered) */
    data: unknown;
    /** Whether recovery techniques were needed */
    recovered: boolean;
    /** Number of content nodes extracted (if partial recovery) */
    extractedNodes: number;
    /** Type of issue encountered */
    errorType: 'none' | 'truncation' | 'corruption' | 'empty';
    /** Original error message if parsing failed */
    originalError?: string;
};

/**
 * Custom error class for truncation-related failures.
 */
export class TruncationError extends Error {
    constructor(
        message: string,
        public readonly partialContent: string,
        public readonly tokensUsed: number,
    ) {
        super(message);
        this.name = 'TruncationError';
    }
}

/**
 * Attempts to parse JSON with recovery for truncated responses.
 *
 * Strategy:
 * 1. Try direct parse (happy path)
 * 2. If fails, attempt bracket balancing
 * 3. If still fails, extract complete array elements
 * 4. Return whatever was recoverable
 *
 * @param text - The potentially truncated JSON string
 */
export function parseWithRecovery(text: string): JSONRecoveryResult {
    // Handle empty/null input
    if (!text || text.trim() === '') {
        return {
            success: false,
            data: null,
            recovered: false,
            extractedNodes: 0,
            errorType: 'empty',
            originalError: 'Empty response received',
        };
    }

    // 1. Direct parse attempt (happy path)
    try {
        const data = JSON.parse(text);
        return {
            success: true,
            data,
            recovered: false,
            extractedNodes: countNodes(data),
            errorType: 'none',
        };
    } catch (directError) {
        logger.debug('Direct JSON parse failed, attempting recovery', {
            errorMessage: (directError as Error).message,
            textLength: text.length,
            textPreview: text.slice(0, 100),
        });
    }

    // 2. Bracket balancing - add missing closing brackets
    try {
        const balanced = balanceBrackets(text);
        const data = JSON.parse(balanced);

        logger.info('JSON recovered via bracket balancing', {
            originalLength: text.length,
            balancedLength: balanced.length,
            nodesRecovered: countNodes(data),
        });

        return {
            success: true,
            data,
            recovered: true,
            extractedNodes: countNodes(data),
            errorType: 'truncation',
        };
    } catch (balanceError) {
        logger.debug('Bracket balancing failed, attempting node extraction', {
            errorMessage: (balanceError as Error).message,
        });
    }

    // 3. Extract complete content nodes from partial JSON
    const extracted = extractCompleteNodes(text);
    if (extracted.length > 0) {
        logger.info('Partial JSON recovery - extracted complete nodes', {
            extractedCount: extracted.length,
            textLength: text.length,
        });

        return {
            success: true,
            data: {
                content: extracted,
                context: {}, // Context lost in partial recovery
                _recovered: true,
                _partialRecovery: true,
            },
            recovered: true,
            extractedNodes: extracted.length,
            errorType: 'truncation',
        };
    }

    // 4. Complete failure - nothing recoverable
    logger.error('JSON recovery failed completely', {
        textLength: text.length,
        textPreview: text.slice(0, 200),
        textEnd: text.slice(-100),
    });

    return {
        success: false,
        data: null,
        recovered: false,
        extractedNodes: 0,
        errorType: 'corruption',
        originalError: 'Unable to parse or recover JSON content',
    };
}

/**
 * Balances JSON brackets by appending missing closing brackets.
 *
 * Handles:
 * - Missing } and ]
 * - Unclosed strings
 * - Trailing commas
 */
function balanceBrackets(text: string): string {
    const stack: string[] = [];
    const pairs: Record<string, string> = { '{': '}', '[': ']' };
    let inString = false;
    let escapeNext = false;

    for (const char of text) {
        if (escapeNext) {
            escapeNext = false;
            continue;
        }
        if (char === '\\') {
            escapeNext = true;
            continue;
        }
        if (char === '"') {
            inString = !inString;
            continue;
        }
        if (inString) continue;

        if (char === '{' || char === '[') {
            stack.push(pairs[char]);
        } else if (char === '}' || char === ']') {
            if (stack.length > 0 && stack[stack.length - 1] === char) {
                stack.pop();
            }
        }
    }

    // Clean up trailing incomplete content
    let cleaned = text.trimEnd();

    // Remove trailing comma (common in truncated arrays/objects)
    if (cleaned.endsWith(',')) {
        cleaned = cleaned.slice(0, -1);
    }

    // Close unclosed string
    if (inString) {
        cleaned += '"';
    }

    // Remove incomplete key-value pair at end (e.g., `"key":`)
    const trailingColon = cleaned.match(/,?\s*"[^"]*"\s*:\s*$/);
    if (trailingColon) {
        cleaned = cleaned.slice(0, -trailingColon[0].length);
    }

    // Remove incomplete value at end (e.g., `"key": "incomplete...`)
    const incompleteValue = cleaned.match(/,?\s*"[^"]*"\s*:\s*"[^"]*$/);
    if (incompleteValue && !cleaned.endsWith('"')) {
        cleaned = cleaned.slice(0, -incompleteValue[0].length);
    }

    // Add missing closing brackets in reverse order
    return cleaned + stack.reverse().join('');
}

/**
 * Extracts complete JSON objects from a content array.
 *
 * Useful when the response was truncated mid-array but some
 * complete objects exist before the truncation point.
 */
function extractCompleteNodes(text: string): unknown[] {
    const nodes: unknown[] = [];

    // Find the start of the content array
    const contentMatch = text.match(/"content"\s*:\s*\[/);
    if (!contentMatch || contentMatch.index === undefined) {
        // Try to find any array of objects
        const arrayMatch = text.match(/\[\s*\{/);
        if (!arrayMatch || arrayMatch.index === undefined) {
            return nodes;
        }
    }

    const startIdx =
        contentMatch && contentMatch.index !== undefined
            ? contentMatch.index + contentMatch[0].length
            : text.indexOf('[') + 1;

    let depth = 0;
    let currentStart = -1;
    let inString = false;
    let escapeNext = false;

    for (let i = startIdx; i < text.length; i++) {
        const char = text[i];

        if (escapeNext) {
            escapeNext = false;
            continue;
        }
        if (char === '\\') {
            escapeNext = true;
            continue;
        }
        if (char === '"') {
            inString = !inString;
            continue;
        }
        if (inString) continue;

        if (char === '{') {
            if (depth === 0) {
                currentStart = i;
            }
            depth++;
        } else if (char === '}') {
            depth--;
            if (depth === 0 && currentStart !== -1) {
                // Found a complete object
                const objStr = text.slice(currentStart, i + 1);
                try {
                    const obj = JSON.parse(objStr);
                    // Validate it looks like a content node
                    if (obj && typeof obj === 'object' && obj.type) {
                        nodes.push(obj);
                    }
                } catch {
                    // Skip malformed objects
                }
                currentStart = -1;
            }
        } else if (char === ']' && depth === 0) {
            // End of content array
            break;
        }
    }

    return nodes;
}

/**
 * Counts the number of content nodes in parsed data.
 */
function countNodes(data: unknown): number {
    if (!data) return 0;
    if (Array.isArray((data as { content?: unknown[] })?.content)) {
        return (data as { content: unknown[] }).content.length;
    }
    if (Array.isArray(data)) {
        return data.length;
    }
    return 0;
}

/**
 * Detects if an error is likely caused by response truncation.
 *
 * @param error - The error that occurred
 * @param finishReason - OpenAI's finish_reason if available
 */
export function isTruncationError(error: unknown, finishReason?: string | null): boolean {
    // Check finish_reason from OpenAI
    if (finishReason === 'length') {
        return true;
    }

    // Check for TruncationError instance
    if (error instanceof TruncationError || (error as Error)?.name === 'TruncationError') {
        return true;
    }

    // Check error message patterns
    const msg = (error as Error)?.message?.toLowerCase() || '';
    if (
        msg.includes('length limit') ||
        msg.includes('truncat') ||
        msg.includes('max_completion_tokens') ||
        msg.includes('unexpected end of json') ||
        msg.includes('unterminated string')
    ) {
        return true;
    }

    // Check for JSON syntax errors that indicate truncation
    if (error instanceof SyntaxError) {
        const jsonMsg = error.message.toLowerCase();
        if (
            jsonMsg.includes('unexpected end') ||
            jsonMsg.includes('unterminated') ||
            jsonMsg.includes('expected')
        ) {
            return true;
        }
    }

    return false;
}

/**
 * Creates a user-friendly error message for truncation errors.
 */
export function getTruncationUserMessage(): string {
    return 'Processing a complex document section. The system is automatically retrying with optimized settings.';
}
