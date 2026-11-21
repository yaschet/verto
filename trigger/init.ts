/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * Trigger.dev initialization file
 * This file is automatically loaded when a task is executed, before any task code runs.
 *
 * Purpose: Ensure Node.js globals (Buffer, process, etc.) are available in the execution environment
 * This fixes issues with Google Cloud packages that depend on Buffer.prototype
 */

import { Buffer as NodeBuffer } from 'node:buffer';

// Ensure Buffer is available as a global (needed for google-auth-library and crypto dependencies)
if (typeof globalThis.Buffer === 'undefined') {
    globalThis.Buffer = NodeBuffer;
    console.log('[init] Injected Buffer global for crypto dependencies');
}

// Verify Buffer is now available
if (typeof Buffer === 'undefined') {
    throw new Error('[init] Failed to inject Buffer global - crypto packages may fail');
}

// Log initialization complete
console.log('[init] Trigger.dev environment initialized successfully');
