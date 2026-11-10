/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import cases from '../fixtures/engine-cases.json';
import * as table from '../src/engine/document/repair-table-structure';
import * as document from '../src/engine/document/repair-document-tables';
import * as sanitize from '../src/engine/document/sanitize-prosemirror-document';
import * as json from '../src/engine/translation/json-recovery';
import * as batch from '../src/engine/translation/batch-sizing';

const transforms = { table, document, sanitize, json, batch };
const corpusSchema = z.array(
    z.object({
        module: z.enum(['table', 'document', 'sanitize', 'json', 'batch']),
        fn: z.string(),
        args: z.array(z.unknown()),
        label: z.string(),
        expected: z.union([
            z.object({ result: z.unknown() }),
            z.object({ error: z.object({ name: z.string(), message: z.string() }) }),
        ]),
    }),
);

describe('Reference behavior of deterministic transforms', () => {
    test.each(corpusSchema.parse(cases))('$label', ({ module, fn, args, expected }) => {
        const operation: unknown = Reflect.get(transforms[module], fn);
        if (typeof operation !== 'function') throw new Error(`Unknown transform: ${module}.${fn}`);
        const invoke = (): unknown => Reflect.apply(operation, undefined, structuredClone(args));

        if ('error' in expected) {
            expect(invoke).toThrowError(expected.error.message);
            try {
                invoke();
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect((error as Error).name).toBe(expected.error.name);
            }
        } else {
            // JSON encoding intentionally omits undefined optional properties.
            const result: unknown = JSON.parse(JSON.stringify(invoke()));
            expect(result).toEqual(expected.result);
        }
    });
});
