/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { CardsThreeIcon } from '@phosphor-icons/react';
import { Fragment } from 'react';
import { SectionTitle } from '@/src/app/(protected)/app/components/common';
import { Skeleton } from '@components/ui/skeleton';

export default function InsightsCardsSuspense() {
    return (
        <Fragment>
            {/* 4 cards - Grid for statistics */}
            <div className="flex w-full max-w-full flex-col items-start justify-start gap-3">
                {/* Title of the Section */}
                <SectionTitle icon={CardsThreeIcon} isLoading={true} title="Insights" />

                {/* Cards */}
                <div className="relative flex h-auto w-full max-w-full flex-row items-center justify-start gap-4">
                    <div className="grid w-full grid-flow-row-dense grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 3 }).map((_, index: number) => {
                            return (
                                <div
                                    key={index}
                                    className="border-border bg-surface-1 relative flex h-auto w-full max-w-full animate-pulse flex-row items-center justify-start gap-3 rounded-3xl border p-4 md:p-6"
                                >
                                    <Skeleton className="relative flex aspect-square h-auto w-12 flex-row items-center justify-center rounded-xl"></Skeleton>
                                    <div className="relative flex h-auto w-full max-w-full flex-col items-start justify-start gap-2">
                                        <Skeleton className="h-5 w-32 rounded-xl" />
                                        <Skeleton className="h-3 w-40 rounded-xl" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </Fragment>
    );
}
