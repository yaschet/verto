/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { DefaultCard } from '@ui/card';
import { Skeleton } from '@ui/skeleton';

export default function AverageTranslationDurationChartSuspense() {
    return (
        <DefaultCard className="flex h-full w-full flex-col gap-6">
            <div className="flex w-full flex-col items-start justify-start gap-3">
                <Skeleton className="bg-surface-200 dark:bg-surface-900 h-5 w-3/6 max-w-xs rounded-xl"></Skeleton>
                <div className="flex w-full flex-col items-start justify-start gap-2">
                    <Skeleton className="bg-surface-200 dark:bg-surface-900 h-2 w-1/2 max-w-sm rounded-xl"></Skeleton>
                    <Skeleton className="bg-surface-200 dark:bg-surface-900 h-2 w-1/3 max-w-sm rounded-xl"></Skeleton>
                </div>
            </div>

            <div className="mt-4 flex h-full flex-1 items-baseline space-x-3 p-5">
                <Skeleton className="bg-surface-200 dark:bg-surface-900 mx-auto aspect-square h-full w-full max-w-48 rounded-full"></Skeleton>
            </div>

            <div className="flex w-full flex-col items-center justify-center gap-3">
                <Skeleton className="bg-surface-200 dark:bg-surface-900 h-4 w-3/6 max-w-xs rounded-xl"></Skeleton>
                <Skeleton className="bg-surface-200 dark:bg-surface-900 h-3 w-5/6 max-w-sm rounded-xl"></Skeleton>
            </div>

            <span className="sr-only">Loading...</span>
        </DefaultCard>
    );
}
