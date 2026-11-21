/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import React from 'react';
import { cn } from '@library/utils';

export function PanelSection({
    aboveContent,
    belowContent,
    children,
    description,
    title,
    vertical,
}: {
    title?: React.ReactNode | string;
    description?: React.ReactNode | string;
    children?: React.ReactNode | string;
    aboveContent?: React.ReactNode;
    belowContent?: React.ReactNode;
    vertical?: boolean;
}) {
    return (
        <li
            className={cn(
                'relative w-full gap-6 pb-12 last:border-b-0',
                vertical
                    ? 'flex flex-col'
                    : 'grid grid-cols-1 md:grid-cols-[1fr_2fr] md:gap-12 lg:gap-16 xl:gap-20 2xl:gap-28',
                'border-border border-b',
            )}
        >
            {/* Section Description */}
            <div className="flex flex-col items-start justify-start gap-2">
                {aboveContent && <div className="flex items-start justify-start gap-2">{aboveContent}</div>}
                {typeof title === 'string' ? (
                    <h2 className="text-foreground text-lg font-semibold">{title}</h2>
                ) : (
                    <div className="text-foreground h-auto w-full text-lg font-semibold">{title}</div>
                )}
                {typeof description === 'string' ? (
                    <p className="text-muted text-sm">{description}</p>
                ) : (
                    <div className="text-muted h-auto w-full text-sm">{description}</div>
                )}
                {belowContent && <div className="flex items-start justify-start gap-2">{belowContent}</div>}
            </div>
            {/* Section Content */}
            <div className="flex flex-col items-start justify-start gap-2">{children}</div>
        </li>
    );
}
