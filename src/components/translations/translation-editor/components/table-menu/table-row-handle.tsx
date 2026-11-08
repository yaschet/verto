/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * TableRowHandle Component
 * 3-dot menu trigger for rows (positioned to the left of the table)
 *
 * Uses createPortal to render outside table DOM (zero layout shift)
 */

'use client';

import { DotsThreeIcon } from '@phosphor-icons/react';
import type { RefObject } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/library/utils';
import type { TableMouseState } from '@/components/translations/translation-editor/hooks/use-table-mouse-tracking';
import type { Editor } from '@tiptap/react';

type TableRowHandleProps = {
    editor: Editor;
    mouseState: TableMouseState;
    onMenuOpen: (rowIndex: number, position: { top: number; left: number }) => void;
    /** Portal target ref for clipping. Falls back to document.body if ref.current is null */
    portalTargetRef: RefObject<HTMLDivElement | null>;
};

export function TableRowHandle({ mouseState, onMenuOpen, portalTargetRef }: TableRowHandleProps) {
    const { rowMenuPosition } = mouseState;

    // Don't render if not near a table
    if (!mouseState.isNearTable || !rowMenuPosition) return null;

    const handleMenuClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onMenuOpen(rowMenuPosition.rowIndex, {
            top: rowMenuPosition.top,
            left: rowMenuPosition.left,
        });
    };

    return createPortal(
        <button
            className={cn(
                'table-handle-button',
                'h-3 w-3 opacity-0 transition-opacity duration-100 hover:opacity-100',
                mouseState.hoveredRowIndex === rowMenuPosition.rowIndex && 'opacity-70',
            )}
            style={{
                top: rowMenuPosition.top,
                left: rowMenuPosition.left + 16,
                height: rowMenuPosition.height,
            }}
            title="Row options"
            type="button"
            onClick={handleMenuClick}
        >
            {/* Rotated 90deg to indicate row handle */}
            <DotsThreeIcon className="size-3.5 rotate-90" weight="bold" />
        </button>,
        portalTargetRef.current || document.body,
    );
}
