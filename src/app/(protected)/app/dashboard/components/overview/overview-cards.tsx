/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { Suspense } from 'react';
import OverviewCardsRsc from '@app/(protected)/app/dashboard/components/overview/overview-cards-rsc';
import OverviewCardsSuspense from '@app/(protected)/app/dashboard/components/overview/overview-cards-suspense';

export default async function OverviewCards() {
    return (
        <Suspense fallback={<OverviewCardsSuspense />}>
            <OverviewCardsRsc />
        </Suspense>
    );
}
