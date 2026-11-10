/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/library/utils';

export function PdfSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn('bg-surface-1 flex h-full w-full flex-col', className)}>
            {/* Toolbar Skeleton */}
            <div className="border-surface-3 dark:border-surface-800 dark:bg-surface-950 z-10 flex h-14 shrink-0 items-center justify-between border-b bg-white px-2 sm:px-4">
                {/* Page Navigation Skeleton */}
                <div className="flex items-center gap-2">
                    <Skeleton className="h-7 w-24 rounded-xl" />
                </div>

                {/* Zoom Controls Skeleton */}
                <div className="flex items-center gap-1">
                    <Skeleton className="h-7 w-7 rounded-lg" />
                    <Skeleton className="h-7 w-16 rounded-lg" />
                    <Skeleton className="h-7 w-7 rounded-lg" />
                </div>

                {/* View Options Skeleton */}
                <div className="flex items-center gap-1">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
            </div>

            {/* Content Skeleton */}
            <div className="relative flex w-full flex-1 overflow-hidden">
                <div className="flex h-full w-full items-start justify-center overflow-y-auto p-4">
                    {/* Page Skeleton */}
                    <div className="dark:bg-surface-950 relative mb-2 h-[800px] w-full max-w-[600px] overflow-hidden rounded-xl bg-white shadow-sm">
                        <div className="flex h-full w-full animate-pulse items-center justify-center bg-gray-100 dark:bg-gray-800">
                            <span className="text-surface-400 dark:text-surface-600 sr-only">
                                Loading PDF...
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
