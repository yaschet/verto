/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * TableRowMenu Component
 * Dropdown menu for row operations (essential operations only)
 * Selects entire row when opened for visual feedback
 */

'use client';

import { ArrowLineDownIcon, ArrowLineUpIcon, TrashIcon } from '@phosphor-icons/react';
import { CellSelection } from '@tiptap/pm/tables';
import { useLayoutEffect, useEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/library/utils';
import type { TableControls } from '@/components/translations/translation-editor/hooks/use-table-controls';
import type { Editor } from '@tiptap/react';

type TableRowMenuProps = {
    editor: Editor;
    tableControls: TableControls;
    rowIndex: number;
    position: { top: number; left: number };
    onClose: () => void;
    /** Portal target ref to calculate viewport offset */
    portalTargetRef: RefObject<HTMLDivElement | null>;
};

type MenuItemProps = {
    icon: React.ComponentType<{ className?: string; weight?: 'regular' | 'bold' | 'fill' }>;
    label: string;
    onClick: () => void;
    destructive?: boolean;
};

// COMPACT PREMIUM STANDARD (B2B Editor-Grade)
// Items: 'px-2.5 py-1.5 text-xs font-medium rounded-lg'
function MenuItem({ destructive, icon: Icon, label, onClick }: MenuItemProps) {
    return (
        <button
            className={cn(
                'relative flex w-full cursor-default items-center gap-2 transition-transform duration-75 ease-in-out outline-none select-none active:scale-[0.95]',
                // Compact Premium Metrics
                'rounded-lg px-2.5 py-1.5 text-xs font-medium',
                // Hover/Focus state matches standard shadcn dropdown items:
                'hover:bg-surface-200 hover:text-surface-800 dark:hover:bg-surface-900 dark:hover:text-surface-50',
                'focus:bg-surface-200 focus:text-surface-800 dark:focus:bg-surface-900 dark:focus:text-surface-50',
                destructive && [
                    'text-destructive-500 font-bold',
                    // High contrast filled red on hover/focus for destructive items
                    'hover:bg-destructive-500 hover:text-destructive-50',
                    'focus:bg-destructive-500 focus:text-destructive-50',
                    'dark:hover:bg-destructive-500 dark:hover:text-destructive-50',
                    'dark:focus:bg-destructive-500 dark:focus:text-destructive-50',
                ],
            )}
            type="button"
            onClick={onClick}
        >
            <Icon className="size-3.5 shrink-0" weight="regular" />
            <span>{label}</span>
        </button>
    );
}

function MenuDivider() {
    // Compact divider
    return <div className="bg-border -mx-1 my-1 h-px" />;
}

export function TableRowMenu({
    editor,
    onClose,
    position,
    rowIndex,
    tableControls,
    portalTargetRef,
}: TableRowMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);
    const [offset, setOffset] = useState({ top: 0, left: 0 });

    // Calculate container offset
    useLayoutEffect(() => {
        if (portalTargetRef.current) {
            const rect = portalTargetRef.current.getBoundingClientRect();
            setOffset({ top: rect.top, left: rect.left });
        }
    }, [portalTargetRef]);

    // Select entire row when menu opens
    useEffect(() => {
        const table = editor.view.dom.querySelector('table');
        if (!table) return;

        const rows = table.querySelectorAll('tr');
        const targetRow = rows[rowIndex];
        if (!targetRow) return;

        const cells = targetRow.querySelectorAll('th, td');
        if (cells.length === 0) return;

        // Get first and last cell in this row
        const firstCell = cells[0] as HTMLElement;
        const lastCell = cells[cells.length - 1] as HTMLElement;

        if (firstCell && lastCell) {
            try {
                // Get the position right before the cell node (not inside it)
                const firstPos = editor.view.posAtDOM(firstCell, 0);
                const lastPos = editor.view.posAtDOM(lastCell, 0);

                // We need to find the cell node position - walk up to find it
                const $first = editor.state.doc.resolve(firstPos);
                const $last = editor.state.doc.resolve(lastPos);

                // Find the cell position by looking for tableCell or tableHeader parent
                let firstCellPos = firstPos;
                let lastCellPos = lastPos;

                for (let d = $first.depth; d > 0; d--) {
                    const node = $first.node(d);
                    if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
                        firstCellPos = $first.before(d);
                        break;
                    }
                }

                for (let d = $last.depth; d > 0; d--) {
                    const node = $last.node(d);
                    if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
                        lastCellPos = $last.before(d);
                        break;
                    }
                }

                const $firstCell = editor.state.doc.resolve(firstCellPos);
                const $lastCell = editor.state.doc.resolve(lastCellPos);

                const selection = CellSelection.rowSelection($firstCell, $lastCell);
                editor.view.dispatch(editor.state.tr.setSelection(selection));
            } catch (e) {
                console.error('Failed to select row:', e);
            }
        }
    }, [editor, rowIndex]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        const timeoutId = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
        }, 0);

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    // Actions
    const handleInsertRowAbove = () => {
        tableControls.addRowBefore();
        onClose();
    };

    const handleInsertRowBelow = () => {
        tableControls.addRowAfter();
        onClose();
    };

    const handleDeleteRow = () => {
        tableControls.deleteRow();
        onClose();
    };

    const isRtl = (editor.storage?.translationDirection || 'ltr') === 'rtl';

    // Render to body to avoid overflow clipping
    return createPortal(
        <div
            className="pointer-events-none fixed z-50"
            style={{
                top: position.top + offset.top,
                left: position.left + offset.left,
                transform: 'translateY(-50%)',
            }}
        >
            <div
                ref={menuRef}
                className={cn(
                    'pointer-events-auto',
                    // COMPACT PREMIUM Container Styles
                    // Tight padding (p-1), Rounded-XL (Modern but precise), Border-Border
                    'flex min-w-[8rem] flex-col overflow-hidden border', // 8rem min-w is fine for row icons
                    'border-border bg-surface-2 text-foreground',
                    'rounded-xl p-1', // Precision Roundness

                    // Premium Shadows (Light Mode)
                    'shadow-[0_2px_24px_rgba(0,0,0,0.08),0_0_0_0.5px_rgba(0,0,0,0.04)]',
                    // Premium Shadows (Dark Mode)
                    'dark:border-surface-800 dark:bg-surface-950 dark:text-surface-50',
                    'dark:shadow-[0_4px_16px_rgba(0,0,0,0.48),0_0_0_1px_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.24)]',

                    // Animations
                    'animate-in fade-in-0 zoom-in-95 duration-100',
                    isRtl ? 'origin-right' : 'origin-left',
                )}
            >
                {/* Insert operations */}
                <MenuItem icon={ArrowLineUpIcon} label="Insert above" onClick={handleInsertRowAbove} />
                <MenuItem icon={ArrowLineDownIcon} label="Insert below" onClick={handleInsertRowBelow} />

                <MenuDivider />

                {/* Destructive */}
                <MenuItem destructive icon={TrashIcon} label="Delete row" onClick={handleDeleteRow} />
            </div>
        </div>,
        document.body,
    );
}
