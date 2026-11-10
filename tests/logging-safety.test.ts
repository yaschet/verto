/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { redactLogText, redactLogValue, safeProviderError } from '../src/services/log-safety';
import { getLogger } from '../src/services/logger';

afterEach(() => vi.restoreAllMocks());

describe('private log data', () => {
    it('removes URL credentials, query strings and fragments', () => {
        const url = new URL('https://storage.example.invalid/file.png?token=synthetic#private');
        // Construct synthetic URL credentials so scanners do not mistake the fixture for a leaked secret.
        url.username = 'person';
        url.password = 'credential';
        expect(redactLogText(`Request ${url}`)).toBe('Request https://storage.example.invalid/file.png');
    });

    it.each([
        'Bearer synthetic-access-value',
        'token=synthetic-access-value',
        '{"access_token":"synthetic-access-value"}',
    ])('redacts tokens in free text: %s', (text) => {
        expect(redactLogText(text)).not.toContain('synthetic-access-value');
    });

    it.each(['', 'RSA ', 'EC ', 'DSA ', 'OPENSSH ', 'ENCRYPTED '])(
        'redacts complete and incomplete private-key material with prefix %j',
        (prefix) => {
            const header = ['-----BEGIN ', prefix, 'PRIVATE KEY-----'].join('');
            const footer = ['-----END ', prefix, 'PRIVATE KEY-----'].join('');
            expect(redactLogText(`Provider failed: ${header}\nsynthetic\n${footer}`)).toBe(
                'Provider failed: [REDACTED]',
            );
            expect(redactLogText(`Provider failed: ${header}\nsynthetic`)).toBe(
                'Provider failed: [REDACTED]',
            );
        },
    );

    it('redacts a large sequence of unterminated key headers', () => {
        const header = ['-----BEGIN ', 'PRIVATE KEY-----'].join('');
        expect(redactLogText(`Provider failed: ${header.repeat(10_000)}`)).toBe(
            'Provider failed: [REDACTED]',
        );
    });

    it('redacts nested credential fields and handles cycles', () => {
        const value: Record<string, unknown> = {
            status: 400,
            nested: {
                authorization: 'synthetic',
                api_key: 'synthetic',
                location: 'https://example.invalid/file?signature=synthetic',
            },
        };
        value.self = value;
        expect(redactLogValue(value)).toEqual({
            status: 400,
            nested: {
                authorization: '[REDACTED]',
                api_key: '[REDACTED]',
                location: 'https://example.invalid/file',
            },
            self: '[OMITTED]',
        });
    });

    it('wraps provider errors without retaining request config or response bodies', () => {
        const error = Object.assign(new Error('Failed at https://example.invalid/file?token=synthetic'), {
            code: 'RATE_LIMIT',
            status: 429,
            config: { headers: { authorization: 'synthetic' } },
            response: { data: 'private document' },
        });
        expect(safeProviderError(error)).toEqual({
            name: 'Error',
            message: 'Failed at https://example.invalid/file',
            code: 'RATE_LIMIT',
            status: 429,
        });
    });

    it('redacts actual logger output and preserves client-error severity', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        getLogger('test').error('Request failed', {
            status: 401,
            access_token: 'synthetic-private-value',
            url: 'https://example.invalid/file?token=synthetic-private-value',
        });
        expect(warn).toHaveBeenCalledOnce();
        expect(error).not.toHaveBeenCalled();
        expect(JSON.stringify(warn.mock.calls)).not.toContain('synthetic-private-value');
    });
});
