/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { validateUser } from '@/helpers/validate-user';
import { retrieveCheckoutSession } from '@actions/billing/stripe/server-only/retrieve-checkout-session';
import { validateSessionId } from '@actions/billing/stripe/server-only/validate-session-id';
import { isApiError, standardizeError } from '@errors/api-errors';
import { getLogger } from '@services/logger';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';
import type Stripe from 'stripe';

export type RetrievedCheckoutSessionType =
    | ApiResponseOrError<{
          session: Stripe.Checkout.Session | null;
      }>
    | ApiErrorType<{
          session: Stripe.Checkout.Session | null;
      }>;

export async function retrieveExpandedCheckoutSession(
    sessionId: string,
): Promise<RetrievedCheckoutSessionType> {
    const logger = getLogger('ACTIONS:STRIPE:RETRIEVE-EXPANDED-CHECKOUT-SESSION');

    try {
        await validateUser();

        // Step 1: Validate session ID.
        const validatedSessionId = await validateSessionId(sessionId);

        // Step 2: Retrieve session, payment intent, and payment method.
        const session = await retrieveCheckoutSession(validatedSessionId);

        // Step 3: Serialize the session to convert Stripe class instance to plain object.
        // This is required for Next.js to pass the data to Client Components.
        const serializedSession = JSON.parse(JSON.stringify(session)) as Stripe.Checkout.Session;

        // Step 4: Return response.
        return {
            code: 'SESSION_RETRIEVED',
            data: {
                session: serializedSession,
            },
            description: 'The session has been successfully retrieved.',
            error: false,
            message: 'Session successfully retrieved.',
            status: 200,
            title: 'Session Retrieved',
        };
    } catch (error) {
        const errorResponse = isApiError(error) ? error : standardizeError(error);
        logger.error(['Error retrieving expanded checkout session:', errorResponse]);
        return errorResponse;
    }
}
