/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import tls from 'node:tls';
import { syncBuiltinESMExports } from 'node:module';

const localHosts = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
function requireLocal(target) {
    const host =
        typeof target === 'string' || target instanceof URL
            ? new URL(target).hostname
            : (target?.hostname ?? target?.host ?? 'localhost');
    if (!localHosts.has(host)) throw new Error('External network access is disabled in offline mode.');
}
for (const protocol of [http, https]) {
    for (const method of ['request', 'get']) {
        const original = protocol[method];
        protocol[method] = function (target, ...args) {
            requireLocal(target);
            return original.call(this, target, ...args);
        };
    }
}
for (const protocol of [net, tls]) {
    for (const method of ['connect', ...(protocol === net ? ['createConnection'] : [])]) {
        const original = protocol[method];
        protocol[method] = function (...args) {
            const target =
                typeof args[0] === 'object'
                    ? args[0]
                    : { host: typeof args[1] === 'string' ? args[1] : 'localhost' };
            if (!target.path) requireLocal(target);
            return original.apply(this, args);
        };
    }
}
const originalFetch = globalThis.fetch;
globalThis.fetch = function (target, init) {
    requireLocal(typeof target === 'string' || target instanceof URL ? target : target.url);
    return originalFetch(target, init);
};
syncBuiltinESMExports();
