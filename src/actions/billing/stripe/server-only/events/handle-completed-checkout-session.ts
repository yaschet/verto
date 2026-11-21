/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import {
    calculateDiscountAmount,
    convertCentsToDollars,
    formatAmount,
    getPaymentMethodDetails,
} from '@/constants/credits';
import { retrieveCheckoutSession } from '@actions/billing/stripe/server-only/retrieve-checkout-session';
import { getLogger } from '@services/logger';
import { createNotification } from '@/src/lib/notifications/create-notification';
import { createAdminClient } from '@utils/supabase/server';
import type Stripe from 'stripe';

export async function handleCompletedCheckoutSession(session: Stripe.Checkout.Session) {
    const logger = getLogger('API:PAYMENT:WEBHOOK:HANDLE-COMPLETED-CHECKOUT-SESSION');
    logger.info(['Completed checkout session:', session.id]);

    const supabaseAdmin = await createAdminClient();
    const expandedSession = await retrieveCheckoutSession(session.id);

    const profileId = expandedSession.client_reference_id;
    const credits = expandedSession.metadata?.credits;

    if (!profileId) {
        return logger.error([
            'Error updating credits:',
            'The profile ID is missing.',
            {
                profileId,
            },
        ]);
    } else if (!credits) {
        return logger.error([
            'Error updating credits:',
            'The credits are missing.',
            {
                credits,
            },
        ]);
    }

    // Idempotency Check: Prevent double crediting if Stripe retries the webhook
    const { data: existingTransaction } = await supabaseAdmin
        .from('credits_transactions')
        .select('id')
        .contains('details', { session_id: session.id })
        .maybeSingle();

    if (existingTransaction) {
        return logger.info(['Session already processed, skipping:', session.id]);
    }

    try {
        const CURRENCY = expandedSession.currency ?? 'usd';

        const intent = expandedSession.payment_intent as Stripe.PaymentIntent | null;
        const invoice = (intent as (Stripe.PaymentIntent & { invoice?: Stripe.Invoice | null }) | null)
            ?.invoice as Stripe.Invoice | null;
        const discountObject = invoice?.discounts?.[0] as Stripe.Discount | null;
        const charge = intent?.latest_charge as Stripe.Charge | null;
        const balanceTransaction = charge?.balance_transaction as Stripe.BalanceTransaction | null;
        const method = intent?.payment_method as Stripe.PaymentMethod | null;
        const creditsPurchased = Number(expandedSession.metadata?.credits ?? 0);

        const discountPercentOff: number =
            (discountObject as (Stripe.Discount & { coupon?: Stripe.Coupon }) | null)?.coupon?.percent_off ||
            parseInt(expandedSession.metadata?.discount as unknown as string) ||
            0;
        const discountAmountOff = calculateDiscountAmount(invoice?.subtotal ?? 0, discountPercentOff);

        const paymentMethodDetails = getPaymentMethodDetails(method);

        const subtotalInCents = expandedSession.amount_subtotal ?? invoice?.subtotal ?? intent?.amount ?? 0;
        const amountCharged =
            charge?.amount_captured ??
            charge?.amount ??
            balanceTransaction?.amount ??
            expandedSession.amount_total ??
            0;
        const amountTotal = expandedSession.amount_total ?? 0;

        const stripeCurrency = expandedSession.currency_conversion?.source_currency ?? CURRENCY;
        const amountCurrency = charge?.currency ?? CURRENCY;
        const isCurrencyDifferent = stripeCurrency !== amountCurrency;

        let conversionDetails = '';
        if (isCurrencyDifferent) {
            const sourceCurrencyAmountTotal = expandedSession.currency_conversion?.amount_total ?? 0;
            const fxRate = Number(expandedSession.currency_conversion?.fx_rate ?? 1);
            const totalInBaseCurrency = convertCentsToDollars(sourceCurrencyAmountTotal);

            const conversionMarkup = 1 + 2 / 100;
            const conversionMarkupPercentage = Number((conversionMarkup - 1) * 100).toFixed(2);

            conversionDetails = `$${totalInBaseCurrency.toFixed(2)} total converted at ${fxRate.toFixed(4)} ${stripeCurrency} (incl. ${conversionMarkupPercentage}% conversion markup).`;
        }

        const formattedDetails = {
            conversion_details: conversionDetails,
            credits: creditsPurchased,
            description: `Purchased ${creditsPurchased} credits for ${formatAmount(amountTotal, amountCurrency)}.`,
            discount_amount: formatAmount(discountAmountOff, amountCurrency),
            discount_percentage: parseInt(discountPercentOff.toString()),
            invoice_link: invoice?.hosted_invoice_url ?? null,
            invoice_pdf: invoice?.invoice_pdf ?? null,
            is_currency_different: isCurrencyDifferent,
            payment_intent_id: intent?.id ?? null,
            payment_method: paymentMethodDetails,
            payment_status: expandedSession.payment_status ?? 'unknown',
            receipt_link: charge?.receipt_url ?? null,
            receipt_pdf: charge?.receipt_url ? `${charge?.receipt_url?.split('?')[0]}/pdf?s=ap` : null,
            session_id: expandedSession.id,
            subtotal: formatAmount(subtotalInCents, amountCurrency),
            total: formatAmount(amountTotal, amountCurrency),
            total_paid: formatAmount(amountCharged, amountCurrency),
            transaction_timestamp: new Date(expandedSession.created * 1000).toLocaleString(),
        };

        const { data, error } = await supabaseAdmin.from('credits_transactions').insert({
            credits: parseInt(credits),
            description: formattedDetails.description,
            details: {
                ...formattedDetails,
            },
            profile_id: profileId,
            type: 'purchase',
        });

        if (error) {
            return logger.error(['Error updating credits:', error]);
        }

        await createNotification({
            profileId,
            type: 'payment_success',
            title: 'Payment Successful',
            message: `Your payment of ${formattedDetails.total} was successful. ${credits} credits have been added to your account.`,
            link: '/account/billing',
            metadata: {
                amount: amountTotal,
                currency: amountCurrency,
                credits: parseInt(credits),
                sessionId: expandedSession.id,
            },
        });

        await createNotification({
            profileId,
            type: 'credit_added',
            title: 'Credits Added',
            message: `${credits} credits have been added to your account.`,
            link: '/account/billing',
            metadata: {
                credits: parseInt(credits),
                type: 'purchase',
            },
        });

        return logger.info([
            `Successfully updated credits for profile ID: "${profileId}" purchased ${credits} credits.`,
            {
                data,
                error,
            },
        ]);
    } catch (error) {
        logger.error(['Error updating credits:', error]);
    }
}
