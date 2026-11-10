/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { Suspense } from 'react';
import CreditTransactionsChartRsc from '@app/(protected)/app/dashboard/components/analytics/credit-transactions/credit-transactions-chart-rsc';
import CreditTransactionsChartSuspense from '@app/(protected)/app/dashboard/components/analytics/credit-transactions/credit-transactions-chart-suspense';

export default function CreditTransactionsChart() {
    return (
        <Suspense fallback={<CreditTransactionsChartSuspense />}>
            <CreditTransactionsChartRsc />
        </Suspense>
    );
}
