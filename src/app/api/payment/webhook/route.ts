/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { env } from '@/env';
import { logUserActivity } from '@/helpers/activity-logger';
import { handleCompletedCheckoutSession } from '@actions/billing/stripe/server-only/events/handle-completed-checkout-session';
import { handleFailedCheckoutSession } from '@actions/billing/stripe/server-only/events/handle-failed-checkout-session';
import { isApiError, standardizeError } from '@errors/api-errors';
import { getLogger } from '@services/logger';
import type { NextRequest } from 'next/server';

const endpointSecret = env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
    const logger = getLogger('API:PAYMENT:WEBHOOK');
    try {
        const rawBody = await request.text();
        const signature: string = (request.headers.get('Stripe-Signature') as string) || '';
        const webhookSecret: string = endpointSecret as string;

        let event: Stripe.Event;

        try {
            if (!rawBody) {
                logger.error('The request body is missing.');
                return NextResponse.json(
                    standardizeError({
                        code: 'MISSING_REQUEST_BODY',
                        description: 'The request body is missing.',
                        error: true,
                        message: 'Request body is missing.',
                        status: 400,
                        title: 'Missing Request Body',
                    }),
                    { status: 400 },
                );
            }

            if (!webhookSecret || !signature) {
                logger.error('The webhook secret or signature is missing.');
                return NextResponse.json(
                    standardizeError({
                        code: 'MISSING_WEBHOOK_SECRET',
                        description: 'The webhook secret or signature is missing.',
                        error: true,
                        message: 'Webhook secret or signature is missing.',
                        status: 400,
                        title: 'Missing Webhook Secret',
                    }),
                    { status: 400 },
                );
            }

            event = Stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
        } catch (error) {
            const errorResponse = standardizeError(error);
            logger.error(['Error verifying the webhook event:', errorResponse]);
            return NextResponse.json(errorResponse, { status: errorResponse.status });
        }

        const relevantEvents = [
            'checkout.session.completed',
            'checkout.session.async_payment_failed',
            'customer.deleted',
        ];

        if (!relevantEvents.includes(event.type)) {
            return NextResponse.json(
                standardizeError({
                    code: 'UNEXPECTED_EVENT_TYPE',
                    description: 'Unexpected event type.',
                    error: true,
                    message: 'Unexpected event type.',
                    status: 400,
                    title: 'Unexpected Event Type',
                }),
                { status: 400 },
            );
        }

        switch (event.type) {
            case 'checkout.session.completed':
                await handleCompletedCheckoutSession(event.data.object as Stripe.Checkout.Session);
                await logUserActivity(
                    (event?.data?.object?.customer as string | null) ?? '',
                    'completed_checkout',
                );
                break;
            case 'checkout.session.async_payment_failed':
                await handleFailedCheckoutSession(event.data.object as Stripe.Checkout.Session);
                await logUserActivity(
                    (event?.data?.object?.customer as string | null) ?? '',
                    'failed_checkout',
                );
                break;
            case 'customer.deleted':
                break;
        }

        logger.info(['Received event:', event]);

        logger.info(['Event handled successfully:', event?.id]);
        return NextResponse.json(
            {
                code: 'WEBHOOK_EVENT_HANDLED',
                description: 'The webhook event was handled successfully.',
                message: 'Webhook event handled successfully.',
                status: 200,
                success: true,
                title: 'Webhook Event Handled',
            },
            { status: 200 },
        );
    } catch (error) {
        const errorResponse = isApiError(error) ? error : standardizeError(error);
        logger.error(['Error handling webhook event:', errorResponse]);
        return NextResponse.json(errorResponse, { status: errorResponse.status });
    }
}
