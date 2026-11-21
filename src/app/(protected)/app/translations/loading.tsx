/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { LoadingStateTable } from '@/src/app/(protected)/app/components/table-states/loading-table';
import { TRANSLATION_COLUMNS } from '@/src/app/(protected)/app/translations/table/translations-columns';
import { Skeleton } from '@/src/components/ui/skeleton';
import { cn } from '@/src/library/utils';
import { ScrollArea, ScrollBar } from '@components/ui/scroll-area';

export default function LoadingTranslationsPage() {
    return (
        <div className="flex w-full max-w-full flex-col gap-7">
            {/* Section for Recent Translations, displaying a data table with a limit of 5 rows. */}
            <div className="flex w-full max-w-full flex-col items-start justify-start gap-3">
                {/* Title of the Section */}
                <div className={cn('flex w-full items-center justify-between gap-3')}>
                    <div className="flex w-full items-center justify-start gap-3">
                        <Skeleton className="bg-surface-200 dark:bg-surface-800 size-8 rounded-xl" />
                        <Skeleton className="bg-surface-200 dark:bg-surface-800 h-6 w-24 rounded-xl" />
                    </div>
                    <div className="flex flex-row items-center justify-start gap-2">
                        <Skeleton className="bg-surface-200 dark:bg-surface-800 h-6 w-24 rounded-xl" />
                        <Skeleton className="bg-surface-200 dark:bg-surface-800 h-6 w-24 rounded-xl" />
                    </div>
                </div>
                {/* Cards */}
                <div className="relative flex h-auto w-full max-w-full flex-row items-center justify-start gap-4">
                    <div className="border-border bg-surface-0 relative flex h-auto w-full max-w-full flex-row items-center justify-start rounded-3xl border p-7">
                        <ScrollArea className="flex w-full flex-col gap-2">
                            <LoadingStateTable columns={TRANSLATION_COLUMNS} />
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                    </div>
                </div>
            </div>
        </div>
    );
}
