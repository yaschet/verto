/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * NotionTableUI Component
 * Orchestrates all Notion-style table UI elements
 *
 * Manages state for column/row menus and integrates:
 * - TableColumnHandle (resize + 3-dot)
 * - TableColumnMenu (column dropdown)
 * - TableRowHandle (row 3-dot)
 * - TableRowMenu (row dropdown)
 * - TableAddButtons (edge + buttons)
 * - TableSelectionOverlay (multi-cell border)
 */

'use client';

import { useCallback, useState, type RefObject } from 'react';
import { TableAddButtons } from '@/components/translations/translation-editor/components/table-menu/table-add-buttons';
import { TableColumnHandle } from '@/components/translations/translation-editor/components/table-menu/table-column-handle';
import { TableColumnMenu } from '@/components/translations/translation-editor/components/table-menu/table-column-menu';
import { TableRowHandle } from '@/components/translations/translation-editor/components/table-menu/table-row-handle';
import { TableRowMenu } from '@/components/translations/translation-editor/components/table-menu/table-row-menu';
import { TableSelectionOverlay } from '@/components/translations/translation-editor/components/table-menu/table-selection-overlay';
import { useTableControls } from '@/components/translations/translation-editor/hooks/use-table-controls';
import { useTableMouseTracking } from '@/components/translations/translation-editor/hooks/use-table-mouse-tracking';
import type { Editor } from '@tiptap/react';

type NotionTableUIProps = {
    editor: Editor;
    /** Ref to the portal container for clipping overlays */
    portalContainerRef: RefObject<HTMLDivElement | null>;
};

type MenuState = {
    isOpen: boolean;
    index: number;
    position: { top: number; left: number };
};

const initialMenuState: MenuState = {
    isOpen: false,
    index: -1,
    position: { top: 0, left: 0 },
};

export function NotionTableUI({ editor, portalContainerRef }: NotionTableUIProps) {
    const mouseState = useTableMouseTracking(editor, { portalContainerRef });
    const tableControls = useTableControls(editor);

    // Column menu state
    const [columnMenu, setColumnMenu] = useState<MenuState>(initialMenuState);

    // Row menu state
    const [rowMenu, setRowMenu] = useState<MenuState>(initialMenuState);

    // Handlers for column menu
    const handleColumnMenuOpen = useCallback(
        (columnIndex: number, position: { top: number; left: number }) => {
            setColumnMenu({
                isOpen: true,
                index: columnIndex,
                position,
            });
            // Close row menu if open
            setRowMenu(initialMenuState);
        },
        [],
    );

    const handleColumnMenuClose = useCallback(() => {
        setColumnMenu(initialMenuState);
    }, []);

    // Handlers for row menu
    const handleRowMenuOpen = useCallback((rowIndex: number, position: { top: number; left: number }) => {
        setRowMenu({
            isOpen: true,
            index: rowIndex,
            position,
        });
        // Close column menu if open
        setColumnMenu(initialMenuState);
    }, []);

    const handleRowMenuClose = useCallback(() => {
        setRowMenu(initialMenuState);
    }, []);

    return (
        <>
            {/* Column 3-dot button */}
            <TableColumnHandle
                mouseState={mouseState}
                portalTargetRef={portalContainerRef}
                onMenuOpen={handleColumnMenuOpen}
            />

            {/* Column dropdown menu */}
            {columnMenu.isOpen && (
                <TableColumnMenu
                    columnIndex={columnMenu.index}
                    editor={editor}
                    position={columnMenu.position}
                    tableControls={tableControls}
                    onClose={handleColumnMenuClose}
                    portalTargetRef={portalContainerRef}
                />
            )}

            {/* Row 3-dot button */}
            <TableRowHandle
                editor={editor}
                mouseState={mouseState}
                portalTargetRef={portalContainerRef}
                onMenuOpen={handleRowMenuOpen}
            />

            {/* Row dropdown menu */}
            {rowMenu.isOpen && (
                <TableRowMenu
                    editor={editor}
                    position={rowMenu.position}
                    rowIndex={rowMenu.index}
                    tableControls={tableControls}
                    onClose={handleRowMenuClose}
                    portalTargetRef={portalContainerRef}
                />
            )}

            {/* Edge add buttons */}
            <TableAddButtons
                editor={editor}
                mouseState={mouseState}
                portalTargetRef={portalContainerRef}
                tableControls={tableControls}
            />

            {/* Multi-cell selection border */}
            <TableSelectionOverlay editor={editor} portalTargetRef={portalContainerRef} />
        </>
    );
}
