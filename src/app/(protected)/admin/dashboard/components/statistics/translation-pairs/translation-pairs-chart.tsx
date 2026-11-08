/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { Suspense } from 'react';
import TranslationPairsChartRsc from '@app/(protected)/admin/dashboard/components/statistics/translation-pairs/translation-pairs-chart-rsc';
import TranslationPairsChartSuspense from '@app/(protected)/admin/dashboard/components/statistics/translation-pairs/translation-pairs-chart-suspense';

export default function TranslationPairsChart() {
    return (
        <Suspense fallback={<TranslationPairsChartSuspense />}>
            <TranslationPairsChartRsc />
        </Suspense>
    );
}
