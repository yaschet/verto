/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { loadStripe } from '@stripe/stripe-js';
import Stripe from 'stripe';
import { env } from '@/env';
import type { Stripe as StripeType } from '@stripe/stripe-js';

let stripePromise: Promise<StripeType | null>;

export const getStripe = () => {
    if (!stripePromise) {
        stripePromise = loadStripe(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
    }

    return stripePromise;
};

export const stripe: Stripe = new Stripe(env.STRIPE_SECRET_KEY);
