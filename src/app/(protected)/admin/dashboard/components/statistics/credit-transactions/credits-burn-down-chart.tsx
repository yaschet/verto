/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { Suspense } from 'react';
import CreditsBurnDownChartRsc from '@app/(protected)/admin/dashboard/components/statistics/credit-transactions/credits-burn-down-chart-rsc';
import CreditsBurnDownChartSuspense from '@app/(protected)/admin/dashboard/components/statistics/credit-transactions/credits-burn-down-chart-suspense';

export default function CreditsBurnDownChart() {
    return (
        <Suspense fallback={<CreditsBurnDownChartSuspense />}>
            <CreditsBurnDownChartRsc />
        </Suspense>
    );
}
