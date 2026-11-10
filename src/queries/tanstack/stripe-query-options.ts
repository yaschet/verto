/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { queryOptions } from '@tanstack/react-query';
import { openCustomerPortal } from '@actions/billing/stripe/open-customer-portal';
import { retrieveExpandedCheckoutSession } from '@actions/billing/stripe/retrieve-expanded-checkout-session';
import { standardizeError } from '@errors/api-errors';
import { getLogger } from '@services/logger';
import type { ApiErrorType } from '@/types/rest/errors';
import type { RetrievedCheckoutSessionType } from '@actions/billing/stripe/retrieve-expanded-checkout-session';
import type { CustomerPortalResponse } from '@app/api/payment/customer-portal/route';
import type { UndefinedInitialDataOptions } from '@tanstack/react-query';

export type StripeCheckoutSessionQueryResponse = RetrievedCheckoutSessionType | ApiErrorType;

export type StripeCheckoutSessionQueryData = RetrievedCheckoutSessionType | ApiErrorType;

export const stripeRetrieveCheckoutSessionQueryOptions = (
    sessionId: string | null,
    otherOptions: Partial<
        UndefinedInitialDataOptions<
            StripeCheckoutSessionQueryResponse,
            ApiErrorType,
            StripeCheckoutSessionQueryData,
            ['stripe-checkout-session', string | null]
        >
    > = {},
) => {
    return queryOptions<
        StripeCheckoutSessionQueryResponse,
        ApiErrorType,
        StripeCheckoutSessionQueryData,
        ['stripe-checkout-session', string | null]
    >({
        queryFn: async () => {
            const logger = getLogger('QUERIES:TANSTACK:STRIPE-CHECKOUT-SESSION-QUERY-OPTIONS');

            if (!sessionId) {
                logger.error('A session ID is required to retrieve the session.');
                throw standardizeError({
                    code: 'MISSING_SESSION_ID',
                    description: 'A session ID is required to retrieve the session.',
                    error: true,
                    message: 'Session ID is required.',
                    status: 400,
                    title: 'Missing Session ID',
                });
            }

            const response = await retrieveExpandedCheckoutSession(sessionId);

            if (!response || response.error) {
                logger.error(['Error retrieving checkout session:', response]);
                throw JSON.parse(JSON.stringify(response)) as ApiErrorType;
            }

            return JSON.parse(JSON.stringify(response)) as RetrievedCheckoutSessionType;
        },
        queryKey: ['stripe-checkout-session', sessionId],
        refetchInterval: false,
        refetchIntervalInBackground: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
        retry: false,
        retryDelay: (attempt) => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000),
        retryOnMount: false,
        ...otherOptions,
    });
};

export type StripeCustomerPortalQueryResponse = CustomerPortalResponse | ApiErrorType;

export type StripeCustomerPortalQueryData = CustomerPortalResponse | ApiErrorType;

export const stripeCustomerPortalQueryOptions = (userId?: string | null | undefined) =>
    queryOptions<
        StripeCustomerPortalQueryResponse,
        ApiErrorType,
        StripeCustomerPortalQueryData,
        ['stripe-customer-portal', string | null | undefined]
    >({
        enabled: !!userId,
        queryFn: async () => {
            const logger = getLogger('QUERIES:TANSTACK:STRIPE-CUSTOMER-PORTAL-QUERY-OPTIONS');

            const response = await openCustomerPortal();

            if (response.error) {
                logger.error(['Error retrieving customer portal:', response]);
                throw JSON.parse(JSON.stringify(response)) as ApiErrorType;
            }

            return JSON.parse(JSON.stringify(response)) as CustomerPortalResponse;
        },
        queryKey: ['stripe-customer-portal', userId],
        refetchInterval: false,
        refetchIntervalInBackground: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
        retry: false,
        retryDelay: (attempt) => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000),
        retryOnMount: false,
    });
