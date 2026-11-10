/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import tls from 'node:tls';
import { beforeAll, vi } from 'vitest';

/** Tests fail if a transform tries to reach an external service. */
function rejectNetwork(): never {
    throw new Error('Network access is forbidden in the unit suite. Mock the service adapter.');
}

beforeAll(() => {
    vi.stubGlobal('fetch', rejectNetwork);
    vi.spyOn(http, 'request').mockImplementation(rejectNetwork);
    vi.spyOn(http, 'get').mockImplementation(rejectNetwork);
    vi.spyOn(https, 'request').mockImplementation(rejectNetwork);
    vi.spyOn(https, 'get').mockImplementation(rejectNetwork);
    vi.spyOn(net, 'connect').mockImplementation(rejectNetwork);
    vi.spyOn(net, 'createConnection').mockImplementation(rejectNetwork);
    vi.spyOn(tls, 'connect').mockImplementation(rejectNetwork);
    vi.spyOn(console, 'debug').mockImplementation(() => undefined);
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
});
