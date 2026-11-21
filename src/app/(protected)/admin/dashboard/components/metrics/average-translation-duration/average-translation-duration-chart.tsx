/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { Suspense } from 'react';
import AverageTranslationDurationChartRsc from '@app/(protected)/admin/dashboard/components/metrics/average-translation-duration/average-translation-duration-chart-rsc';
import AverageTranslationDurationChartSuspense from '@app/(protected)/admin/dashboard/components/metrics/average-translation-duration/average-translation-duration-chart-suspense';

export default function AverageTranslationDurationChart() {
    return (
        <Suspense fallback={<AverageTranslationDurationChartSuspense />}>
            <AverageTranslationDurationChartRsc />
        </Suspense>
    );
}
