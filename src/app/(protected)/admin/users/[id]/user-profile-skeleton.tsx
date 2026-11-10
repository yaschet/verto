/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { DefaultCard } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function UserProfileSkeleton() {
    return (
        <div className="flex w-full max-w-full flex-col gap-6">
            <div className="flex items-center justify-between gap-4">
                <Skeleton className="h-10 w-24" />
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                </div>
            </div>

            <DefaultCard className="p-6">
                <div className="flex items-start gap-4">
                    <Skeleton className="size-14 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <Skeleton className="h-8 w-24 rounded-full" />
                        <Skeleton className="h-4 w-16" />
                    </div>
                </div>
            </DefaultCard>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                    <DefaultCard key={i} className="p-4">
                        <div className="flex items-center gap-3">
                            <Skeleton className="size-10 rounded-lg" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-5 w-40" />
                            </div>
                        </div>
                    </DefaultCard>
                ))}
            </div>
        </div>
    );
}
