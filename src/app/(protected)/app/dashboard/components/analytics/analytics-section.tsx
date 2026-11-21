/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { ChartBar } from '@phosphor-icons/react/dist/ssr/ChartBar';
import React, { Children } from 'react';
import { SectionTitle } from '@app/(protected)/app/components/common';
import type { ReactNode } from 'react';

export function AnalyticsSection({ children }: { children?: ReactNode }) {
    const childrenArray = Children.toArray(children);
    const lastChildIndex = childrenArray.length - 1;

    // Calculate the number of columns to span for the last item
    const getLastItemSpan = (index: number, totalItems: number) => {
        if (index !== lastChildIndex) return '';

        // For medium screens (2 columns)
        const mdSpan = totalItems % 2 === 0 ? '' : 'xl:col-span-2';

        // For 2xl screens (3 columns)
        const remainingCols = totalItems % 3;
        const xlSpan = remainingCols === 0 ? '' : `2xl:col-span-${remainingCols === 1 ? 3 : remainingCols}`;

        return `${mdSpan} ${xlSpan}`.trim();
    };

    return (
        <div className="flex w-full max-w-full flex-col items-start justify-start gap-3">
            <SectionTitle icon={ChartBar} title="Analytics" />
            <div className="grid w-full max-w-full grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
                {childrenArray.map((child, index) => (
                    <div key={index} className={getLastItemSpan(index, childrenArray.length)}>
                        {child}
                    </div>
                ))}
            </div>
        </div>
    );
}
