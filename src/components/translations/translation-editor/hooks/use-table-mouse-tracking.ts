/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * useTableMouseTracking Hook
 * Centralized mouse position tracking for Notion-style table UX
 *
 * Single mousemove listener with RAF throttling for 60fps performance.
 * Detects column/row hover, border proximity, and edge positions.
 */

'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { Editor } from '@tiptap/react';
import { getTextDirection } from '@/constants/translations';

// Border detection threshold in pixels (larger for easier targeting)
const BORDER_THRESHOLD = 12;
// Edge detection threshold for add buttons
const EDGE_THRESHOLD = 40;

export type TableMouseState = {
    // Active table reference
    activeTable: HTMLTableElement | null;
    tableRect: DOMRect | null;

    // Column detection
    hoveredColumnIndex: number | null;
    columnRect: DOMRect | null;
    nearColumnBorder: {
        columnIndex: number;
        x: number;
        isLastColumn: boolean;
    } | null;

    // Row detection
    hoveredRowIndex: number | null;
    rowRect: DOMRect | null;

    // Resize handle position (full table height)
    resizeHandlePosition: {
        top: number;
        x: number;
        height: number;
        columnIndex: number;
    } | null;

    // Column menu trigger position (3-dot at top)
    columnMenuPosition: {
        top: number;
        left: number;
        width: number;
        columnIndex: number;
    } | null;

    // Row menu trigger position (3-dot at left)
    rowMenuPosition: {
        top: number;
        left: number;
        height: number;
        rowIndex: number;
    } | null;

    // Edge add button positions
    addColumnPosition: {
        top: number;
        left: number;
        height: number;
    } | null;
    addRowPosition: {
        top: number;
        left: number;
        width: number;
    } | null;

    // Mouse position relative to table
    isNearTable: boolean;
    mouseX: number;
    mouseY: number;
};

const initialState: TableMouseState = {
    activeTable: null,
    tableRect: null,
    hoveredColumnIndex: null,
    columnRect: null,
    nearColumnBorder: null,
    hoveredRowIndex: null,
    rowRect: null,
    resizeHandlePosition: null,
    columnMenuPosition: null,
    rowMenuPosition: null,
    addColumnPosition: null,
    addRowPosition: null,
    isNearTable: false,
    mouseX: 0,
    mouseY: 0,
};

type UseTableMouseTrackingOptions = {
    enabled?: boolean;
    /** Ref to the portal container. If provided, positions will be container-relative instead of viewport-relative. */
    portalContainerRef?: RefObject<HTMLElement | null>;
};

export function useTableMouseTracking(
    editor: Editor | null,
    options: UseTableMouseTrackingOptions = {},
): TableMouseState {
    const { enabled = true, portalContainerRef } = options;
    const [state, setState] = useState<TableMouseState>(initialState);
    const rafRef = useRef<number | null>(null);
    const lastUpdateRef = useRef<number>(0);

    const detectColumnFromMouse = useCallback(
        (
            table: HTMLTableElement,
            mouseX: number,
            _tableRect: DOMRect,
        ): {
            columnIndex: number | null;
            columnRect: DOMRect | null;
            nearBorder: { columnIndex: number; x: number; isLastColumn: boolean } | null;
        } => {
            // Get first row to iterate cells
            const firstRow = table.querySelector('tr');
            if (!firstRow) return { columnIndex: null, columnRect: null, nearBorder: null };

            const cells = Array.from(firstRow.querySelectorAll('th, td'));
            let columnIndex: number | null = null;
            let columnRect: DOMRect | null = null;
            let nearBorder: { columnIndex: number; x: number; isLastColumn: boolean } | null = null;

            for (let i = 0; i < cells.length; i++) {
                const cell = cells[i] as HTMLElement;
                const rect = cell.getBoundingClientRect();

                // Check if mouse is within this column
                if (mouseX >= rect.left && mouseX <= rect.right) {
                    columnIndex = i;
                    columnRect = rect;

                    // Check proximity to right border (for resize handle)
                    const distanceFromRightEdge = rect.right - mouseX;
                    if (distanceFromRightEdge <= BORDER_THRESHOLD && distanceFromRightEdge >= 0) {
                        nearBorder = {
                            columnIndex: i,
                            x: rect.right,
                            isLastColumn: i === cells.length - 1,
                        };
                    }
                    break;
                }

                // Check if mouse is between columns (on the border)
                if (i < cells.length - 1) {
                    const nextCell = cells[i + 1] as HTMLElement;
                    const nextRect = nextCell.getBoundingClientRect();
                    if (mouseX > rect.right - BORDER_THRESHOLD && mouseX < nextRect.left + BORDER_THRESHOLD) {
                        nearBorder = {
                            columnIndex: i,
                            x: rect.right,
                            isLastColumn: false,
                        };
                        columnIndex = i;
                        columnRect = rect;
                        break;
                    }
                }
            }

            return { columnIndex, columnRect, nearBorder };
        },
        [],
    );

    const detectRowFromMouse = useCallback(
        (
            table: HTMLTableElement,
            mouseY: number,
        ): {
            rowIndex: number | null;
            rowRect: DOMRect | null;
        } => {
            const rows = Array.from(table.querySelectorAll('tr'));

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i] as HTMLElement;
                const rect = row.getBoundingClientRect();

                if (mouseY >= rect.top && mouseY <= rect.bottom) {
                    return { rowIndex: i, rowRect: rect };
                }
            }

            return { rowIndex: null, rowRect: null };
        },
        [],
    );

    const calculatePositions = useCallback(
        (
            tableRect: DOMRect,
            columnIndex: number | null,
            columnRect: DOMRect | null,
            rowIndex: number | null,
            rowRect: DOMRect | null,
            nearBorder: { columnIndex: number; x: number; isLastColumn: boolean } | null,
            mouseX: number,
            mouseY: number,
        ) => {
            let resizeHandlePosition: TableMouseState['resizeHandlePosition'] = null;
            let columnMenuPosition: TableMouseState['columnMenuPosition'] = null;
            let rowMenuPosition: TableMouseState['rowMenuPosition'] = null;
            let addColumnPosition: TableMouseState['addColumnPosition'] = null;
            let addRowPosition: TableMouseState['addRowPosition'] = null;

            // Determine direction from editor or active table (if possible)
            // For now, assume editor direction governs the UI
            const isRTL =
                editor &&
                (editor.storage.translationDirection === 'rtl' ||
                    getTextDirection(
                        ((editor.options.editorProps.attributes as Record<string, string>)?.lang as string) ||
                            '',
                    ) === 'rtl' ||
                    (editor.options.editorProps.attributes as Record<string, string>)?.dir === 'rtl'); // Resize handle: full-height bar on column border
            if (nearBorder) {
                resizeHandlePosition = {
                    top: tableRect.top,
                    x: nearBorder.x,
                    height: tableRect.height,
                    columnIndex: nearBorder.columnIndex,
                };
            }

            // Column menu: 3-dot button at column top
            if (columnIndex !== null && columnRect) {
                columnMenuPosition = {
                    top: tableRect.top - 28,
                    left: columnRect.left,
                    width: columnRect.width,
                    columnIndex,
                };
            }

            // Row menu: 3-dot button at row side
            if (rowIndex !== null && rowRect) {
                rowMenuPosition = {
                    top: rowRect.top,
                    // LTR: Left side (-32px). Render adds +16px -> -16px physical. Gap 4px.
                    // RTL: Right side (-12px). Render adds +16px -> +4px physical. Gap 4px.
                    left: isRTL ? tableRect.right - 12 : tableRect.left - 32,
                    height: rowRect.height,
                    rowIndex,
                };
            }

            // Add column button: side edge of table
            const nearSideEdge = isRTL
                ? mouseX > tableRect.left - EDGE_THRESHOLD && mouseX < tableRect.left + EDGE_THRESHOLD
                : mouseX > tableRect.right - EDGE_THRESHOLD && mouseX < tableRect.right + EDGE_THRESHOLD;

            if (nearSideEdge) {
                addColumnPosition = {
                    top: tableRect.top,
                    // LTR: Right edge + 4px. Render -2px -> +2px physical. Gap 2px.
                    // RTL: Left edge - 12px. Render -2px -> -14px physical. Gap 2px (assuming 12px width).
                    left: isRTL ? tableRect.left - 12 : tableRect.right + 4,
                    height: tableRect.height,
                };
            }

            // Add row button: bottom edge of table
            const nearBottomEdge =
                mouseY > tableRect.bottom - EDGE_THRESHOLD && mouseY < tableRect.bottom + EDGE_THRESHOLD;
            if (nearBottomEdge) {
                addRowPosition = {
                    top: tableRect.bottom + 4,
                    left: tableRect.left,
                    width: tableRect.width,
                };
            }

            return {
                resizeHandlePosition,
                columnMenuPosition,
                rowMenuPosition,
                addColumnPosition,
                addRowPosition,
            };
        },
        [],
    );

    useEffect(() => {
        if (!enabled || !editor) {
            setState(initialState);
            return;
        }

        const handleMouseMove = (e: MouseEvent) => {
            // Throttle with RAF for 60fps
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }

            rafRef.current = requestAnimationFrame(() => {
                const now = performance.now();
                // Additional throttle: max 60fps (16.67ms)
                if (now - lastUpdateRef.current < 16) return;
                lastUpdateRef.current = now;

                const mouseX = e.clientX;
                const mouseY = e.clientY;

                // Find table under cursor or nearby
                const target = e.target as HTMLElement;
                const table = target.closest('table') as HTMLTableElement | null;

                // Also check for tables in the editor
                let activeTable = table;
                if (!activeTable) {
                    // Check if we're near any table in the editor
                    const editorElement = editor.view.dom;
                    const tables = editorElement.querySelectorAll('table');

                    for (const t of tables) {
                        const rect = t.getBoundingClientRect();
                        // Extended hit area around table (for edge buttons)
                        const extendedRect = {
                            top: rect.top - 40,
                            bottom: rect.bottom + 50,
                            left: rect.left - 40,
                            right: rect.right + 50,
                        };

                        if (
                            mouseX >= extendedRect.left &&
                            mouseX <= extendedRect.right &&
                            mouseY >= extendedRect.top &&
                            mouseY <= extendedRect.bottom
                        ) {
                            activeTable = t as HTMLTableElement;
                            break;
                        }
                    }
                }

                if (!activeTable) {
                    setState((prev) => {
                        if (!prev.activeTable) return prev;
                        return initialState;
                    });
                    return;
                }

                const tableRect = activeTable.getBoundingClientRect();
                const isNearTable =
                    mouseX >= tableRect.left - 40 &&
                    mouseX <= tableRect.right + 50 &&
                    mouseY >= tableRect.top - 40 &&
                    mouseY <= tableRect.bottom + 50;

                // Detect column and row
                const { columnIndex, columnRect, nearBorder } = detectColumnFromMouse(
                    activeTable,
                    mouseX,
                    tableRect,
                );
                const { rowIndex, rowRect } = detectRowFromMouse(activeTable, mouseY);

                // Calculate UI element positions
                const positions = calculatePositions(
                    tableRect,
                    columnIndex,
                    columnRect,
                    rowIndex,
                    rowRect,
                    nearBorder,
                    mouseX,
                    mouseY,
                );

                // Portal Clipping Logic:
                // Find true scroll container (ScrollArea viewport) to clip against
                if (editor && editor.view && editor.view.dom) {
                    const getScrollParent = (node: HTMLElement): HTMLElement => {
                        if (!node) return document.documentElement;
                        const overflowY = window.getComputedStyle(node).overflowY;
                        const isScrollable = overflowY !== 'visible' && overflowY !== 'hidden';
                        if (isScrollable && node.scrollHeight >= node.clientHeight) {
                            return node;
                        }
                        return getScrollParent(node.parentElement as HTMLElement) || document.documentElement;
                    };

                    const scrollParent = getScrollParent(editor.view.dom);
                    const scrollRect = scrollParent.getBoundingClientRect();
                    const CLIP_PADDING = 10;

                    // Helper to check visibilityght overlap but clip hard edges

                    const isVisible = (top: number, height = 0) => {
                        return (
                            top + height / 2 >= scrollRect.top - CLIP_PADDING &&
                            top + height / 2 <= scrollRect.bottom + CLIP_PADDING
                        );
                    };

                    if (
                        positions.rowMenuPosition &&
                        !isVisible(positions.rowMenuPosition.top, positions.rowMenuPosition.height)
                    ) {
                        positions.rowMenuPosition = null;
                        positions.addRowPosition = null;
                    }
                    if (positions.columnMenuPosition && !isVisible(positions.columnMenuPosition.top)) {
                        positions.columnMenuPosition = null;
                    }
                    if (
                        positions.addColumnPosition &&
                        !isVisible(positions.addColumnPosition.top, positions.addColumnPosition.height)
                    ) {
                        positions.addColumnPosition = null;
                    }
                    if (positions.addRowPosition && !isVisible(positions.addRowPosition.top)) {
                        positions.addRowPosition = null;
                    }
                    if (
                        positions.resizeHandlePosition &&
                        !isVisible(positions.resizeHandlePosition.top, positions.resizeHandlePosition.height)
                    ) {
                        positions.resizeHandlePosition = null;
                    }
                }

                // Container-relative offset adjustment
                // If portalContainerRef is provided, subtract its position to make coords container-relative
                let offsetX = 0;
                let offsetY = 0;
                if (portalContainerRef?.current) {
                    const containerRect = portalContainerRef.current.getBoundingClientRect();
                    offsetX = containerRect.left;
                    offsetY = containerRect.top;
                }

                // Helper to apply offset to position objects
                const applyOffset = <T extends { top: number; left: number } | null>(pos: T): T => {
                    if (!pos || (offsetX === 0 && offsetY === 0)) return pos;
                    return { ...pos, top: pos.top - offsetY, left: pos.left - offsetX };
                };

                const adjustedPositions = {
                    resizeHandlePosition: positions.resizeHandlePosition
                        ? {
                              ...positions.resizeHandlePosition,
                              top: positions.resizeHandlePosition.top - offsetY,
                              x: positions.resizeHandlePosition.x - offsetX,
                          }
                        : null,
                    columnMenuPosition: applyOffset(positions.columnMenuPosition),
                    rowMenuPosition: applyOffset(positions.rowMenuPosition),
                    addColumnPosition: applyOffset(positions.addColumnPosition),
                    addRowPosition: applyOffset(positions.addRowPosition),
                };

                setState({
                    activeTable,
                    tableRect,
                    hoveredColumnIndex: columnIndex,
                    columnRect,
                    nearColumnBorder: nearBorder,
                    hoveredRowIndex: rowIndex,
                    rowRect,
                    ...adjustedPositions,
                    isNearTable,
                    mouseX,
                    mouseY,
                });
            });
        };

        const handleMouseLeave = () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
            setState(initialState);
        };

        const handleScroll = () => {
            // Reset state on scroll to prevent stale positions
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
            setState((prev) => ({
                ...prev,
                resizeHandlePosition: null,
                columnMenuPosition: null,
                rowMenuPosition: null,
                addColumnPosition: null,
                addRowPosition: null,
            }));
        };

        document.addEventListener('mousemove', handleMouseMove, { passive: true });
        document.addEventListener('mouseleave', handleMouseLeave);
        window.addEventListener('scroll', handleScroll, { passive: true, capture: true });

        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseleave', handleMouseLeave);
            window.removeEventListener('scroll', handleScroll, { capture: true });
        };
    }, [enabled, editor, portalContainerRef, detectColumnFromMouse, detectRowFromMouse, calculatePositions]);

    return state;
}
