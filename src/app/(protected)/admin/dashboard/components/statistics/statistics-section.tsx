/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import CreditsBurnDownChart from '@app/(protected)/admin/dashboard/components/statistics/credit-transactions/credits-burn-down-chart';
import { RevenueTrendsChart } from '@app/(protected)/admin/dashboard/components/statistics/revenue-trends/revenue-trends-chart';
import TranslationPairsChart from '@app/(protected)/admin/dashboard/components/statistics/translation-pairs/translation-pairs-chart';
import { UserActivityChart } from '@app/(protected)/admin/dashboard/components/statistics/user-activity/user-activity-chart';
import { SectionTitle } from '@app/(protected)/app/components/common';
import { ChartDonut } from '@ui/icons';

export function StatisticsSection() {
    return (
        <div className="flex w-full max-w-full flex-col items-start justify-start gap-3">
            <SectionTitle
                description="Here you can see the statistics of the platform."
                icon={ChartDonut}
                title="Statistics"
            />

            {/* Statistics Grid */}
            <div className="grid w-full max-w-full grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
                {/* Overall Translation Volume — Area Chart */}
                <div className="h-full xl:col-span-1 2xl:col-span-2">
                    <RevenueTrendsChart />
                </div>
                {/* Revenue Trends (Dollars) — Line Chart */}
                <div className="h-full xl:col-span-1 2xl:col-span-1">
                    <UserActivityChart />
                </div>
                {/* Translation Pairs — Bar Chart per Language / Month */}
                <div className="h-full xl:col-span-1">
                    <TranslationPairsChart />
                </div>
                {/* Credits Burn Down — Area Chart */}
                <div className="h-full xl:col-span-1 2xl:col-span-2">
                    <CreditsBurnDownChart />
                </div>
            </div>
        </div>
    );
}

export default StatisticsSection;
