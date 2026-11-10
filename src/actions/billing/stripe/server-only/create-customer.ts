/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { standardizeError } from '@errors/api-errors';
import { stripe } from '@utils/stripe/get-stripe';
import { createAdminClient, createServerClient } from '@utils/supabase/server';
import type { Profile } from '@/types/auth/user';
import type { UserShippingAddressSchema } from '@schemas/billing-schemas';
import type { User } from '@supabase/supabase-js';
import type { z } from 'zod';

/**
 * Creates a new Stripe customer for the user.
 *
 * @category Stripe
 * @category Actions
 * @example
 *     const customer = await createStripeCustomer(profile, user, customerShippingAddress);
 *
 * @param profile - The user profile information.
 * @param user - The user information.
 * @param customerShippingAddress - The customer shipping address information.
 * @returns The ID of the newly created Stripe customer.
 * @throws ApiErrorType - An error if the customer could not be created or if the customer ID could not be updated in
 *   the database.
 * @note This helper action is only available on the server.
 */
export async function createStripeCustomer(
    profile: Profile,
    user: User,
    customerShippingAddress: z.infer<typeof UserShippingAddressSchema> | null,
) {
    // Step 1: Check if the user has a valid Stripe customer ID.
    if (profile.stripe_customer_id) {
        try {
            const existingCustomer = await stripe.customers.retrieve(profile.stripe_customer_id);
            if (existingCustomer && !existingCustomer.deleted) {
                return profile.stripe_customer_id;
            }
        } catch {
            // If the customer ID is invalid or an error occurs, proceed to create a new customer.
            console.error(`Failed to retrieve customer with ID: ${profile.stripe_customer_id}`);
        }
    }

    // Step 2: Verify if Stripe already has a customer with the same email.
    const existingCustomer = await stripe.customers.list({ email: profile?.email ?? user?.email });

    if (existingCustomer.data.length > 0) {
        const existingCustomerId = existingCustomer.data[0].id;
        const supabase = await createServerClient();
        const { error: dbCustomerError } = await supabase
            .from('profiles')
            .update({ stripe_customer_id: existingCustomerId })
            .eq('id', user.id);

        if (dbCustomerError) {
            throw standardizeError({
                code: 'CUSTOMER_DB_UPDATE_ERROR',
                description: 'An error occurred while updating the customer ID in the database.',
                error: true,
                message: 'Failed to update the database.',
                status: 500,
                title: 'Database Update Error',
            });
        }

        return existingCustomerId;
    }

    // Step 3: Create a new Stripe customer.
    const customer = await stripe.customers.create({
        email: profile?.email ?? user?.email ?? undefined,
        metadata: {
            profile_id: user.id,
        },
        name: profile?.full_name ?? user.user_metadata.full_name ?? undefined,
        phone: profile?.phone ?? user?.phone ?? undefined,
        shipping: customerShippingAddress
            ? {
                  address: {
                      city: customerShippingAddress.city,
                      country: customerShippingAddress.country,
                      line1: customerShippingAddress.address,
                      postal_code: customerShippingAddress.zip_code,
                      state: customerShippingAddress.state,
                  },
                  name: customerShippingAddress.full_name,
                  phone: customerShippingAddress.phone,
              }
            : undefined,
    });

    if (!customer) {
        throw standardizeError({
            code: 'CUSTOMER_CREATION_ERROR',
            description: 'An error occurred while creating the customer.',
            error: true,
            message: 'Failed to create customer.',
            status: 500,
            title: 'Customer Creation Error',
        });
    }

    const userId = user.id;
    const customerId = customer.id;

    const supabase = await createAdminClient();
    const { error: dbCustomerError } = await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);

    if (dbCustomerError) {
        throw standardizeError({
            code: 'CUSTOMER_DB_UPDATE_ERROR',
            description: 'An error occurred while updating the customer ID in the database.',
            error: true,
            message: 'Failed to update the database.',
            status: 500,
            title: 'Database Update Error',
        });
    }

    return customer.id;
}
