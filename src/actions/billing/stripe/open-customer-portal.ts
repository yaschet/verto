/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { z } from 'zod';
import { env } from '@/env';
import { validateUser } from '@/helpers/validate-user';
import { createStripeCustomer } from '@actions/billing/stripe/server-only/create-customer';
import { standardizeError } from '@errors/api-errors';
import { validateShippingAddress } from '@schemas/billing-schemas';
import { getLogger } from '@services/logger';
import { stripe } from '@utils/stripe/get-stripe';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';
import type { UserShippingAddressSchema } from '@schemas/billing-schemas';

export type CustomerPortalResponse =
    | ApiResponseOrError<{
          customerPortalUrl?: string | null;
          sessionId?: string | null;
      }>
    | ApiErrorType;

export async function openCustomerPortal(): Promise<CustomerPortalResponse> {
    const logger = getLogger('API:PAYMENT:CUSTOMER-PORTAL');

    try {
        // Step 1: Validate user and profile.
        const { profile, user } = await validateUser();

        // Step 2: Validate shipping address.
        const customerShippingAddress: z.infer<typeof UserShippingAddressSchema> | null =
            await validateShippingAddress(profile);

        const customerId = await createStripeCustomer(profile, user, customerShippingAddress);

        // Step 4: Create checkout session.
        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${env.NEXT_PUBLIC_APP_URL}/account/billing`,
        });

        // Step 5: Return response.
        return {
            code: 'STRIPE_CUSTOMER_PORTAL_CREATED',
            data: {
                customerPortalUrl: session.url,
                sessionId: session.id,
            },
            description: 'You will be redirected to the customer portal shortly.',
            message: 'Customer portal has been created successfully.',
            status: 200,
            title: 'Customer Portal Created',
        };
    } catch (error) {
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

        logger.error(['Error creating customer portal:', errorResponse]);

        return errorResponse;
    }
}
