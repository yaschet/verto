/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * TableHoverControls Component
 * Notion-style hover buttons for adding rows and columns
 */

'use client';

import { PlusIcon } from '@phosphor-icons/react';
import { useCallback, useEffect, useState } from 'react';
import { cn } from '@/library/utils';
import type { Editor } from '@tiptap/react';

type TableHoverControlsProps = {
    editor: Editor;
};

type ControlPosition = {
    visible: boolean;
    top: number;
    left: number;
    type: 'row' | 'column';
};

export function TableHoverControls({ editor }: TableHoverControlsProps) {
    const [rowControl, setRowControl] = useState<ControlPosition>({
        visible: false,
        top: 0,
        left: 0,
        type: 'row',
    });
    const [colControl, setColControl] = useState<ControlPosition>({
        visible: false,
        top: 0,
        left: 0,
        type: 'column',
    });

    const handleAddRow = useCallback(() => {
        editor.chain().focus().addRowAfter().run();
    }, [editor]);

    const handleAddColumn = useCallback(() => {
        editor.chain().focus().addColumnAfter().run();
    }, [editor]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const cell = target.closest('td, th');
            const table = target.closest('table');

            if (!cell || !table) {
                setRowControl((prev) => ({ ...prev, visible: false }));
                setColControl((prev) => ({ ...prev, visible: false }));
                return;
            }

            const tableRect = table.getBoundingClientRect();
            const cellRect = cell.getBoundingClientRect();

            // Show row control on the left edge
            const nearLeftEdge = e.clientX < tableRect.left + 40;
            if (nearLeftEdge) {
                setRowControl({
                    visible: true,
                    top: cellRect.top + cellRect.height / 2 - 12,
                    left: tableRect.left - 32,
                    type: 'row',
                });
            } else {
                setRowControl((prev) => ({ ...prev, visible: false }));
            }

            // Show column control on the top edge
            const nearTopEdge = e.clientY < tableRect.top + 40;
            if (nearTopEdge) {
                setColControl({
                    visible: true,
                    top: tableRect.top - 32,
                    left: cellRect.left + cellRect.width / 2 - 12,
                    type: 'column',
                });
            } else {
                setColControl((prev) => ({ ...prev, visible: false }));
            }
        };

        const handleMouseLeave = () => {
            setRowControl((prev) => ({ ...prev, visible: false }));
            setColControl((prev) => ({ ...prev, visible: false }));
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    return (
        <>
            {/* Add Row Button */}
            <button
                className={cn(
                    'fixed z-50 flex h-6 w-6 items-center justify-center rounded',
                    'bg-surface-100 dark:bg-surface-800',
                    'border-surface-200 dark:border-surface-700 border',
                    'text-surface-500 hover:text-accent-500',
                    'hover:bg-surface-200 dark:hover:bg-surface-700',
                    'shadow-sm transition-all duration-100',
                    'cursor-pointer',
                    rowControl.visible ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0',
                )}
                style={{
                    top: rowControl.top,
                    left: rowControl.left,
                }}
                title="Add row below"
                onClick={handleAddRow}
            >
                <PlusIcon className="size-3.5" weight="bold" />
            </button>

            {/* Add Column Button */}
            <button
                className={cn(
                    'fixed z-50 flex h-6 w-6 items-center justify-center rounded',
                    'bg-surface-100 dark:bg-surface-800',
                    'border-surface-200 dark:border-surface-700 border',
                    'text-surface-500 hover:text-accent-500',
                    'hover:bg-surface-200 dark:hover:bg-surface-700',
                    'shadow-sm transition-all duration-100',
                    'cursor-pointer',
                    colControl.visible ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0',
                )}
                style={{
                    top: colControl.top,
                    left: colControl.left,
                }}
                title="Add column right"
                onClick={handleAddColumn}
            >
                <PlusIcon className="size-3.5" weight="bold" />
            </button>
        </>
    );
}
