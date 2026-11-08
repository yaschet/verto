/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import type { User } from '@supabase/supabase-js';
import { calculateTotalPrice, convertDollarsToCents, getOriginalPricePerUnit } from '@/constants/credits';
import { env } from '@/env';
import { stripe } from '@utils/stripe/get-stripe';
import type Stripe from 'stripe';

/**
 * Creates a Stripe Checkout Session for purchasing prepaid credits.
 *
 * @param {any} user - The user object.
 * @param {string} customerId - The Stripe customer ID.
 * @param {number} credits - The number of credits to purchase.
 * @returns {Promise<Stripe.Checkout.Session>} - The created Stripe Checkout Session.
 */
export async function createStripeSession(
    user: Pick<User, 'id' | 'email'>,
    customerId: string,
    credits: number,
): Promise<Stripe.Checkout.Session> {
    // We use the "Charm Pricing" (e.g. $49 for 50 credits) as the source of truth
    const targetTotalPrice = calculateTotalPrice(credits);
    const originalUnitPrice = getOriginalPricePerUnit(credits);

    const totalOriginalPrice = originalUnitPrice * credits;
    const discountAmount = totalOriginalPrice - targetTotalPrice;

    // Use amount_off to ensure we hit the exact charm price
    // e.g. 50 credits * $1.50 = $75.00. Target $49.00. Discount = $26.00.
    const discountAmountInCents = convertDollarsToCents(discountAmount);
    const unitPriceInCents = convertDollarsToCents(originalUnitPrice);

    let coupon: Stripe.Coupon | undefined = undefined;

    // Only create a coupon if there is a discount
    if (discountAmountInCents > 0) {
        coupon = await stripe.coupons.create({
            amount_off: discountAmountInCents,
            currency: 'usd',
            duration: 'once',
            name: `${credits} VTC Pack Discount`,
        });
    }

    const serviceDescription = `Purchase ${credits} prepaid credits for use on the Verto platform. Each credit allows for the translation of one document. Credits never expire and can be refunded within 60 days of purchase by contacting support.`;

    const effectiveUnitPrice = targetTotalPrice / credits;
    const discountPercentage = (discountAmount / totalOriginalPrice) * 100;

    return stripe.checkout.sessions.create({
        cancel_url: `${env.NEXT_PUBLIC_APP_URL}/account/credits/checkout/{CHECKOUT_SESSION_ID}/cancel`,
        client_reference_id: user?.id,
        customer: customerId,
        discounts: coupon ? [{ coupon: coupon.id }] : undefined,
        invoice_creation: {
            enabled: true,
        },
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        description: serviceDescription,
                        metadata: {
                            credits,
                            discount: discountPercentage.toFixed(2),
                            totalPrice: targetTotalPrice.toFixed(2),
                            unitPrice: effectiveUnitPrice.toFixed(2),
                        },
                        name: `${credits} VTC`,
                    },
                    unit_amount: unitPriceInCents,
                },
                quantity: credits,
            },
        ],
        locale: 'auto',
        metadata: {
            credits,
            discount: discountPercentage,
            refund_policy: 'Refunds available within 60 days by contacting support.',
            service_description: serviceDescription,
            totalPrice: targetTotalPrice,
            unitPrice: effectiveUnitPrice,
        },
        mode: 'payment',
        payment_intent_data: {
            metadata: {
                credits,
                discount: discountPercentage,
                refund_policy: 'Refunds available within 60 days by contacting support.',
                totalPrice: targetTotalPrice,
                unitPrice: effectiveUnitPrice,
            },
        },
        payment_method_options: {
            wechat_pay: {
                client: 'web',
            },
        },
        saved_payment_method_options: {
            payment_method_save: 'enabled',
        },
        submit_type: 'pay',
        success_url: `${env.NEXT_PUBLIC_APP_URL}/account/credits/checkout/{CHECKOUT_SESSION_ID}/success`,
        ui_mode: 'hosted',
        // payment_method_types: ['card', 'link', 'alipay', 'amazon_pay', 'wechat_pay'],
        // consent_collection: {
        //     terms_of_service: 'required',
        // },
        // custom_text: {
        //     after_submit: { message: 'You will be redirected to the payment page shortly.' },
        //     submit: { message: 'Pay Now' },
        //     terms_of_service_acceptance: {
        //         message: 'By clicking "Pay Now" you agree to our Terms of Service.',
        //     },
        // },
    });
}
