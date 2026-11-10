/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { Suspense } from 'react';
import RevenueTrendsChartRsc from '@app/(protected)/admin/dashboard/components/statistics/revenue-trends/revenue-trends-chart-rsc';
import RevenueTrendsChartSuspense from '@app/(protected)/admin/dashboard/components/statistics/revenue-trends/revenue-trends-chart-suspense';

export function RevenueTrendsChart() {
    return (
        <Suspense fallback={<RevenueTrendsChartSuspense />}>
            <RevenueTrendsChartRsc />
        </Suspense>
    );
}
