/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { validateUser } from '@/helpers/validate-user';
import { createStripeSession } from '@actions/billing/stripe/server-only/create-checkout-session';
import { createStripeCustomer } from '@actions/billing/stripe/server-only/create-customer';
import { standardizeError } from '@errors/api-errors';
import { validateShippingAddress } from '@schemas/billing-schemas';
import { validateCredits } from '@schemas/credit-schemas';
import { getLogger } from '@services/logger';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';
import type { UserShippingAddressSchema } from '@schemas/billing-schemas';

export type PaymentCheckoutSessionResponse =
    | ApiResponseOrError<{
          paymentUrl?: string | null;
          sessionId?: string | null;
      }>
    | ApiErrorType;

export async function POST(request: Request): Promise<NextResponse<PaymentCheckoutSessionResponse>> {
    const logger = getLogger('API:PAYMENT:CHECKOUT-SESSION');

    try {
        // Step 1: Validate user and profile.
        const { profile, user } = await validateUser();

        // Step 2: Validate shipping address.
        const customerShippingAddress: z.infer<typeof UserShippingAddressSchema> | null =
            await validateShippingAddress(profile);

        const customerId = await createStripeCustomer(profile, user, customerShippingAddress);

        // Step 3: Validate credits.
        const body = (await request.json()) as { credits: number } | null;
        const creditsAmount: number | null = body?.credits ?? null;
        const { credits } = await validateCredits(creditsAmount);

        // Step 4: Create checkout session.
        const session = await createStripeSession(user, customerId, credits);

        // Step 5: Return response.
        return NextResponse.json(
            {
                code: 'STRIPE_SESSION_CREATED',
                data: {
                    paymentUrl: session.url,
                    sessionId: session.id,
                },
                description: 'You will be redirected to the payment page shortly.',
                message: 'Checkout session has been created successfully',
                status: 200,
                title: 'Checkout Session Created',
            },
            { status: 200 },
        );
    } catch (error) {
        logger.error(['Error creating checkout session:', error]);
        const errorResponse =
            error instanceof z.ZodError
                ? standardizeError({
                      code: 'VALIDATION_ERROR',
                      description:
                          'There was an issue with the input provided. Please ensure all fields are correctly formatted.',
                      error: true,
                      message: error.issues.map((issue) => issue.message).join(', '),
                      status: 400,
                      title: 'Invalid Input',
                  })
                : standardizeError(error);

        return NextResponse.json(errorResponse, { status: errorResponse.status });
    }
}
