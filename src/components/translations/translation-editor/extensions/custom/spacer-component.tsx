/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import type { NodeViewProps } from '@tiptap/react';
import { NodeViewWrapper } from '@tiptap/react';
import { cn } from '@/library/utils';
import React from 'react';

export const SpacerComponent = (props: NodeViewProps) => {
    // Ensure height matches at least a standard line height (approx 24px) for handle bar alignment
    const height = Math.max(props.node.attrs.height || 24, 24);
    const isSelected = props.selected;

    return (
        <NodeViewWrapper
            className={cn(
                'group relative w-full rounded-md border border-transparent transition-all',
                'hover:border-surface-300 hover:bg-surface-50/50 hover:border-dashed',
                'dark:hover:border-surface-700 dark:hover:bg-surface-800/30',
                isSelected && 'border-primary-300 bg-primary-50/10 dark:border-primary-700 border-dashed',
            )}
            style={{ height: `${height}px`, minHeight: '32px' }}
            data-type="spacer"
        >
            <div className="text-surface-400 dark:text-surface-500 pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold tracking-wider uppercase opacity-0 transition-opacity select-none group-hover:opacity-100">
                Spacer
            </div>
        </NodeViewWrapper>
    );
};
