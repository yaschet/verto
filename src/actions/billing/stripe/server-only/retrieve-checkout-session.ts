/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { standardizeError } from '@errors/api-errors';
import { getLogger } from '@services/logger';
import { stripe } from '@utils/stripe/get-stripe';

export async function retrieveCheckoutSession(sessionId: string) {
    const logger = getLogger('API:PAYMENT:CHECKOUT-SESSION');

    try {
        return await stripe.checkout.sessions.retrieve(sessionId, {
            expand: [
                'payment_intent',
                'payment_intent.payment_method',
                'payment_intent.invoice',
                'payment_intent.latest_charge',
                'payment_intent.latest_charge.balance_transaction',
            ],
        });
    } catch {
        const errorResponse = standardizeError({
            code: 'SESSION_NOT_FOUND',
            data: {
                session: null,
            },
            description: 'The requested session could not be found.',
            error: true,
            message: 'Session not found.',
            status: 404,
            title: 'Session Not Found',
        });
        logger.error(['Error retrieving session:', errorResponse]);
        throw errorResponse;
    }
}
