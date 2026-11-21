/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { Suspense } from 'react';
import InsightsCardsRsc from '@app/(protected)/admin/dashboard/components/insights/insights-cards-rsc';
import InsightsCardsSuspense from '@app/(protected)/admin/dashboard/components/insights/insights-cards-suspense';

export default async function InsightsCards() {
    return (
        <Suspense fallback={<InsightsCardsSuspense />}>
            <InsightsCardsRsc />
        </Suspense>
    );
}
