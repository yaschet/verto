/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * TableContextMenu Component
 * Right-click context menu for table operations
 */

'use client';

import { useCallback } from 'react';
import { useTableControls } from '@/components/translations/translation-editor/hooks/use-table-controls';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuTrigger,
} from '@/components/ui/context-menu';
import type { Editor } from '@tiptap/react';

type TableContextMenuProps = {
    editor: Editor;
    children: React.ReactNode;
};

export function TableContextMenu({ children, editor }: TableContextMenuProps) {
    const tableControls = useTableControls(editor);

    const handleDeleteTable = useCallback(() => {
        if (window.confirm('Are you sure you want to delete this table?')) {
            tableControls.deleteTable();
        }
    }, [tableControls]);

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
            <ContextMenuContent className="w-56">
                {/* Row Operations */}
                <ContextMenuSub>
                    <ContextMenuSubTrigger>Row</ContextMenuSubTrigger>
                    <ContextMenuSubContent>
                        <ContextMenuItem onClick={tableControls.addRowBefore}>
                            Insert row above
                        </ContextMenuItem>
                        <ContextMenuItem onClick={tableControls.addRowAfter}>
                            Insert row below
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem className="text-destructive" onClick={tableControls.deleteRow}>
                            Delete row
                        </ContextMenuItem>
                    </ContextMenuSubContent>
                </ContextMenuSub>

                {/* Column Operations */}
                <ContextMenuSub>
                    <ContextMenuSubTrigger>Column</ContextMenuSubTrigger>
                    <ContextMenuSubContent>
                        <ContextMenuItem onClick={tableControls.addColumnBefore}>
                            Insert column left
                        </ContextMenuItem>
                        <ContextMenuItem onClick={tableControls.addColumnAfter}>
                            Insert column right
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem className="text-destructive" onClick={tableControls.deleteColumn}>
                            Delete column
                        </ContextMenuItem>
                    </ContextMenuSubContent>
                </ContextMenuSub>

                <ContextMenuSeparator />

                {/* Cell Operations */}
                <ContextMenuItem onClick={tableControls.mergeCells}>Merge cells</ContextMenuItem>
                <ContextMenuItem onClick={tableControls.splitCell}>Split cell</ContextMenuItem>
                <ContextMenuItem onClick={tableControls.toggleHeaderCell}>Toggle header cell</ContextMenuItem>

                <ContextMenuSeparator />

                {/* Table Operations */}
                <ContextMenuItem className="text-destructive" onClick={handleDeleteTable}>
                    Delete table
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
}
