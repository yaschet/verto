/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { fileURLToPath } from 'node:url';

const mode = process.argv[2];
if (!['build', 'dev', 'start'].includes(mode)) throw new Error('Expected build, dev or start.');
const fixtures = parseEnv(readFileSync(new URL('../.env.example', import.meta.url), 'utf8'));
const guard = fileURLToPath(new URL('./offline-network.mjs', import.meta.url));
const args = ['exec', 'next', mode, ...(mode === 'build' ? ['--webpack'] : []), ...process.argv.slice(3)];
const child = spawn('pnpm', args, {
    stdio: 'inherit',
    env: {
        ...process.env,
        ...fixtures,
        NEXT_TELEMETRY_DISABLED: '1',
        NODE_OPTIONS: [process.env.NODE_OPTIONS, `--import=${guard}`].filter(Boolean).join(' '),
    },
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('exit', (code) => process.exit(code ?? 1));
