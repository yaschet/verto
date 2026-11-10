/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

await import('./src/env.ts');

/** @type {import('next').NextConfig} */
const config = {
    reactStrictMode: false,
    agentRules: false,
    poweredByHeader: false,
    devIndicators: false,
    serverExternalPackages: ['googleapis', 'google-auth-library'],
};

export default config;
