/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { Fragment } from 'react';
import { Skeleton } from '@components/ui/skeleton';

export default function LoadingTemplates() {
    return (
        <div className="flex w-full max-w-full flex-col items-start justify-start gap-3">
            <div className="flex w-full items-center justify-between gap-3">
                <div className="flex w-full items-center justify-start gap-3">
                    <Skeleton className="bg-surface-200 dark:bg-surface-800 size-8 rounded-xl" />
                    <Skeleton className="bg-surface-200 dark:bg-surface-800 h-6 w-24 rounded-xl" />
                </div>
                <div className="flex flex-row items-center justify-start gap-2">
                    <Skeleton className="bg-surface-200 dark:bg-surface-800 h-6 w-24 rounded-xl" />
                    <Skeleton className="bg-surface-200 dark:bg-surface-800 h-6 w-24 rounded-xl" />
                </div>
            </div>
            <div className="relative flex h-auto w-full max-w-full flex-col items-center justify-start gap-4">
                <div className="flex w-full max-w-full flex-col items-start justify-start gap-3">
                    <div className="from-primary-50 to-primary-200 dark:from-primary-950 dark:to-primary-900 relative mr-auto ml-0 flex h-auto w-full flex-col items-start justify-start gap-3 overflow-hidden rounded-3xl bg-linear-to-br px-7 py-14 dark:bg-linear-to-br">
                        <div className="absolute inset-0 flex size-full flex-row items-center justify-center">
                            <div className="absolute inset-0 flex size-full flex-row items-center justify-center">
                                <Skeleton className="bg-surface-300 dark:bg-surface-800 absolute -right-10 -bottom-5 z-1 aspect-square h-auto w-1/5 max-w-60 min-w-32 -rotate-45 rounded-3xl opacity-100" />
                                <Skeleton className="bg-surface-50 dark:bg-surface-900 absolute -right-10 -bottom-5 z-2 aspect-square h-auto w-1/5 max-w-60 min-w-32 rotate-[-30deg] rounded-3xl opacity-100" />
                            </div>
                        </div>
                        <div className="relative z-20 flex h-auto w-full max-w-sm flex-col items-start justify-start gap-3">
                            <div className="text-primary-400 dark:text-primary-200 flex flex-row items-center justify-start gap-1 text-xs font-bold">
                                <Skeleton className="aspect-square h-4 w-auto" />
                                <Skeleton className="h-4 w-20" />
                            </div>

                            <div className="text-primary-surface dark:text-primary-surface flex flex-row items-center justify-start gap-3">
                                <Skeleton className="aspect-square h-8 w-auto" />
                                <Skeleton className="h-6 w-48" />
                            </div>
                            <div className="flex w-full flex-col items-start justify-start gap-3">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                            <Skeleton className="h-10 w-40" />
                        </div>
                    </div>
                </div>
                <LoadingTemplatesDisplay />
            </div>
        </div>
    );
}

export function LoadingTemplatesDisplay() {
    return (
        <Fragment>
            {Array.from({ length: 3 }).map((_, index) => (
                <div
                    key={index}
                    className="relative mt-3 flex w-full max-w-full flex-col items-start justify-start gap-3"
                >
                    <div className="flex flex-row items-center justify-start gap-3">
                        <Skeleton className="bg-surface-200 dark:bg-surface-800 aspect-square h-auto w-8" />
                        <Skeleton className="bg-surface-200 dark:bg-surface-800 h-6 w-20" />
                    </div>

                    <div className="relative flex h-auto w-full max-w-full flex-col items-start justify-start gap-3">
                        <Skeleton className="bg-surface-200 dark:bg-surface-800 h-4 w-full" />
                        <Skeleton className="bg-surface-200 dark:bg-surface-800 h-4 w-full" />
                        <Skeleton className="bg-surface-200 dark:bg-surface-800 h-4 w-1/2" />
                    </div>

                    <div className="grid w-full grid-flow-row-dense grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {/* Documents that belong to the Collection ID */}
                        {Array.from({ length: 3 }).map((_ignored, templateIndex) => (
                            <LoadingTemplateCard key={templateIndex} />
                        ))}
                    </div>
                </div>
            ))}
        </Fragment>
    );
}

export function LoadingTemplateCard() {
    return (
        <div className="border-border bg-surface-0 relative flex h-auto w-full max-w-full flex-col items-center justify-start rounded-3xl border select-none">
            <div className="relative flex h-auto w-full max-w-full flex-row items-center justify-start gap-3 p-7">
                <Skeleton className="aspect-square h-12 w-auto" />
                <div className="relative flex size-auto w-auto max-w-full flex-1 flex-col items-baseline justify-start gap-1">
                    <Skeleton className="h-4 w-20" />
                </div>
            </div>

            <div className="relative flex h-auto w-full max-w-full flex-col items-start justify-start gap-3 px-7 pb-7">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
            </div>
        </div>
    );
}
