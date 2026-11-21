/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { Suspense } from 'react';
import Analytics from '@app/(protected)/app/dashboard/components/analytics';
import Overview from '@app/(protected)/app/dashboard/components/overview';
import RecentTranslations from '@app/(protected)/app/dashboard/components/recent-translations';
import RecentTranslationsSuspense from '@app/(protected)/app/dashboard/components/recent-translations/recent-translations-suspense';

export default async function DashboardHomePage() {
    return (
        <div className="flex w-full max-w-full flex-col gap-7">
            <Overview />
            <Analytics />
            <Suspense fallback={<RecentTranslationsSuspense />}>
                <RecentTranslations />
            </Suspense>
        </div>
    );
}
