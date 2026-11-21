/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import CheckoutSuccessPage from '@app/(protected)/account/credits/checkout/[session_id]/success/checkout-success-page';
import { getQueryClient } from '@queries/tanstack/query-client';
import { stripeRetrieveCheckoutSessionQueryOptions } from '@queries/tanstack/stripe-query-options';

export default async function Page({ params }: { params: Promise<{ session_id: string }> }) {
    const paramsResolved = await params;
    const sessionId: string | null = paramsResolved.session_id ?? null;

    const queryClient = getQueryClient();
    await queryClient.prefetchQuery(stripeRetrieveCheckoutSessionQueryOptions(sessionId));

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <CheckoutSuccessPage />
        </HydrationBoundary>
    );
}
