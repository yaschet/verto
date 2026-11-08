/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { NextResponse } from 'next/server';
import { validateUser } from '@/helpers/validate-user';
import { isApiError, standardizeError } from '@errors/api-errors';
import { getLogger } from '@services/logger';
import { stripe } from '@utils/stripe/get-stripe';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';
import type Stripe from 'stripe';

export type RetrieveCheckoutSessionResponse =
    | ApiResponseOrError<{
          session: Stripe.Checkout.Session | null;
      }>
    | ApiErrorType;

export async function GET(
    _request: Request,
    props: { params: Promise<{ session_id: string }> },
): Promise<NextResponse<RetrieveCheckoutSessionResponse>> {
    const params = await props.params;
    const logger = getLogger('API:PAYMENT:CHECKOUT-SESSION');

    try {
        await validateUser();

        // Step 1: Validate session ID.
        const sessionId = params.session_id ?? null;

        if (!sessionId) {
            const errorResponse: ApiErrorType = standardizeError({
                code: 'MISSING_SESSION_ID',
                description: 'A session ID is required to retrieve the session.',
                error: true,
                message: 'Session ID is required.',
                status: 400,
                title: 'Missing Session ID',
            });

            logger.error(['Error retrieving session:', errorResponse]);
            return NextResponse.json(errorResponse, { status: errorResponse.status });
        }

        // Step 2: Retrieve session, payment intent, and payment method.
        let session: Stripe.Checkout.Session | null = null;

        try {
            session = await stripe.checkout.sessions.retrieve(sessionId, {
                expand: [
                    'payment_intent',
                    'payment_intent.payment_method',
                    'payment_intent.invoice',
                    'payment_intent.invoice.charge',
                ],
            });
        } catch {
            const errorResponse = standardizeError({
                code: 'SESSION_NOT_FOUND',
                description: 'The requested session could not be found.',
                error: true,
                message: 'Session not found.',
                status: 404,
                title: 'Session Not Found',
            });
            logger.error(['Error retrieving session:', errorResponse]);
            return NextResponse.json(errorResponse, { status: errorResponse.status });
        }

        if (!session) {
            const errorResponse = standardizeError({
                code: 'SESSION_NOT_FOUND',
                description: 'The requested session could not be found.',
                error: true,
                message: 'Session not found.',
                status: 404,
                title: 'Session Not Found',
            });

            logger.error(['Error retrieving session:', errorResponse]);
            return NextResponse.json(errorResponse, { status: errorResponse.status });
        }

        // Step 3: Return response.
        return NextResponse.json(
            {
                code: 'SESSION_RETRIEVED',
                data: {
                    session,
                },
                description: 'The session has been successfully retrieved.',
                error: false,
                message: 'Session successfully retrieved.',
                status: 200,
                title: 'Session Retrieved',
            },
            { status: 200 },
        );
    } catch (error) {
        logger.error(['Error retrieving expanded checkout session:', error]);
        const errorResponse = isApiError(error) ? error : standardizeError(error);
        return NextResponse.json(errorResponse, { status: errorResponse.status });
    }
}
