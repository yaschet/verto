/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import AverageTranslationDurationChart from '@app/(protected)/admin/dashboard/components/metrics/average-translation-duration/average-translation-duration-chart';
import NewSignUpsChart from '@app/(protected)/admin/dashboard/components/metrics/new-sign-ups/new-sign-ups-chart';
import { SectionTitle } from '@app/(protected)/app/components/common';
import { ChartDonut } from '@ui/icons';

export function MetricsSection() {
    return (
        <div className="flex w-full max-w-full flex-col items-start justify-start gap-3">
            <SectionTitle
                description="Here you can see the metrics of the platform."
                icon={ChartDonut}
                title="Metrics"
            />

            {/* Metrics Grid */}
            <div className="grid w-full max-w-full grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
                {/* Total New Users */}
                <div className="2xl:col-span-1">
                    <NewSignUpsChart />
                </div>
                {/* Total Translations */}
                <div className="2xl:col-span-1">
                    <AverageTranslationDurationChart />
                </div>
                {/* Credits Purchases Summary */}
                <div className="2xl:col-span-1">
                    <NewSignUpsChart />
                </div>
            </div>
        </div>
    );
}

export default MetricsSection;
