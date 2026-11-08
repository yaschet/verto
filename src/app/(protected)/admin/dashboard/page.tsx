/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import InsightsCards from '@app/(protected)/admin/dashboard/components/insights/insights-cards';
import { MetricsSection } from '@app/(protected)/admin/dashboard/components/metrics/metrics-section';
import { StatisticsSection } from '@app/(protected)/admin/dashboard/components/statistics/statistics-section';

export default function AdminDashboardPage() {
    return (
        <div className="flex w-full max-w-full flex-col gap-7">
            <InsightsCards />
            <MetricsSection />
            <StatisticsSection />
        </div>
    );
}
