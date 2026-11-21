/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { redactLogValue } from './log-safety';

export function getLogger(name = 'default', level = 'info') {
    const isClientError = (item: unknown): boolean => {
        if (!item) return false;
        if (Array.isArray(item)) return item.some(isClientError);

        // Check string primitives directly
        if (typeof item === 'string') {
            if (item.includes('Auth session missing')) return true;
            if (item.includes('User is not authenticated')) return true;
            return false;
        }

        if (typeof item !== 'object') return false;

        // Check for standardized API Error fields or Supabase Auth errors
        const record = item as Record<string, unknown> & { error?: Record<string, unknown> };
        const code = record.code || record.error?.code;
        const status = record.status || record.error?.status;
        const message = record.message || record.error?.message;
        const name = record.name || record.error?.name;

        // DOWNGRADE ALL CLIENT ERRORS (400-499) TO WARNINGS
        // This covers:
        // 400: Validation Error, AuthSessionMissingError
        // 401: Unauthenticated
        // 403: Forbidden / Unauthorized Action
        // 404: Not Found
        // 409: Conflict
        // 429: Rate Limit
        if (typeof status === 'number' && status >= 400 && status < 500) {
            return true;
        }

        // Catch specific error codes that might strictly be client errors even without status
        if (code === 'UNAUTHENTICATED' || code === 'AuthSessionMissingError') return true;
        if (name === 'AuthSessionMissingError') return true;
        if (record.__isAuthError === true) return true; // Often implies 400/401 in Supabase

        // Supabase/PostgREST "Not Found" errors
        // PGRST116: JSON object requested, multiple (or no) rows returned. (Used by .single())
        if (code === 'PGRST116') return true;

        // String matching for robust catch-all
        if (typeof message === 'string') {
            if (message.includes('Auth session missing')) return true;
            if (message.includes('User is not authenticated')) return true;
        }

        return false;
    };

    return {
        info: (msg: unknown, ...args: unknown[]) =>
            console.log(`[${name}] [INFO]`, ...[msg, ...args].map((item) => redactLogValue(item))),
        error: (msg: unknown, ...args: unknown[]) => {
            // Check if any argument contains a Client Error
            if (isClientError(msg) || args.some(isClientError)) {
                console.warn(
                    `[${name}] [WARN] (Downgraded Client Error)`,
                    ...[msg, ...args].map((item) => redactLogValue(item)),
                );
            } else {
                console.error(`[${name}] [ERROR]`, ...[msg, ...args].map((item) => redactLogValue(item)));
            }
        },
        warn: (msg: unknown, ...args: unknown[]) =>
            console.warn(`[${name}] [WARN]`, ...[msg, ...args].map((item) => redactLogValue(item))),
        debug: (msg: unknown, ...args: unknown[]) =>
            console.debug(`[${name}] [DEBUG]`, ...[msg, ...args].map((item) => redactLogValue(item))),
        child: () => getLogger(name, level),
    };
}
