/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/** Diagnostic adapter for deterministic transforms; no task runtime is required. */
export const logger = {
    debug: (message: string, context?: object) => console.debug(message, context),
    info: (message: string, context?: object) => console.info(message, context),
    warn: (message: string, context?: object) => console.warn(message, context),
    error: (message: string, context?: object) => console.error(message, context),
};

export function logPhase(phase: string, message: string, context?: object): void {
    logger.debug(`${phase}: ${message}`, context);
}

export function logWarning(message: string, context?: object): void {
    logger.warn(message, context);
}
