/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { getServerUserId } from '@/helpers/user';
import { getQueryClient } from '@/src/queries/tanstack/query-client';
import CreditTransactionsChartSuspense from '@app/(protected)/app/dashboard/components/analytics/credit-transactions/credit-transactions-chart-suspense';
import { getDateRange } from '@library/time';
import { analyticsCreditTransactionsQueryOptions } from '@queries/tanstack/analytics-query-options';

// Lazy load the heavy chart client component (includes recharts ~190KB)
const CreditTransactionsChartClient = dynamic(
    () =>
        import(
            '@app/(protected)/app/dashboard/components/analytics/credit-transactions/credit-transactions-chart-client'
        ),
    {
        loading: () => <CreditTransactionsChartSuspense />,
    },
);

export default async function CreditTransactionsChartRsc() {
    const queryClient = getQueryClient();
    const userId = await getServerUserId();

    // Define the default filter:
    const defaultFilter = 'last_6_months';

    // Get the current date:
    const now = new Date();

    // Compute the startDate and endDate based on the default filter:
    const { endDate, startDate } = getDateRange(defaultFilter, now);

    await queryClient.prefetchQuery(
        analyticsCreditTransactionsQueryOptions(userId, {
            startDate,
            endDate,
        }),
    );

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <CreditTransactionsChartClient />
        </HydrationBoundary>
    );
}
