/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { DefaultCard } from '@components/ui/card';
import { Skeleton } from '@components/ui/skeleton';

export default function TranslationPairsChartSuspense() {
    return (
        <DefaultCard className="flex h-full w-full flex-col items-center justify-between gap-6">
            <div className="flex w-full animate-pulse flex-col items-start justify-start gap-3">
                <div className="bg-surface-200 dark:bg-surface-900 h-6 w-3/6 max-w-xs rounded-xl"></div>
                <div className="bg-surface-200 dark:bg-surface-900 h-4 w-5/6 max-w-sm rounded-xl"></div>
            </div>

            <div className="mt-4 flex h-full w-full flex-1 animate-pulse items-end justify-between gap-3">
                <Skeleton className="bg-surface-200 dark:bg-surface-800 h-80 w-full rounded-t-xl"></Skeleton>
                <Skeleton className="bg-surface-200 dark:bg-surface-800 h-64 w-full rounded-t-xl"></Skeleton>
                <Skeleton className="bg-surface-200 dark:bg-surface-800 h-72 w-full rounded-t-xl"></Skeleton>
                <Skeleton className="bg-surface-200 dark:bg-surface-800 h-64 w-full rounded-t-xl"></Skeleton>
                <Skeleton className="bg-surface-200 dark:bg-surface-800 h-80 w-full rounded-t-xl"></Skeleton>
                <Skeleton className="bg-surface-200 dark:bg-surface-800 h-72 w-full rounded-t-xl"></Skeleton>
                <Skeleton className="bg-surface-200 dark:bg-surface-800 h-80 w-full rounded-t-xl"></Skeleton>
            </div>

            <span className="sr-only">Loading...</span>
        </DefaultCard>
    );
}
