/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

const sensitiveKey = /authorization|cookie|token|secret|password|api[-_]?key|private[-_]?key|credential/i;

/** Removes URL credentials, queries, fragments and recognizable tokens from log text. */
export function redactLogText(value: string): string {
    const privateKeyStart = value.search(/-----BEGIN (?:RSA |EC |DSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/);
    // Drop the remaining text, including incomplete keys, without repeatedly scanning for an end marker.
    const text = privateKeyStart === -1 ? value : `${value.slice(0, privateKeyStart)}[REDACTED]`;
    return text
        .replace(/https?:\/\/[^\s"'<>]+/gi, (match) => {
            try {
                const url = new URL(match);
                url.username = '';
                url.password = '';
                url.search = '';
                url.hash = '';
                return url.toString();
            } catch {
                return '[REDACTED URL]';
            }
        })
        .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [REDACTED]')
        .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[REDACTED]')
        .replace(/\b(?:sk-(?:proj-)?|[sr]k_(?:live|test)_|sb_secret_)[A-Za-z0-9_-]{12,}/g, '[REDACTED]')
        .replace(
            /\b((?:access[_-]?token|refresh[_-]?token|token|password|client[_-]?secret|api[_-]?key|authorization)["']?\s*[=:]\s*["']?)(?:Bearer\s+)?[^\s,;"'}]+/gi,
            '$1[REDACTED]',
        );
}

/** Keeps useful provider diagnostics without serializing request headers, bodies or config. */
export function safeProviderError(error: unknown): Record<string, string | number> {
    if (typeof error === 'string') return { message: redactLogText(error).slice(0, 1000) };
    if (!error || typeof error !== 'object') return { message: 'Provider operation failed' };

    const record = error as Record<string, unknown>;
    const result: Record<string, string | number> = {
        name: typeof record.name === 'string' ? redactLogText(record.name) : 'ProviderError',
        message:
            typeof record.message === 'string'
                ? redactLogText(record.message).slice(0, 1000)
                : 'Provider operation failed',
    };
    if (typeof record.code === 'string') result.code = redactLogText(record.code).slice(0, 100);
    if (typeof record.code === 'number') result.code = record.code;
    if (typeof record.status === 'number') result.status = record.status;
    return result;
}

/** Redacts nested structured log values, including errors and circular references. */
export function redactLogValue(value: unknown, seen = new WeakSet<object>(), depth = 0): unknown {
    if (typeof value === 'string') return redactLogText(value);
    if (value instanceof Error) return safeProviderError(value);
    if (!value || typeof value !== 'object') return value;
    if (depth >= 6 || seen.has(value)) return '[OMITTED]';
    seen.add(value);
    if (Array.isArray(value)) {
        return value.slice(0, 50).map((item) => redactLogValue(item, seen, depth + 1));
    }
    return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [
            key,
            sensitiveKey.test(key) ? '[REDACTED]' : redactLogValue(item, seen, depth + 1),
        ]),
    );
}
