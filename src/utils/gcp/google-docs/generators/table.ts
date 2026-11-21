/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { docs_v1 } from 'googleapis';
import { TableNode, ContentNode, TableCellNode } from '@/engine/document/types';

/**
 * Handles Table generation.
 * Requires a recursive callback to process cell content.
 */
export async function generateTableRequests(
    node: TableNode,
    startIndex: number,
    processNode: (
        node: ContentNode,
        index: number,
        options?: {
            skipTrailingNewline?: boolean;
            segmentId?: string;
            overrideFontSize?: number;
            overrideColor?: docs_v1.Schema$OptionalColor;
            isDocumentRtl?: boolean;
        },
    ) => Promise<{ requests: docs_v1.Schema$Request[]; length: number }>,
    options?: {
        segmentId?: string;
        overrideFontSize?: number;
        skipHeaderStyling?: boolean;
        overrideColor?: docs_v1.Schema$OptionalColor;
        isDocumentRtl?: boolean;
    },
): Promise<{ requests: docs_v1.Schema$Request[]; length: number }> {
    const requests: docs_v1.Schema$Request[] = [];
    const locationProps = options?.segmentId ? { segmentId: options.segmentId } : {};

    // 1. Calculate Grid Dimensions and Map Content
    // We need to resolve colspan/rowspan to determine the actual MxN grid.
    const grid: (TableCellNode | null)[][] = [];
    const spanMap = new Map<string, { row: number; col: number; rowspan: number; colspan: number }>();

    // We can't trust node.content.length for rows or cells for columns directly due to spans.
    // We must simulate placement.
    let maxRow = 0;
    let maxCol = 0;

    // Initialize grid with specific rows based on input length first (will expand if needed)
    for (let i = 0; i < node.content.length; i++) {
        if (!grid[i]) grid[i] = [];
    }

    for (let r = 0; r < node.content.length; r++) {
        const row = node.content[r];
        let c = 0;

        for (const cell of row.content) {
            while (grid[r] && grid[r][c]) {
                c++;
            }

            // Ensure row exists in grid
            if (!grid[r]) grid[r] = [];

            // Get span attributes (default to 1)
            const colspan = (cell as TableCellNode).attrs?.colspan || 1;
            const rowspan = (cell as TableCellNode).attrs?.rowspan || 1;

            // Place cell in grid
            for (let i = 0; i < rowspan; i++) {
                const targetRow = r + i;
                if (!grid[targetRow]) grid[targetRow] = [];
                for (let j = 0; j < colspan; j++) {
                    const targetCol = c + j;
                    // Mark as occupied.
                    // We store the cell reference only in the Start position (i=0, j=0)
                    // For shadow positions, we simply mark them as null/occupied?
                    // Actually we need to know it's occupied to skip it in the loop above.
                    // Let's store the cell in ALL positions for occupancy check,
                    // but we need to know which one is the "Real" one for insertion.
                    // We can check `if (i===0 && j===0)`.

                    grid[targetRow][targetCol] = cell as TableCellNode;
                }
            }

            // Register span for merging later (only if > 1)
            if (colspan > 1 || rowspan > 1) {
                // Key by exact node reference or position?
                // Using position is safer.
                spanMap.set(`${r},${c}`, { row: r, col: c, rowspan, colspan });
            }

            // Advance column pointer by colspan
            c += colspan;
        }

        // Update max dimensions
        // Row count is at least r+1.
        // Col count is c.
        if (c > maxCol) maxCol = c;
    }
    maxRow = grid.length;

    // Check if table is valid
    if (maxRow === 0 || maxCol === 0) {
        return { requests: [], length: 0 };
    }

    // RTL: Reverse each row's cells so column 0 content appears on the right
    // This is done BEFORE generating requests so cursor iteration places content correctly
    if (options?.isDocumentRtl) {
        console.log('[TABLE] RTL: Reversing grid rows for RTL layout');
        for (let r = 0; r < maxRow; r++) {
            if (grid[r]) {
                grid[r] = grid[r].reverse();
            }
        }
        // Also need to update spanMap column positions
        const newSpanMap = new Map<string, { row: number; col: number; rowspan: number; colspan: number }>();
        for (const span of spanMap.values()) {
            const newCol = maxCol - 1 - span.col - (span.colspan - 1);
            newSpanMap.set(`${span.row},${newCol}`, { ...span, col: newCol });
        }
        spanMap.clear();
        for (const [key, val] of newSpanMap) {
            spanMap.set(key, val);
        }
    }

    // 2. Insert Table (MxN)
    requests.push({
        insertTable: {
            rows: maxRow,
            columns: maxCol,
            location: { index: startIndex, ...locationProps },
        },
    });

    // 2.1 Apply Legendary Table Styles (Compact Padding, Crisp Borders)
    const baseCellStyle: docs_v1.Schema$TableCellStyle = {
        paddingTop: { magnitude: 1.44, unit: 'PT' },
        paddingBottom: { magnitude: 1.44, unit: 'PT' },
        paddingLeft: { magnitude: 3.6, unit: 'PT' },
        paddingRight: { magnitude: 3.6, unit: 'PT' },
        borderTop: {
            dashStyle: 'SOLID',
            width: { magnitude: 0.75, unit: 'PT' },
            color: { color: { rgbColor: { red: 0, green: 0, blue: 0 } } },
        },
        borderBottom: {
            dashStyle: 'SOLID',
            width: { magnitude: 0.75, unit: 'PT' },
            color: { color: { rgbColor: { red: 0, green: 0, blue: 0 } } },
        },
        borderLeft: {
            dashStyle: 'SOLID',
            width: { magnitude: 0.75, unit: 'PT' },
            color: { color: { rgbColor: { red: 0, green: 0, blue: 0 } } },
        },
        borderRight: {
            dashStyle: 'SOLID',
            width: { magnitude: 0.75, unit: 'PT' },
            color: { color: { rgbColor: { red: 0, green: 0, blue: 0 } } },
        },
    };
    const baseCellFields =
        'paddingTop,paddingBottom,paddingLeft,paddingRight,borderTop,borderBottom,borderLeft,borderRight';
    // Note: RTL direction is handled at paragraph level in text.ts, not at cell level
    // Google Docs API TableCellStyle does not support contentDirection

    requests.push({
        updateTableCellStyle: {
            tableRange: {
                tableCellLocation: {
                    tableStartLocation: { index: startIndex + 1, ...locationProps },
                    rowIndex: 0,
                    columnIndex: 0,
                },
                rowSpan: maxRow,
                columnSpan: maxCol,
            },
            tableCellStyle: baseCellStyle,
            fields: baseCellFields,
        },
    });

    // 2.2 Apply Header Row Styles (Light Grey Background) - SKIP for Layout Tables
    if (!options?.skipHeaderStyling) {
        requests.push({
            updateTableCellStyle: {
                tableRange: {
                    tableCellLocation: {
                        tableStartLocation: { index: startIndex + 1, ...locationProps },
                        rowIndex: 0,
                        columnIndex: 0,
                    },
                    rowSpan: 1,
                    columnSpan: maxCol,
                },
                tableCellStyle: {
                    backgroundColor: { color: { rgbColor: { red: 0.95, green: 0.95, blue: 0.95 } } }, // #F3F3F3
                },
                fields: 'backgroundColor',
            },
        });
    }

    // 3. Insert Content & Calculate Cursor
    let cursor = startIndex;
    cursor += 1; // Skip Implicit Preceding Newline (+1)
    cursor += 1; // Skip Table Start (+1)

    // Iterate the FULL Virtual Grid
    // Note: For RTL, grid rows were already reversed above so iteration places content correctly
    console.log(`[TABLE] isDocumentRtl=${options?.isDocumentRtl}, maxCol=${maxCol}, maxRow=${maxRow}`);
    for (let r = 0; r < maxRow; r++) {
        cursor += 1; // Skip Row Start (+1)

        // Grid was already reversed for RTL above, just iterate normally
        for (let c = 0; c < maxCol; c++) {
            cursor += 1; // Skip Cell Start (+1)

            // Retrieve cell from grid
            const cell = grid[r]?.[c];

            const isOriginRow = r === 0 || grid[r - 1]?.[c] !== cell;
            const isOriginCol = c === 0 || grid[r]?.[c - 1] !== cell;
            const isOrigin = cell && isOriginRow && isOriginCol;

            if (isOrigin && cell && cell.content) {
                // Determine the last block content index in this cell
                const lastBlockIndex = cell.content.length - 1;

                cell.content.forEach(async (_cellChild, _childIdx) => {
                    // Wait, recursive callback inside forEach might be tricky with await in loop?
                    // The original code was `for (const cellChild of cell.content)`.
                    // Let's stick to standard for loop to handle async await properly.
                });

                for (let childIdx = 0; childIdx < cell.content.length; childIdx++) {
                    const cellChild = cell.content[childIdx];

                    // Check if this is the last element
                    // AND if it's a paragraph/heading (Text is wrapped in mapper).
                    // Logic: If it's the last child, we skip the trailing newline to avoid double-newline in cell.
                    const isLast = childIdx === lastBlockIndex;

                    const result = await processNode(cellChild, cursor, {
                        skipTrailingNewline: isLast,
                        segmentId: options?.segmentId,
                        overrideFontSize: options?.overrideFontSize,
                        overrideColor: options?.overrideColor,
                        isDocumentRtl: options?.isDocumentRtl,
                    });
                    requests.push(...result.requests);

                    // Force Bold Text for Header Row (Only for data tables)
                    if (r === 0 && !options?.skipHeaderStyling && result.length > 0) {
                        requests.push({
                            updateTextStyle: {
                                range: {
                                    startIndex: cursor,
                                    endIndex: cursor + result.length,
                                    ...locationProps,
                                },
                                textStyle: { bold: true },
                                fields: 'bold',
                            },
                        });
                    }

                    cursor += result.length;
                }
            }

            cursor += 1; // Skip Default Newline (+1)
        }
    }

    cursor += 1; // Skip Table End (+1)

    // 4. Merge Cells
    // We must execute merges.
    // Important: Merging cells does NOT change the text content indices if done correctly,
    // BUT Google Docs API for mergeTableCells uses `tableRange` (rowIndex, columnIndex).
    // These are structural indices, not character indices.
    // They are valid regardless of content length.

    for (const span of spanMap.values()) {
        requests.push({
            mergeTableCells: {
                tableRange: {
                    tableCellLocation: {
                        tableStartLocation: { index: startIndex + 1, ...locationProps },
                        rowIndex: span.row,
                        columnIndex: span.col,
                    },
                    rowSpan: span.rowspan,
                    columnSpan: span.colspan,
                },
            },
        });
    }

    return {
        requests,
        length: cursor - startIndex,
    };
}
