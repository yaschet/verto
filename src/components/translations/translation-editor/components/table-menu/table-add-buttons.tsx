/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * TableAddButtons Component
 * "+" buttons at table edges for adding rows/columns
 *
 * - Right edge: Add column (full table height)
 * - Bottom edge: Add row (full table width)
 *
 * Uses createPortal for zero layout shift
 */

'use client';

import { PlusIcon } from '@phosphor-icons/react';
import type { RefObject } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/library/utils';
import type { TableControls } from '@/components/translations/translation-editor/hooks/use-table-controls';
import type { TableMouseState } from '@/components/translations/translation-editor/hooks/use-table-mouse-tracking';
import type { Editor } from '@tiptap/react';

type TableAddButtonsProps = {
    editor: Editor;
    mouseState: TableMouseState;
    tableControls: TableControls;
    /** Portal target ref for clipping. Falls back to document.body if ref.current is null */
    portalTargetRef: RefObject<HTMLDivElement | null>;
};

export function TableAddButtons({
    editor,
    mouseState,
    tableControls,
    portalTargetRef,
}: TableAddButtonsProps) {
    const { activeTable, addColumnPosition, addRowPosition, isNearTable } = mouseState;

    // Don't render if not near a table
    if (!isNearTable || !activeTable) return null;

    const handleAddColumn = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Focus last cell in table to ensure correct context
        const rows = activeTable.querySelectorAll('tr');
        if (rows.length > 0) {
            const firstRow = rows[0];
            const cells = firstRow.querySelectorAll('th, td');
            const lastCell = cells[cells.length - 1] as HTMLElement;
            if (lastCell) {
                const pos = editor.view.posAtDOM(lastCell, 0);
                editor.commands.setTextSelection(pos);
            }
        }
        tableControls.addColumnAfter();
    };

    const handleAddRow = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Focus last row first cell to ensure correct context
        const rows = activeTable.querySelectorAll('tr');
        if (rows.length > 0) {
            const lastRow = rows[rows.length - 1];
            const firstCell = lastRow.querySelector('th, td') as HTMLElement;
            if (firstCell) {
                const pos = editor.view.posAtDOM(firstCell, 0);
                editor.commands.setTextSelection(pos);
            }
        }
        tableControls.addRowAfter();
    };

    return createPortal(
        <>
            {/* Add Column Button - Right edge */}
            {addColumnPosition && (
                <button
                    className={cn(
                        'table-add-button',
                        'w-3 flex-col gap-0.5',
                        'opacity-0 transition-opacity duration-150 hover:opacity-100',
                        addColumnPosition && 'opacity-60',
                    )}
                    style={{
                        top: addColumnPosition.top,
                        left: addColumnPosition.left - 2,
                        height: addColumnPosition.height,
                    }}
                    title="Add column"
                    type="button"
                    onClick={handleAddColumn}
                >
                    <PlusIcon className="size-2" weight="bold" />
                </button>
            )}

            {/* Add Row Button - Bottom edge */}
            {addRowPosition && (
                <button
                    className={cn(
                        'table-add-button',
                        'h-3 flex-row gap-0.5',
                        'opacity-0 transition-opacity duration-150 hover:opacity-100',
                        addRowPosition && 'opacity-60',
                    )}
                    style={{
                        top: addRowPosition.top - 2,
                        left: addRowPosition.left,
                        width: addRowPosition.width,
                    }}
                    title="Add row"
                    type="button"
                    onClick={handleAddRow}
                >
                    <PlusIcon className="size-2" weight="bold" />
                </button>
            )}
        </>,
        portalTargetRef.current || document.body,
    );
}
