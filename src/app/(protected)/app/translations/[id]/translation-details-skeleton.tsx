/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { DefaultCard } from '@/components/ui/card';
import { Skeleton } from '@components/ui/skeleton';

export default function TranslationDetailsSkeleton() {
    return (
        <div className="flex w-full max-w-full flex-col gap-6">
            {/* Header with Back button and Actions */}
            <div className="flex items-center justify-between gap-4">
                <Skeleton className="h-10 w-24 rounded-lg" />
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-40 rounded-lg" />
                </div>
            </div>

            {/* Hero Card Skeleton - Inverted Style */}
            <DefaultCard className="relative overflow-hidden bg-black p-6">
                <div className="flex items-start gap-4">
                    {/* File Type Icon */}
                    <Skeleton className="size-14 rounded-full bg-white/20" />

                    {/* Document Info */}
                    <div className="min-w-0 flex-1 space-y-2">
                        <Skeleton className="h-7 w-64 bg-white/20" />
                        <Skeleton className="h-4 w-96 max-w-full bg-white/10" />
                    </div>

                    {/* Status Badge */}
                    <Skeleton className="h-9 w-28 rounded-full bg-white/20" />
                </div>
            </DefaultCard>

            {/* 2x2 Grid Cards Skeleton */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Languages Card */}
                <DefaultCard className="flex items-center gap-3 p-4">
                    <Skeleton className="size-10 rounded-lg" />
                    <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-5 w-40" />
                    </div>
                </DefaultCard>

                {/* Template Card */}
                <DefaultCard className="flex items-center gap-3 p-4">
                    <Skeleton className="size-10 rounded-lg" />
                    <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-5 w-32" />
                    </div>
                </DefaultCard>

                {/* Customer Card */}
                <DefaultCard className="flex items-center gap-3 p-4">
                    <Skeleton className="size-10 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-5 w-36" />
                        <Skeleton className="h-3 w-44" />
                    </div>
                    <Skeleton className="h-9 w-9 rounded-lg" />
                </DefaultCard>

                {/* Original File Card */}
                <DefaultCard className="flex items-center gap-3 p-4">
                    <Skeleton className="size-10 rounded-lg" />
                    <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-9 w-24 rounded-lg" />
                </DefaultCard>
            </div>

            {/* Pipeline Section Skeleton */}
            <DefaultCard className="p-6">
                <Skeleton className="mb-6 h-6 w-44" />

                {/* Timeline Items */}
                <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                            {/* Timeline dot and line */}
                            <div className="flex flex-col items-center">
                                <Skeleton className="size-8 rounded-full" />
                                {i < 4 && <Skeleton className="mt-1 h-8 w-0.5" />}
                            </div>

                            {/* Stage info */}
                            <div className="flex-1 space-y-1">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-3 w-24" />
                            </div>

                            {/* Duration */}
                            <Skeleton className="h-4 w-16" />
                        </div>
                    ))}
                </div>
            </DefaultCard>
        </div>
    );
}
