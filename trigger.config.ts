/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { defineConfig } from '@trigger.dev/sdk';
import { aptGet } from '@trigger.dev/build/extensions/core';
import { env } from '@/env';

export default defineConfig({
    project: env.TRIGGER_PROJECT_REF,
    dirs: ['./trigger/tasks'],
    runtime: 'node',
    maxDuration: 10000,
    retries: {
        enabledInDev: false,
        default: {
            factor: 2,
            maxAttempts: 3,
            maxTimeoutInMs: 10000,
            minTimeoutInMs: 1000,
            randomize: true,
        },
    },
    build: {
        external: ['googleapis', 'google-auth-library', '@google-cloud/storage'],
        autoDetectExternal: true,
        extensions: [aptGet({ packages: ['mupdf-tools'] })],
    },
});
