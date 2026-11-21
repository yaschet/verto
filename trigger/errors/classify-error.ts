/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * Error Classification Utilities for Trigger.dev Tasks
 *
 * Categorizes errors into transient (retryable) and permanent (fail-fast) types.
 * Implements exponential backoff calculation with rate limit header support.
 *
 * Used by all translation pipeline tasks for consistent error handling.
 */

import { logger } from '@trigger.dev/sdk';
import { isApiError } from '@errors/api-errors';
import { redactLogText, safeProviderError } from '@/services/log-safety';

/**
 * Transient error types that should trigger automatic retries
 */
export const TRANSIENT_ERROR_PATTERNS = {
    // HTTP Status Codes
    statusCodes: [429, 500, 502, 503, 504, 408],

    // Error code patterns
    errorCodes: [
        'GOOGLE_API_ERROR',
        'NETWORK_ERROR',
        'TIMEOUT_ERROR',
        'CONNECTION_ERROR',
        'RATE_LIMIT_ERROR',
        'SERVICE_UNAVAILABLE',
    ],

    // Error message patterns
    messagePatterns: [
        /timeout/i,
        /network/i,
        /connection/i,
        /rate limit/i,
        /service unavailable/i,
        /temporarily unavailable/i,
        /try again/i,
    ],
} as const;

/**
 * Permanent error types that should fail immediately without retries
 */
export const PERMANENT_ERROR_PATTERNS = {
    // HTTP Status Codes
    statusCodes: [400, 401, 403, 404, 422, 451],

    // Error code patterns
    errorCodes: [
        'INVALID_INPUT',
        'VALIDATION_ERROR',
        'UNAUTHORIZED',
        'FORBIDDEN',
        'NOT_FOUND',
        'INSUFFICIENT_CREDITS',
        'INVALID_FILE_FORMAT',
        'UNSUPPORTED_LANGUAGE',
    ],

    // Error message patterns
    messagePatterns: [
        /invalid/i,
        /unauthorized/i,
        /forbidden/i,
        /not found/i,
        /insufficient credits/i,
        /unsupported/i,
    ],
} as const;

/**
 * Check if an error is transient and should be retried
 */
export function isTransientError(error: unknown): boolean {
    // Check if it's an ApiError with status code
    if (isApiError(error)) {
        if ((TRANSIENT_ERROR_PATTERNS.statusCodes as readonly number[]).includes(error.status)) {
            return true;
        }

        if (error.code && (TRANSIENT_ERROR_PATTERNS.errorCodes as readonly string[]).includes(error.code)) {
            return true;
        }
    }

    // Check error message patterns
    const errorMessage = (error as Error)?.message || String(error);
    return TRANSIENT_ERROR_PATTERNS.messagePatterns.some((pattern) => pattern.test(errorMessage));
}

/**
 * Check if an error is permanent and should fail fast
 */
export function isPermanentError(error: unknown): boolean {
    // Check if it's an ApiError with status code
    if (isApiError(error)) {
        if ((PERMANENT_ERROR_PATTERNS.statusCodes as readonly number[]).includes(error.status)) {
            return true;
        }

        if (error.code && (PERMANENT_ERROR_PATTERNS.errorCodes as readonly string[]).includes(error.code)) {
            return true;
        }
    }

    // Check error message patterns
    const errorMessage = (error as Error)?.message || String(error);
    return PERMANENT_ERROR_PATTERNS.messagePatterns.some((pattern) => pattern.test(errorMessage));
}

/**
 * Calculate retry delay from rate limit headers
 *
 * Supports various header formats:
 * - X-RateLimit-Reset (Unix timestamp)
 * - Retry-After (seconds or HTTP date)
 * - X-RateLimit-Reset-After (seconds)
 */
export function calculateRetryFromHeaders(headers: Headers | Record<string, string>): Date | undefined {
    const getHeader = (name: string): string | null => {
        if (headers instanceof Headers) {
            return headers.get(name);
        }
        return headers[name] || headers[name.toLowerCase()] || null;
    };

    // Try X-RateLimit-Reset (Unix timestamp in seconds)
    const resetHeader = getHeader('x-ratelimit-reset') || getHeader('x-rate-limit-reset');
    if (resetHeader) {
        const resetTime = parseInt(resetHeader, 10);
        if (!isNaN(resetTime)) {
            // Convert to milliseconds and create Date
            return new Date(resetTime * 1000);
        }
    }

    // Try Retry-After header
    const retryAfter = getHeader('retry-after');
    if (retryAfter) {
        // Try parsing as number (seconds)
        const retrySeconds = parseInt(retryAfter, 10);
        if (!isNaN(retrySeconds)) {
            return new Date(Date.now() + retrySeconds * 1000);
        }

        // Try parsing as HTTP date
        const retryDate = new Date(retryAfter);
        if (!isNaN(retryDate.getTime())) {
            return retryDate;
        }
    }

    // Try X-RateLimit-Reset-After (seconds)
    const resetAfter = getHeader('x-ratelimit-reset-after');
    if (resetAfter) {
        const resetSeconds = parseInt(resetAfter, 10);
        if (!isNaN(resetSeconds)) {
            return new Date(Date.now() + resetSeconds * 1000);
        }
    }

    return undefined;
}

/**
 * Standard retry configuration for all translation tasks
 *
 * Implements exponential backoff: 1s, 2s, 4s, 8s, 16s
 * Max 3 retries (4 total attempts including initial)
 */
export const STANDARD_RETRY_CONFIG = {
    maxAttempts: 3,
    factor: 2.0,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 16000,
    randomize: false,
} as const;

/**
 * Retry configuration for long-running tasks (e.g., document processing)
 *
 * Adds timeout handling for operations that may take minutes
 */
export const LONG_RUNNING_RETRY_CONFIG = {
    maxAttempts: 3,
    factor: 2.0,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 16000,
    randomize: false,
} as const;

/**
 * Log error with retry context for debugging
 */
export function logErrorWithRetry(params: {
    taskId: string;
    runId: string;
    attemptNumber: number;
    error: unknown;
    willRetry: boolean;
}): void {
    const { attemptNumber, error, runId, taskId, willRetry } = params;
    const safeError = safeProviderError(error);

    const errorData = {
        taskId,
        runId,
        attempt: attemptNumber,
        errorType: safeError.name || 'Unknown',
        errorMessage: safeError.message,
        errorCode: isApiError(error) ? redactLogText(error.code) : undefined,
        errorStatus: isApiError(error) ? error.status : undefined,
        isTransient: isTransientError(error),
        isPermanent: isPermanentError(error),
        willRetry,
        timestamp: new Date().toISOString(),
    };

    if (willRetry) {
        logger.warn(`Task ${taskId} failed, will retry (attempt ${attemptNumber})`, errorData);
    } else {
        logger.error(`Task ${taskId} failed permanently (attempt ${attemptNumber})`, errorData);
    }
}

/**
 * Create a user-friendly error message from a technical error
 *
 * Maps technical errors to actionable messages for end users
 */
export function sanitizeErrorForUser(error: unknown): string {
    // Already has a user-friendly message from ApiError
    if (isApiError(error) && error.data?.description) {
        return error.data.description;
    }

    // Common error patterns mapped to user messages
    const errorMessage = (error as Error)?.message || String(error);

    const userMessageMap: Record<string, string> = {
        // Authentication/Authorization
        unauthorized: 'Authentication failed. Please sign in again.',
        forbidden: 'You do not have permission to perform this action.',

        // Credits/Billing
        'insufficient credits': 'You do not have enough credits. Please purchase more credits to continue.',

        // File/Input Issues
        'invalid file': 'The uploaded file format is not supported. Please upload a PDF file.',
        'file too large': 'The file is too large. Maximum size is 20 pages.',
        'unsupported language': 'Translation for this language pair is not available.',

        // API/Service Issues
        'rate limit': 'Too many requests. Please wait a moment and try again.',
        timeout: 'The operation took too long. Please try again.',
        'service unavailable': 'The service is temporarily unavailable. Please try again in a few minutes.',

        // Default
        default: 'An unexpected error occurred. Our team has been notified. Please try again later.',
    };

    // Find matching pattern
    for (const [pattern, message] of Object.entries(userMessageMap)) {
        if (errorMessage.toLowerCase().includes(pattern)) {
            return message;
        }
    }

    // Default fallback
    return userMessageMap['default'];
}
