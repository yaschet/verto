/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { standardizeError } from '@errors/api-errors';
import { getLogger } from '@services/logger';

export async function validateSessionId(sessionId: string) {
    const logger = getLogger('API:PAYMENT:CHECKOUT-SESSION');

    if (!sessionId) {
        const errorResponse = standardizeError({
            code: 'MISSING_SESSION_ID',
            description: 'A session ID is required to retrieve the session.',
            error: true,
            message: 'Session ID is required.',
            status: 400,
            title: 'Missing Session ID',
        });

        logger.error(['Error retrieving session:', errorResponse]);
        throw errorResponse;
    }

    return sessionId;
}
