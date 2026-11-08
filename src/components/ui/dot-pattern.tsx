/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { useId, type SVGProps } from 'react';
import { cn } from '@library/utils';

type DotPatternProps = SVGProps<SVGSVGElement> & {
    width?: number | string;
    height?: number | string;
    x?: number | string;
    y?: number | string;
    cx?: number | string;
    cy?: number | string;
    cr?: number | string;
    className?: string;
};

export function DotPattern({
    className,
    cr = 1,
    cx = 1,
    cy = 1,
    height = 16,
    width = 16,
    x = 0,
    y = 0,
    ...props
}: DotPatternProps) {
    const id = useId();

    return (
        <svg
            aria-hidden="true"
            className={cn('fill-muted/30 pointer-events-none absolute inset-0 h-full w-full', className)}
            {...props}
        >
            <defs>
                <pattern
                    height={height}
                    id={id}
                    patternContentUnits="userSpaceOnUse"
                    patternUnits="userSpaceOnUse"
                    width={width}
                    x={x}
                    y={y}
                >
                    <circle cx={cx} cy={cy} id="pattern-circle" r={cr} />
                </pattern>
            </defs>
            <rect fill={`url(#${id})`} height="100%" strokeWidth={0} width="100%" />
        </svg>
    );
}

export default DotPattern;
