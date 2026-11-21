/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const src = fileURLToPath(new URL('./src', import.meta.url));

export default defineConfig({
    resolve: {
        alias: [
            { find: '@constants', replacement: `${src}/constants` },
            { find: '@utils', replacement: `${src}/utils` },
            { find: '@/trigger', replacement: fileURLToPath(new URL('./trigger', import.meta.url)) },
            { find: '@/src', replacement: src },
            { find: '@', replacement: src },
        ],
    },
    test: {
        environment: 'node',
        include: ['tests/**/*.test.ts'],
        setupFiles: ['tests/network-guard.ts'],
        coverage: {
            provider: 'v8',
            include: ['src/engine/**/*.ts'],
            exclude: ['src/engine/document/types.ts', 'src/engine/diagnostics.ts'],
            reporter: ['text', 'json-summary', 'lcov'],
            thresholds: { statements: 75, lines: 75, functions: 80, branches: 65 },
        },
    },
});
