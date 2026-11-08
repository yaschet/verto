/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import React from 'react';
import { cn } from '@library/utils';

export function StripePattern({ color, patternId }: { color: string; patternId?: string }) {
    return (
        <svg
            className={cn('h-3 w-3 overflow-hidden rounded')}
            height="16"
            style={{
                border: `1px solid ${color}`,
            }}
            width="16"
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <pattern
                    height="4"
                    id={`stripe-pattern${patternId ? `-${patternId}` : ''}`}
                    patternTransform="rotate(45)"
                    patternUnits="userSpaceOnUse"
                    width="4"
                >
                    <line stroke={color} strokeWidth="1" x1="0" x2="0" y1="0" y2="4" />
                </pattern>
            </defs>
            <rect fill={`url(#stripe-pattern${patternId ? `-${patternId}` : ''})`} height="16" width="16" />
        </svg>
    );
}

export function DotPattern({ color, patternId }: { color: string; patternId?: string }) {
    return (
        <svg
            className={cn('h-3 w-3 overflow-hidden rounded p-px')}
            height="16"
            style={{ border: `1px solid ${color}` }}
            viewBox="0 0 10 10"
            width="16"
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <pattern
                    height="5"
                    id={`dot-pattern${patternId ? `-${patternId}` : ''}`}
                    patternUnits="userSpaceOnUse"
                    width="5"
                >
                    <circle cx="2.5" cy="2.5" fill={color} r="1.5" />
                </pattern>
            </defs>
            <rect fill={`url(#dot-pattern${patternId ? `-${patternId}` : ''})`} height="16" width="16" />
        </svg>
    );
}

export function SolidColor({
    color,
    patternId,
    strokeDasharray,
}: {
    color: string;
    strokeDasharray?: string;
    patternId?: string;
}) {
    return (
        <div
            className={cn(
                'relative h-3 w-3 overflow-hidden rounded',
                strokeDasharray ? 'border-dashed' : 'border-solid',
            )}
            id={`solid-color${patternId ? `-${patternId}` : ''}`}
            style={{
                border: `1px solid ${color}`,
                borderStyle: strokeDasharray ? 'dashed' : 'solid',
            }}
        >
            {strokeDasharray && (
                <div
                    className="absolute top-1/2 left-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 transform rounded-[2px]"
                    style={{
                        backgroundColor: color,
                    }}
                />
            )}
            {!strokeDasharray && (
                <div
                    className="absolute h-full w-full"
                    style={{
                        backgroundColor: color,
                    }}
                />
            )}
        </div>
    );
}
