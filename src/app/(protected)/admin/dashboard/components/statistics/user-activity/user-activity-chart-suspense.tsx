/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { useEffect, useState } from 'react';
import { DefaultCard } from '@components/ui/card';
import { generateRandomPath } from '@library/svg';

export default function UserActivityChartSuspense() {
    const [randomPath, setRandomPath] = useState('');

    useEffect(() => {
        setRandomPath(generateRandomPath());
    }, []);

    return (
        <DefaultCard className="flex h-full flex-col">
            <div className="flex w-full animate-pulse flex-col gap-6">
                {/* Header Placeholder */}
                <div className="flex w-full flex-col items-start justify-start gap-3">
                    <div className="bg-surface-200 dark:bg-surface-900 h-6 w-3/6 max-w-xs rounded-xl"></div>
                    <div className="bg-surface-200 dark:bg-surface-900 h-4 w-5/6 max-w-sm rounded-xl"></div>
                </div>

                {/* Chart Placeholder */}
                <div className="bg-background relative h-96 w-full overflow-hidden rounded-xl">
                    <svg
                        aria-hidden="true"
                        className="absolute inset-0 h-full w-full"
                        focusable="false"
                        preserveAspectRatio="none"
                        viewBox="0 0 100 100"
                    >
                        <defs>
                            <linearGradient id="skeletonGradient" x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0%" stopColor="var(--surface-300)" stopOpacity="0.6" />
                                <stop offset="100%" stopColor="var(--surface-300)" stopOpacity="0.2" />
                            </linearGradient>
                        </defs>

                        {/* Random Area Path */}
                        <path d={randomPath} fill="url(#skeletonGradient)" opacity="0.4" />
                    </svg>
                </div>

                {/* Accessibility Text */}
                <span className="sr-only">Loading chart...</span>
            </div>
        </DefaultCard>
    );
}
