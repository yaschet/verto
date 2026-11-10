/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { Suspense } from 'react';
import UserActivityChartRsc from '@app/(protected)/admin/dashboard/components/statistics/user-activity/user-activity-chart-rsc';
import UserActivityChartSuspense from '@app/(protected)/admin/dashboard/components/statistics/user-activity/user-activity-chart-suspense';

export function UserActivityChart() {
    return (
        <Suspense fallback={<UserActivityChartSuspense />}>
            <UserActivityChartRsc />
        </Suspense>
    );
}
