/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * TableSelectionOverlay Component
 * Outer border around multi-cell selection (Notion-style)
 *
 * Calculates bounding box of all .selectedCell elements and renders a border
 */

'use client';

import type { RefObject } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Editor } from '@tiptap/react';

type SelectionBounds = {
    left: number;
    top: number;
    width: number;
    height: number;
    cellCount: number;
};

type TableSelectionOverlayProps = {
    editor: Editor;
    /** Portal target ref for clipping. Falls back to document.body if ref.current is null */
    portalTargetRef: RefObject<HTMLDivElement | null>;
};

export function TableSelectionOverlay({ editor, portalTargetRef }: TableSelectionOverlayProps) {
    const [bounds, setBounds] = useState<SelectionBounds | null>(null);
    const rafRef = useRef<number | null>(null);

    // Get portal container offset for container-relative positioning
    const getPortalOffset = useCallback(() => {
        if (!portalTargetRef.current) return { left: 0, top: 0 };
        const rect = portalTargetRef.current.getBoundingClientRect();
        return { left: rect.left, top: rect.top };
    }, [portalTargetRef]);

    const calculateBounds = useCallback(() => {
        // Skip calculation if portal container not yet available
        if (!portalTargetRef.current) {
            return;
        }

        const selectedCells = editor.view.dom.querySelectorAll('.selectedCell');

        if (selectedCells.length <= 1) {
            setBounds(null);
            return;
        }

        const rects = Array.from(selectedCells).map((el) => el.getBoundingClientRect());

        if (rects.length === 0) {
            setBounds(null);
            return;
        }

        const offset = getPortalOffset();

        const boundingBox = {
            left: Math.min(...rects.map((r) => r.left)) - offset.left,
            top: Math.min(...rects.map((r) => r.top)) - offset.top,
            right: Math.max(...rects.map((r) => r.right)) - offset.left,
            bottom: Math.max(...rects.map((r) => r.bottom)) - offset.top,
        };

        setBounds({
            left: boundingBox.left,
            top: boundingBox.top,
            width: boundingBox.right - boundingBox.left,
            height: boundingBox.bottom - boundingBox.top,
            cellCount: selectedCells.length,
        });
    }, [editor, getPortalOffset]);

    useEffect(() => {
        const handleSelectionChange = () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
            rafRef.current = requestAnimationFrame(calculateBounds);
        };

        editor.on('selectionUpdate', handleSelectionChange);
        editor.on('transaction', handleSelectionChange);

        const handleScroll = () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
            rafRef.current = requestAnimationFrame(calculateBounds);
        };

        window.addEventListener('scroll', handleScroll, { passive: true, capture: true });

        calculateBounds();

        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
            editor.off('selectionUpdate', handleSelectionChange);
            editor.off('transaction', handleSelectionChange);
            window.removeEventListener('scroll', handleScroll, { capture: true });
        };
    }, [editor, calculateBounds]);

    // Don't render if no multi-cell selection or portal container not ready
    if (!bounds || bounds.cellCount <= 1 || !portalTargetRef.current) return null;

    return createPortal(
        <div
            aria-hidden="true"
            className="table-selection-border"
            style={{
                left: bounds.left - 1,
                top: bounds.top - 1,
                width: bounds.width + 2,
                height: bounds.height + 2,
            }}
        />,
        portalTargetRef.current || document.body,
    );
}
