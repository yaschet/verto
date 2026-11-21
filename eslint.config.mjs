/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import unusedImports from 'eslint-plugin-unused-imports';

export default tseslint.config(
    { ignores: ['node_modules/**', '.next/**', '.trigger/**', 'coverage/**', 'next-env.d.ts'] },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['**/*.{js,mjs,cjs,ts,tsx}'],
        plugins: { 'unused-imports': unusedImports },
        languageOptions: { globals: { ...globals.browser, ...globals.node } },
        rules: {
            'unused-imports/no-unused-imports': 'error',
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
            ],
            '@typescript-eslint/ban-ts-comment': [
                'error',
                { 'ts-ignore': true, 'ts-nocheck': true, 'ts-expect-error': 'allow-with-description' },
            ],
        },
    },
);
