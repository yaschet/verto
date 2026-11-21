/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { describe, expect, test } from 'vitest';
import report from '../fixtures/structured-report.json';
import { repairTableStructure } from '../src/engine/document/repair-table-structure';
import { sanitizeProseMirrorDocument } from '../src/engine/document/sanitize-prosemirror-document';
import {
    createBatches,
    calculateRetryBatchSize,
    validateBatchFitness,
} from '../src/engine/translation/batch-sizing';
import {
    getTruncationUserMessage,
    isTruncationError,
    parseWithRecovery,
    TruncationError,
} from '../src/engine/translation/json-recovery';

describe('Document boundaries', () => {
    test('sanitizing does not alter the stored input', () => {
        const input = structuredClone(report);
        sanitizeProseMirrorDocument(input);
        expect(input).toEqual(report);
    });

    test('table repair keeps cell text and the source table intact', () => {
        const table = {
            type: 'table',
            content: [
                {
                    type: 'tableRow',
                    content: [
                        {
                            type: 'tableCell',
                            content: [{ type: 'paragraph', content: [{ type: 'text', text: '١٢٠ / 研究' }] }],
                        },
                    ],
                },
            ],
        };
        const snapshot = structuredClone(table);
        const repaired = repairTableStructure(table);
        expect(table).toEqual(snapshot);
        expect(JSON.stringify(repaired)).toContain('١٢٠ / 研究');
    });

    test('RTL alignment inversion preserves the text', () => {
        const result = sanitizeProseMirrorDocument(
            {
                type: 'doc',
                content: [
                    {
                        type: 'paragraph',
                        attrs: { textAlign: 'left' },
                        content: [{ type: 'text', text: 'نص تجريبي' }],
                    },
                ],
            },
            'rtl',
        );
        expect(result.content?.[0]?.attrs?.textAlign).toBe('right');
        expect(result.content?.[0]?.content?.[0]?.text).toBe('نص تجريبي');
    });
});

describe('Recovery and retry boundaries', () => {
    test.each([
        'length limit',
        'truncated',
        'max_completion_tokens',
        'unexpected end of json',
        'unterminated string',
    ])('recognizes %s', (message) => expect(isTruncationError(new Error(message))).toBe(true));
    test('recognizes provider finish reason and typed errors', () => {
        expect(isTruncationError(undefined, 'length')).toBe(true);
        expect(isTruncationError(new TruncationError('Partial response', '{}', 10))).toBe(true);
        expect(isTruncationError({ name: 'TruncationError' })).toBe(true);
        expect(isTruncationError(new SyntaxError('Expected closing bracket'))).toBe(true);
        expect(isTruncationError(new Error('Permission denied'))).toBe(false);
        expect(isTruncationError(null)).toBe(false);
        expect(getTruncationUserMessage()).toContain('retrying');
    });
    test('complete JSON is returned without claiming a repair', () => {
        expect(parseWithRecovery('{"content":[]}')).toMatchObject({
            success: true,
            recovered: false,
            extractedNodes: 0,
        });
    });
    test('batch splitting preserves order, membership and the input', () => {
        const pages = ['A', 'B', 'C', 'D', 'E'];
        const batches = createBatches(pages, 2);
        expect(batches).toEqual([['A', 'B'], ['C', 'D'], ['E']]);
        expect(batches.flat()).toEqual(pages);
        expect(pages).toEqual(['A', 'B', 'C', 'D', 'E']);
    });
    test('budget equality is accepted, excess is rejected', () => {
        expect(validateBatchFitness(2, 3500, 10000, 0.7)).toMatchObject({ isValid: true, margin: 0 });
        expect(validateBatchFitness(2, 3501, 10000, 0.7)).toMatchObject({ isValid: false, margin: -2 });
    });
    test('retry size cannot fall below the configured minimum', () => {
        expect(calculateRetryBatchSize(1, 1).newBatchSize).toBe(1);
        expect(calculateRetryBatchSize(4, 2, 2).newBatchSize).toBe(2);
        expect(calculateRetryBatchSize(4, 3).maxTokens).toBeGreaterThan(
            calculateRetryBatchSize(4, 1).maxTokens,
        );
    });
    test('the suite blocks outbound requests', () => {
        expect(() => fetch('https://example.com')).toThrow('Network access is forbidden');
    });
});
