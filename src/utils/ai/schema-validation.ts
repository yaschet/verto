/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

// src/utils/ai/schema-validation.ts
// Centralized schema validation utilities for AI response enforcement

import { logger } from '@trigger.dev/sdk';
import { ZodError } from 'zod';
import type { z } from 'zod';

/**
 * Custom error class for schema validation failures.
 * Provides detailed context about what failed and why.
 */
export class SchemaValidationError extends Error {
    public readonly context: string;
    public readonly zodError: ZodError;
    public readonly rawResponse: unknown;

    constructor(context: string, zodError: ZodError, rawResponse?: unknown) {
        const issues = zodError.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
        super(`Schema validation failed [${context}]: ${issues}`);
        this.name = 'SchemaValidationError';
        this.context = context;
        this.zodError = zodError;
        this.rawResponse = rawResponse;
    }
}

/**
 * Validation result type for operations that shouldn't throw.
 */
export type ValidationResult<T> =
    | { success: true; data: T }
    | { success: false; error: SchemaValidationError };

/**
 * Validates an AI response against a Zod schema.
 * Throws SchemaValidationError on failure with detailed diagnostics.
 *
 * @param schema - Zod schema to validate against
 * @param response - Raw response from AI (parsed JSON or object)
 * @param context - Description of where this validation is happening (for error messages)
 * @returns Validated and typed data
 * @throws SchemaValidationError if validation fails
 */
export function validateAIResponse<T>(schema: z.ZodSchema<T>, response: unknown, context: string): T {
    const result = schema.safeParse(response);

    if (!result.success) {
        const preview =
            typeof response === 'object'
                ? JSON.stringify(response).substring(0, 500)
                : String(response).substring(0, 500);

        logger.error(`Schema validation failed: ${context}`, {
            errors: result.error.issues,
            responsePreview: preview,
            issueCount: result.error.issues.length,
        });

        throw new SchemaValidationError(context, result.error, response);
    }

    return result.data;
}

/**
 * Safe version of validateAIResponse that returns a result object instead of throwing.
 * Use this when you want to handle validation failures gracefully.
 *
 * @param schema - Zod schema to validate against
 * @param response - Raw response from AI
 * @param context - Description of where this validation is happening
 * @returns ValidationResult with either success data or error
 */
export function validateAIResponseSafe<T>(
    schema: z.ZodSchema<T>,
    response: unknown,
    context: string,
): ValidationResult<T> {
    const result = schema.safeParse(response);

    if (!result.success) {
        const preview =
            typeof response === 'object'
                ? JSON.stringify(response).substring(0, 500)
                : String(response).substring(0, 500);

        logger.warn(`Schema validation failed (safe): ${context}`, {
            errors: result.error.issues,
            responsePreview: preview,
        });

        return {
            success: false,
            error: new SchemaValidationError(context, result.error, response),
        };
    }

    return { success: true, data: result.data };
}

/**
 * Parses a JSON string and validates against a Zod schema in one step.
 * Handles both JSON parsing errors and schema validation errors.
 *
 * @param schema - Zod schema to validate against
 * @param jsonString - Raw JSON string from AI response
 * @param context - Description of where this validation is happening
 * @returns Validated and typed data
 * @throws SchemaValidationError if JSON parsing or validation fails
 */
export function parseAndValidateJSON<T>(schema: z.ZodSchema<T>, jsonString: string, context: string): T {
    let parsed: unknown;

    try {
        parsed = JSON.parse(jsonString);
    } catch (parseError) {
        logger.error(`JSON parsing failed: ${context}`, {
            error: parseError instanceof Error ? (parseError as Error).message : String(parseError),
            jsonPreview: jsonString.substring(0, 200),
        });

        // Create a synthetic ZodError for JSON parse failures
        const syntheticError = new ZodError([
            {
                code: 'custom',
                message: `Invalid JSON: ${parseError instanceof Error ? (parseError as Error).message : 'Parse error'}`,
                path: [],
            },
        ]);

        throw new SchemaValidationError(context, syntheticError, jsonString);
    }

    return validateAIResponse(schema, parsed, context);
}

/**
 * Safe version of parseAndValidateJSON that returns a result object.
 *
 * @param schema - Zod schema to validate against
 * @param jsonString - Raw JSON string from AI response
 * @param context - Description of where this validation is happening
 * @returns ValidationResult with either success data or error
 */
export function parseAndValidateJSONSafe<T>(
    schema: z.ZodSchema<T>,
    jsonString: string,
    context: string,
): ValidationResult<T> {
    let parsed: unknown;

    try {
        parsed = JSON.parse(jsonString);
    } catch (parseError) {
        logger.warn(`JSON parsing failed (safe): ${context}`, {
            error: parseError instanceof Error ? (parseError as Error).message : String(parseError),
            jsonPreview: jsonString.substring(0, 200),
        });

        const syntheticError = new ZodError([
            {
                code: 'custom',
                message: `Invalid JSON: ${parseError instanceof Error ? (parseError as Error).message : 'Parse error'}`,
                path: [],
            },
        ]);

        return {
            success: false,
            error: new SchemaValidationError(context, syntheticError, jsonString),
        };
    }

    return validateAIResponseSafe(schema, parsed, context);
}

/**
 * Validates input parameters before making AI calls.
 * Ensures request payloads conform to expected schemas.
 *
 * @param schema - Zod schema for the input
 * @param input - Input data to validate
 * @param context - Description of the input being validated
 * @returns Validated input data
 * @throws SchemaValidationError if input is invalid
 */
export function validateInput<T>(schema: z.ZodSchema<T>, input: unknown, context: string): T {
    const result = schema.safeParse(input);

    if (!result.success) {
        logger.error(`Input validation failed: ${context}`, {
            errors: result.error.issues,
            input: typeof input === 'object' ? JSON.stringify(input).substring(0, 500) : String(input),
        });

        throw new SchemaValidationError(context, result.error, input);
    }

    return result.data;
}

/**
 * Checks if an error is a SchemaValidationError.
 * Useful for error handling in catch blocks.
 */
export function isSchemaValidationError(error: unknown): error is SchemaValidationError {
    return error instanceof SchemaValidationError;
}
