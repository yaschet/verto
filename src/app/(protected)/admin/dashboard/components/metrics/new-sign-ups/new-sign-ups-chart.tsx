/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { Suspense } from 'react';
import NewSignUpsChartRsc from '@app/(protected)/admin/dashboard/components/metrics/new-sign-ups/new-sign-ups-chart-rsc';
import NewSignUpsChartSuspense from '@app/(protected)/admin/dashboard/components/metrics/new-sign-ups/new-sign-ups-chart-suspense';

export default function NewSignUpsChart() {
    return (
        <Suspense fallback={<NewSignUpsChartSuspense />}>
            <NewSignUpsChartRsc />
        </Suspense>
    );
}
