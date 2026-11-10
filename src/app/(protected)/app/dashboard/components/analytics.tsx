/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { AnalyticsSection } from '@app/(protected)/app/dashboard/components/analytics/analytics-section';
import CreditTransactionsChart from '@app/(protected)/app/dashboard/components/analytics/credit-transactions/credit-transactions-chart';
import TranslationPairsChart from '@app/(protected)/app/dashboard/components/analytics/translation-pairs/translation-pairs-chart';

export default async function Analytics() {
    return (
        <AnalyticsSection>
            <TranslationPairsChart />
            <CreditTransactionsChart />
        </AnalyticsSection>
    );
}
