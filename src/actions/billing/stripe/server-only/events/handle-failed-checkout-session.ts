/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { createNotification } from '@/src/lib/notifications/create-notification';
import { getLogger } from '@services/logger';
import type Stripe from 'stripe';

/**
 * Handle the checkout session for a failed payment.
 *
 * @param session - The checkout session.
 */
export async function handleFailedCheckoutSession(session: Stripe.Checkout.Session) {
    const logger = getLogger('API:PAYMENT:WEBHOOK:HANDLE-FAILED-CHECKOUT-SESSION');
    logger.error(['Failed checkout session:', session.id]);

    // Extract necessary information from the session
    const profileId = session.client_reference_id;
    const credits = session.metadata?.credits;

    if (!profileId || !credits) {
        logger.error('Missing profile ID or credits in session metadata.');
        return;
    }

    // For example, notify the user or log the failure for further analysis
    logger.error(`Payment failed for profile ID: ${profileId} with credits: ${credits}`);

    await createNotification({
        profileId,
        type: 'payment_failed',
        title: 'Payment Failed',
        message: 'Your payment could not be processed. Please check your payment method and try again.',
        link: '/account/billing',
        metadata: {
            credits: parseInt(credits),
            sessionId: session.id,
        },
    });
}
