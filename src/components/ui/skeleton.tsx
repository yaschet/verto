/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import React from 'react';
import { cn } from '@library/utils';

type SkeletonProps = {
    width?: number | string;
    height?: number | string;
    variant?: 'rectangular' | 'circle' | 'text';
    children?: React.ReactNode;
    innerClassName?: string;
} & React.HTMLAttributes<HTMLDivElement>;

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton(
    { children, className, height, innerClassName, variant = 'rectangular', width, ...props },
    ref,
) {
    const baseClasses = cn(
        'relative',
        'overflow-hidden',
        'animate-none',
        'rounded-xl',
        'bg-surface-2',
        'opacity-100',
        'will-change-transform',
        className,
    );

    const innerClasses = cn(
        'skeleton-inner',
        'absolute inset-0',
        'animate-[shimmer_2s_infinite]',
        'rounded-xl',
        'bg-linear-to-r',
        'from-transparent via-surface-3 to-transparent',
        variant === 'circle' && 'rounded-full',
        innerClassName,
    );

    return (
        <div ref={ref} aria-busy="true" className={baseClasses} {...props}>
            <div className={innerClasses} style={{ height: height || 'auto', width: width || '100%' }}></div>
            {children}
        </div>
    );
});

export { Skeleton };
