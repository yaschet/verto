/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * TableColumnHandle Component
 * 3-dot menu trigger for column operations
 *
 * Uses createPortal to render outside table DOM (zero layout shift)
 * Column resizing removed - styling handled in Google Docs export
 */

'use client';

import { DotsThreeIcon } from '@phosphor-icons/react';
import type { RefObject } from 'react';
import { useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/library/utils';
import type { TableMouseState } from '@/components/translations/translation-editor/hooks/use-table-mouse-tracking';

type TableColumnHandleProps = {
    mouseState: TableMouseState;
    onMenuOpen: (columnIndex: number, position: { top: number; left: number }) => void;
    /** Portal target ref for clipping. Falls back to document.body if ref.current is null */
    portalTargetRef: RefObject<HTMLDivElement | null>;
};

export function TableColumnHandle({ mouseState, onMenuOpen, portalTargetRef }: TableColumnHandleProps) {
    const { columnMenuPosition } = mouseState;

    const handleMenuClick = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (columnMenuPosition) {
                onMenuOpen(columnMenuPosition.columnIndex, {
                    top: columnMenuPosition.top + 14,
                    left: columnMenuPosition.left,
                });
            }
        },
        [columnMenuPosition, onMenuOpen],
    );

    // Don't render if not near a table
    if (!mouseState.isNearTable || !columnMenuPosition) return null;

    return createPortal(
        <button
            className={cn(
                'table-handle-button',
                'h-3 w-3 opacity-0 transition-opacity duration-100 hover:opacity-100',
                mouseState.hoveredColumnIndex === columnMenuPosition.columnIndex && 'opacity-70',
            )}
            style={{
                top: columnMenuPosition.top + 12,
                left: columnMenuPosition.left,
                width: columnMenuPosition.width,
            }}
            title="Column options"
            type="button"
            onClick={handleMenuClick}
        >
            <DotsThreeIcon className="size-3.5" weight="bold" />
        </button>,
        portalTargetRef.current || document.body,
    );
}
