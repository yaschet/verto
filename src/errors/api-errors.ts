/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import {
    AuthApiError as SupabaseAuthApiError,
    CustomAuthError as SupabaseCustomAuthError,
    isAuthApiError as isSupabaseAuthApiError,
} from '@supabase/supabase-js';
import { isAxiosError } from 'axios';
import { titleCase } from 'title-case';
import { v4 as uuid } from 'uuid';
import { ZodError } from 'zod';
import { SPECIFIC_ERROR_MAPPINGS } from '@/errors/constants';
import { API_ERROR_CODES } from '@/errors/error-codes';
import type { ApiErrorType } from '@/types/rest/errors';

export { API_ERROR_CODES };

/**
 * Represents a Verto API error in a standardized format (with additional properties).
 *
 * @class
 * @extends Error
 */
export class ApiError<T = unknown> extends Error {
    public error: boolean;

    public code: string;

    public title: string;

    public description?: string;

    public solution?: string;

    public status: number;

    public traceId?: string;

    public data?: T;

    public timestamp?: string;

    /**
     * Creates an instance of ApiError.
     *
     * @class
     * @param message - The error message.
     * @param errorDetails - The error details.
     * @param additionalData - Additional data to include in the error response object (optional).
     */
    constructor(message: string, errorDetails: Partial<ApiErrorType<T>>, additionalData?: T) {
        super(message);
        this.name = 'ApiError';
        this.error = true;
        this.code = errorDetails.code || 'UNEXPECTED_FAILURE';
        this.title = titleCase(message.replace(/_/g, ' ').replace(/\.$/, ''));
        this.description = errorDetails.description ?? API_ERROR_CODES.UNEXPECTED_FAILURE.description;
        this.solution = errorDetails.solution;
        this.status = errorDetails.status || 500;
        this.traceId = errorDetails.traceId || uuid();
        this.data = additionalData;
        this.timestamp = new Date().toISOString();

        if (Error.captureStackTrace && typeof window === 'undefined') {
            Error.captureStackTrace(this, ApiError);
        }
    }

    /**
     * Converts the ApiError instance to a JSON representation.
     *
     * This method returns an object of type ApiErrorType with all properties of the error.
     *
     * @returns
     */
    public toJSON(): Omit<ApiErrorType<T>, 'title'> & { title: string } {
        return {
            code: this.code,
            data: this.data,
            description: this.description,
            error: this.error,
            message: this.message,
            name: this.name,
            solution: this.solution,
            // stack: typeof window === 'undefined' ? this.stack : undefined,
            status: this.status,
            timestamp: this.timestamp,
            title: this.title ?? titleCase(this.message.replace(/_/g, ' ').replace(/\.$/, '')),
            traceId: this.traceId,
        };
    }
}

/**
 * Checks if the error is a plain object with the required properties of an API error response object.
 *
 * @param {unknown} error - The error to check.
 * @returns {boolean} True if the error is an API error response object; otherwise, false.
 * @public
 */
export function isApiError(error: unknown): error is ApiErrorType {
    if (typeof error !== 'object' || error === null) {
        return false;
    }

    const errorObject = error as ApiErrorType;

    return (
        typeof errorObject?.error === 'boolean' &&
        typeof errorObject?.code === 'string' &&
        typeof errorObject?.message === 'string' &&
        typeof errorObject?.status === 'number'
    );
}

/**
 * Throws an API error with the provided error message or object.
 *
 * This function handles various types of errors, including instances of `Error`, `ApiErrorType`, `ApiResponseOrError`,
 * `SupabaseAuthError`, `SupabaseCustomAuthError`, `PostgrestError`, and plain strings or numbers. It maps these errors
 * to a standardized `ApiError` format and logs the error details.
 *
 * @param {Error
 *     | ApiErrorType
 *     | ApiResponseOrError
 *     | SupabaseAuthError
 *     | SupabaseCustomAuthError
 *     | PostgrestError
 *     | string
 *     | number
 *     | any} error
 *   - The error message, object, or error instance to throw. This can be an instance of various error types or a plain
 *       string/number.
 *
 * @param [additionalData] - Additional data to include in the error response object (optional).
 * @returns {ApiErrorType} The standardized API error object.
 * @throws {ApiError} Throws an instance of `ApiError` with the provided details.
 * @layout T - The type of additional data to include in the error response.
 * @public
 */
export function standardizeError<T = never>(
    error: unknown = 'UNEXPECTED_FAILURE',
    additionalData?: Omit<Partial<ApiErrorType<T>>, 'error'> & Record<string, unknown>,
): ApiErrorType<T> {
    const record = error as ApiErrorType;
    let resolvedError: ApiError | ApiErrorType | null = null;

    if (error instanceof ApiError) {
        if (typeof window === 'undefined') {
            return error.toJSON();
        }

        delete error.stack;

        return error.toJSON();
    }

    const getErrorResponse = (code: string): ApiError => {
        const upperCaseCode = code.toUpperCase() as keyof typeof API_ERROR_CODES;

        const errorResponse =
            API_ERROR_CODES[upperCaseCode] ||
            API_ERROR_CODES[`HTTP_${upperCaseCode}` as keyof typeof API_ERROR_CODES] ||
            API_ERROR_CODES.UNEXPECTED_FAILURE;

        return new ApiError(errorResponse.message, errorResponse);
    };

    if (typeof error === 'string' || typeof error === 'number') {
        resolvedError = getErrorResponse(error.toString());
    } else if (isAxiosError(error)) {
        const errorResponse = {
            code: error.code ?? 'FETCH_ERROR',
            data: error.response?.data,
            description: error.response?.data ?? 'An error occurred during the request.',
            message: error.message,
            status: error.response?.status ?? 500,
            title: titleCase(error.message ?? 'Fetch Error'),
            traceId: error.config?.headers?.['X-Trace-Id'],
        };
        resolvedError = new ApiError(errorResponse.message!, errorResponse);
    } else if (SPECIFIC_ERROR_MAPPINGS[record.message]) {
        resolvedError = getErrorResponse(SPECIFIC_ERROR_MAPPINGS[record.message]!.toString());
    } else if (
        error instanceof SupabaseAuthApiError ||
        isSupabaseAuthApiError(error) ||
        error instanceof SupabaseCustomAuthError
    ) {
        resolvedError = getErrorResponse(error.message || error.name);
    } else if (error instanceof ZodError) {
        const errorResponse = {
            code: 'VALIDATION_ERROR',
            data: error.issues,
            description: error.message,
            message: 'Validation failed for the input data.',
            status: 400,
            title: 'Validation Error',
            traceId: uuid(),
        };
        resolvedError = new ApiError(errorResponse.message, errorResponse);
    } else if (error instanceof Error) {
        resolvedError = getErrorResponse('UNEXPECTED_FAILURE');
        resolvedError.stack = error.stack ?? resolvedError.stack;
        resolvedError.message = error.message ?? resolvedError.message;
        resolvedError.name = error.name ?? resolvedError.name;
        resolvedError.traceId = error.stack?.split('\n')[1]?.trim() ?? uuid();
    } else {
        resolvedError = getErrorResponse('UNEXPECTED_FAILURE');
    }

    if (additionalData) {
        const { code, description, message, solution, status, timestamp, traceId, ...restData } =
            additionalData as Partial<ApiErrorType<T>> & Record<string, unknown>;

        Object.assign(resolvedError.data as object, restData);

        if (message) resolvedError.message = message;
        if (description) resolvedError.description = description;
        if (solution) resolvedError.solution = solution;
        if (status) resolvedError.status = status;
        if (traceId) resolvedError.traceId = traceId;
        if (code) resolvedError.code = code;
        if (timestamp) resolvedError.timestamp = timestamp;
    }

    const isServer = typeof window === 'undefined';
    if (!isServer && process.env.NODE_ENV === 'production') {
        delete resolvedError.stack;
    }

    if (typeof error === 'object' && error !== null) {
        const { code, data, description, message, solution, stack, status, timestamp, title, traceId } =
            error as ApiErrorType<T> & { stack?: string };

        if (message) resolvedError.message = message;
        if (description) resolvedError.description = description;
        if (title) resolvedError.title = title;
        if (solution) resolvedError.solution = solution;
        if (status) resolvedError.status = status;
        if (traceId) resolvedError.traceId = traceId;
        if (code) resolvedError.code = code;
        if (timestamp) resolvedError.timestamp = timestamp;
        if (data) resolvedError.data = data;
        if (stack) resolvedError.stack = typeof window === 'undefined' ? stack : undefined;
    }

    return resolvedError instanceof ApiError ? resolvedError.toJSON() : resolvedError;
}
