/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/library/utils';

export function EditorSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn('dark:bg-surface-950 flex h-full flex-col bg-white', className)}>
            {/* Toolbar Skeleton */}
            <div className="border-surface-2 dark:border-surface-800 sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-white px-4">
                <Skeleton className="h-8 w-24 rounded-lg" />
                <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />
                <Skeleton className="h-8 w-32 rounded-lg" />
            </div>

            {/* Content Skeleton */}
            <div className="flex-1 overflow-hidden">
                <div className="relative mx-auto max-w-4xl px-12 py-12 lg:px-12 lg:py-10">
                    <div className="space-y-4">
                        <Skeleton className="h-8 w-3/4 rounded-lg" />
                        <Skeleton className="h-4 w-full rounded" />
                        <Skeleton className="h-4 w-full rounded" />
                        <Skeleton className="h-4 w-5/6 rounded" />
                        <div className="h-8" /> {/* Spacer */}
                        <Skeleton className="h-6 w-1/2 rounded-lg" />
                        <Skeleton className="h-4 w-full rounded" />
                        <Skeleton className="h-4 w-full rounded" />
                        <Skeleton className="h-4 w-4/5 rounded" />
                    </div>
                </div>
            </div>
        </div>
    );
}
