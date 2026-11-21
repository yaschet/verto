/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * TableMenu Components Index
 * Notion-style table UI components
 */

'use client';

import { MinusIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { useTableControls } from '@/components/translations/translation-editor/hooks/use-table-controls';
import { Button } from '@/components/ui/button';
import { cn } from '@/library/utils';
import type { Editor } from '@tiptap/react';

type TableFloatingMenuProps = {
    editor: Editor;
};

export function TableFloatingMenu({ editor }: TableFloatingMenuProps) {
    const [isInTable, setIsInTable] = useState(false);
    const tableControls = useTableControls(editor);

    useEffect(() => {
        const updateTableState = () => {
            setIsInTable(editor.isActive('table'));
        };

        editor.on('selectionUpdate', updateTableState);
        editor.on('transaction', updateTableState);

        // Initial check
        updateTableState();

        return () => {
            editor.off('selectionUpdate', updateTableState);
            editor.off('transaction', updateTableState);
        };
    }, [editor]);

    if (!isInTable) return null;

    const handleDeleteTable = () => {
        if (window.confirm('Are you sure you want to delete this table?')) {
            tableControls.deleteTable();
        }
    };

    return (
        <div
            className={cn(
                'flex items-center gap-1 rounded-lg border p-1 shadow-md',
                'border-surface-200 dark:border-surface-800 dark:bg-surface-950 bg-white',
                'animate-in fade-in-0 zoom-in-95 duration-150',
            )}
        >
            <Button
                className="h-7 px-2 text-xs"
                size="sm"
                tooltipContent="Add row"
                tooltipSide="bottom"
                variant="soft"
                onClick={tableControls.addRowAfter}
            >
                <PlusIcon className="mr-1 size-3" />
                Row
            </Button>
            <Button
                className="h-7 px-2 text-xs"
                size="sm"
                tooltipContent="Add column"
                tooltipSide="bottom"
                variant="soft"
                onClick={tableControls.addColumnAfter}
            >
                <PlusIcon className="mr-1 size-3" />
                Col
            </Button>

            <div className="bg-surface-200 dark:bg-surface-700 mx-1 h-4 w-px" />

            <Button
                className="h-7 w-7 p-0"
                color="destructive"
                size="sm"
                tooltipContent="Delete row"
                tooltipSide="bottom"
                variant="soft"
                onClick={tableControls.deleteRow}
            >
                <MinusIcon className="size-3" />
            </Button>
            <Button
                className="h-7 w-7 p-0"
                color="destructive"
                size="sm"
                tooltipContent="Delete table"
                tooltipSide="bottom"
                variant="soft"
                onClick={handleDeleteTable}
            >
                <TrashIcon className="size-3" />
            </Button>
        </div>
    );
}

// Re-export components
export { TableContextMenu } from './table-context-menu';
export { TableHoverControls } from './table-hover-controls';

// Notion-style table UI components
export { TableColumnHandle } from './table-column-handle';
export { TableColumnMenu } from './table-column-menu';
export { TableRowHandle } from './table-row-handle';
export { TableRowMenu } from './table-row-menu';
export { TableAddButtons } from './table-add-buttons';
export { TableSelectionOverlay } from './table-selection-overlay';
export { NotionTableUI } from './notion-table-ui';
