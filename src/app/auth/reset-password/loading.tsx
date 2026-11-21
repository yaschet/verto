/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { Skeleton } from '@/src/components/ui/skeleton';

export default function AuthLoading() {
    return (
        <div className="flex w-full flex-col items-center justify-center gap-2">
            <div className="flex w-full flex-col items-center justify-center gap-5">
                <div className="mb-5 flex flex-col items-center justify-center gap-3">
                    <Skeleton className="mb-3 flex size-16 items-center justify-center rounded-full" />
                    <div className="flex w-full flex-col gap-6">
                        <div className="flex w-full flex-col items-center justify-center gap-3">
                            <Skeleton className="h-5 w-96 max-w-full" />
                            <div className="flex w-full flex-col items-center justify-center gap-3">
                                <Skeleton className="h-4 w-5/6 max-w-full" />
                                <Skeleton className="h-4 w-5/6 max-w-full" />
                            </div>
                        </div>
                        <div className="flex w-full flex-col items-start justify-start gap-3">
                            <div className="flex w-full flex-col items-start justify-start gap-2">
                                <Skeleton className="h-4 w-3/6 max-w-full" />
                                <Skeleton className="h-12 w-full max-w-full" />
                            </div>
                            <div className="flex w-full flex-col items-start justify-start gap-2">
                                <Skeleton className="h-4 w-3/6 max-w-full" />
                                <Skeleton className="h-12 w-full max-w-full" />
                                <div className="flex w-full flex-col items-start justify-start gap-1">
                                    <Skeleton className="h-2 w-full max-w-full" />
                                    <Skeleton className="h-2 w-1/3 max-w-full" />
                                </div>
                            </div>
                            <div className="flex w-full flex-row gap-4">
                                <Skeleton className="h-12 w-full flex-1" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
