/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * Table Structure Repair Utility
 *
 * AI-generated tables often have malformed colspan/rowspan values that don't
 * create valid rectangular tables. TipTap/ProseMirror requires tables to be
 * perfectly rectangular — the sum of colspan values in each row must equal
 * the total column count, and rowspan cells must correctly leave gaps in
 * subsequent rows.
 *
 * This utility repairs malformed tables by:
 * 1. Calculating the expected column count from the widest row
 * 2. Building an occupancy map (tracking which cells occupy which positions)
 * 3. Filling missing cells with empty placeholders
 * 4. Trimming excess cells from rows that are too wide
 * 5. Capping rowspan values that extend past the table
 */

import type { JSONContent } from '@tiptap/core';

/**
 * Creates an empty table cell for filling gaps
 */
function createEmptyCell(isHeader: boolean = false): JSONContent {
    return {
        type: isHeader ? 'tableHeader' : 'tableCell',
        attrs: {
            colspan: 1,
            rowspan: 1,
            colwidth: null,
        },
        content: [
            {
                type: 'paragraph',
                content: [{ type: 'text', text: ' ' }],
            },
        ],
    };
}

/**
 * Calculates the maximum column count needed for the table
 * by finding the widest row (sum of colspan values)
 */
function calculateMaxColumns(rows: JSONContent[]): number {
    let maxCols = 0;

    for (const row of rows) {
        if (!row.content || !Array.isArray(row.content)) continue;

        let rowWidth = 0;
        for (const cell of row.content) {
            const colspan = cell.attrs?.colspan ?? 1;
            rowWidth += colspan;
        }
        maxCols = Math.max(maxCols, rowWidth);
    }

    return maxCols;
}

/**
 * Builds an occupancy map tracking which (row, col) positions are taken
 * This accounts for colspan and rowspan
 *
 * Returns a 2D array where occupancy[row][col] = true if occupied
 */
function buildOccupancyMap(rows: JSONContent[], maxCols: number): boolean[][] {
    const totalRows = rows.length;
    const occupancy: boolean[][] = Array.from({ length: totalRows }, () => Array(maxCols).fill(false));

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        const row = rows[rowIndex];
        if (!row.content || !Array.isArray(row.content)) continue;

        let colPosition = 0;

        for (const cell of row.content) {
            // Skip to next available column (might be occupied by rowspan from above)
            while (colPosition < maxCols && occupancy[rowIndex][colPosition]) {
                colPosition++;
            }

            if (colPosition >= maxCols) break;

            const colspan = Math.max(1, cell.attrs?.colspan ?? 1);
            const rowspan = Math.max(1, cell.attrs?.rowspan ?? 1);

            // Cap rowspan to not extend past table
            const effectiveRowspan = Math.min(rowspan, totalRows - rowIndex);

            // Mark cells as occupied
            for (let r = 0; r < effectiveRowspan; r++) {
                for (let c = 0; c < colspan; c++) {
                    const targetRow = rowIndex + r;
                    const targetCol = colPosition + c;
                    if (targetRow < totalRows && targetCol < maxCols) {
                        occupancy[targetRow][targetCol] = true;
                    }
                }
            }

            colPosition += colspan;
        }
    }

    return occupancy;
}

/**
 * Repairs a single table row by filling missing cells and trimming excess
 */
function repairTableRow(
    row: JSONContent,
    rowIndex: number,
    maxCols: number,
    occupancy: boolean[][],
    totalRows: number,
): JSONContent {
    if (!row.content || !Array.isArray(row.content)) {
        // Empty row - fill entirely with empty cells
        const isHeaderRow = rowIndex === 0;
        const cells: JSONContent[] = [];
        for (let col = 0; col < maxCols; col++) {
            if (!occupancy[rowIndex][col]) {
                cells.push(createEmptyCell(isHeaderRow));
            }
        }
        return {
            type: 'tableRow',
            content: cells.length > 0 ? cells : [createEmptyCell(isHeaderRow)],
        };
    }

    const repairedCells: JSONContent[] = [];
    let colPosition = 0;
    let cellIndex = 0;

    while (colPosition < maxCols) {
        // Check if this position is occupied by a rowspan from above
        if (occupancy[rowIndex][colPosition]) {
            // Check if we have a cell that starts here in this row
            const currentCell = row.content[cellIndex];
            if (currentCell) {
                // This cell exists in our row - it's the owner
                const colspan = Math.max(1, currentCell.attrs?.colspan ?? 1);
                let rowspan = Math.max(1, currentCell.attrs?.rowspan ?? 1);

                // Cap rowspan to not extend past table
                rowspan = Math.min(rowspan, totalRows - rowIndex);

                // Add the cell with corrected rowspan
                repairedCells.push({
                    ...currentCell,
                    attrs: {
                        ...currentCell.attrs,
                        colspan,
                        rowspan,
                    },
                });

                cellIndex++;
                colPosition += colspan;
            } else {
                // Position is occupied by rowspan from above - skip it
                colPosition++;
            }
        } else {
            // Position is not occupied - either use next cell or fill gap
            const currentCell = row.content[cellIndex];

            if (currentCell) {
                const colspan = Math.max(1, currentCell.attrs?.colspan ?? 1);
                let rowspan = Math.max(1, currentCell.attrs?.rowspan ?? 1);

                // Cap rowspan to not extend past table
                rowspan = Math.min(rowspan, totalRows - rowIndex);

                repairedCells.push({
                    ...currentCell,
                    attrs: {
                        ...currentCell.attrs,
                        colspan,
                        rowspan,
                    },
                });

                cellIndex++;
                colPosition += colspan;
            } else {
                // No more cells but column needs filling
                const isHeaderRow = rowIndex === 0;
                repairedCells.push(createEmptyCell(isHeaderRow));
                colPosition++;
            }
        }
    }

    // If we still have remaining cells that didn't fit, log warning
    if (cellIndex < row.content.length) {
        console.warn(
            `[repairTableStructure] Row ${rowIndex} had ${row.content.length - cellIndex} excess cells trimmed`,
        );
    }

    return {
        type: 'tableRow',
        content: repairedCells,
    };
}

/**
 * Repairs a malformed table structure to be a valid rectangular grid.
 *
 * @param table - The table node to repair
 * @returns Repaired table with valid structure
 */
export function repairTableStructure(table: JSONContent): JSONContent {
    if (table.type !== 'table' || !table.content || !Array.isArray(table.content)) {
        return table;
    }

    const rows = table.content.filter((node) => node.type === 'tableRow');

    if (rows.length === 0) {
        // Empty table - return minimal valid structure
        return {
            type: 'table',
            attrs: table.attrs,
            content: [
                {
                    type: 'tableRow',
                    content: [createEmptyCell(true)],
                },
            ],
        };
    }

    // Step 1: Calculate max columns needed
    const maxCols = calculateMaxColumns(rows);

    if (maxCols === 0) {
        // No cells found - return minimal valid structure
        return {
            type: 'table',
            attrs: table.attrs,
            content: [
                {
                    type: 'tableRow',
                    content: [createEmptyCell(true)],
                },
            ],
        };
    }

    // Step 2: Build occupancy map to understand current cell positions
    const occupancy = buildOccupancyMap(rows, maxCols);

    // Step 3: Repair each row
    const totalRows = rows.length;
    const repairedRows: JSONContent[] = rows.map((row, rowIndex) =>
        repairTableRow(row, rowIndex, maxCols, occupancy, totalRows),
    );

    // Log if repairs were made
    const originalCellCount = rows.reduce((sum, row) => sum + (row.content?.length ?? 0), 0);
    const repairedCellCount = repairedRows.reduce((sum, row) => sum + (row.content?.length ?? 0), 0);

    if (originalCellCount !== repairedCellCount) {
        console.log(
            `[repairTableStructure] Repaired table: ${originalCellCount} → ${repairedCellCount} cells (${maxCols} cols × ${totalRows} rows)`,
        );
    }

    return {
        type: 'table',
        attrs: table.attrs,
        content: repairedRows,
    };
}

/**
 * Validates if a table has a valid rectangular structure.
 * Useful for checking if repair is needed.
 *
 * @param table - The table node to validate
 * @returns true if valid, false if repairs needed
 */
export function isValidTableStructure(table: JSONContent): boolean {
    if (table.type !== 'table' || !table.content || !Array.isArray(table.content)) {
        return false;
    }

    const rows = table.content.filter((node) => node.type === 'tableRow');
    if (rows.length === 0) return false;

    const maxCols = calculateMaxColumns(rows);
    if (maxCols === 0) return false;

    // Build occupancy map and check that every position is filled exactly once
    const totalRows = rows.length;
    const occupancyCount: number[][] = Array.from({ length: totalRows }, () => Array(maxCols).fill(0));

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        const row = rows[rowIndex];
        if (!row.content || !Array.isArray(row.content)) return false;

        let colPosition = 0;

        for (const cell of row.content) {
            // Skip to next available column
            while (colPosition < maxCols && occupancyCount[rowIndex][colPosition] > 0) {
                colPosition++;
            }

            if (colPosition >= maxCols) {
                // Row has too many cells
                return false;
            }

            const colspan = cell.attrs?.colspan ?? 1;
            const rowspan = cell.attrs?.rowspan ?? 1;

            // Mark cells
            for (let r = 0; r < rowspan; r++) {
                for (let c = 0; c < colspan; c++) {
                    const targetRow = rowIndex + r;
                    const targetCol = colPosition + c;
                    if (targetRow >= totalRows || targetCol >= maxCols) {
                        // Rowspan/colspan extends outside table
                        return false;
                    }
                    occupancyCount[targetRow][targetCol]++;
                }
            }

            colPosition += colspan;
        }
    }

    // Check that every cell is occupied exactly once
    for (let r = 0; r < totalRows; r++) {
        for (let c = 0; c < maxCols; c++) {
            if (occupancyCount[r][c] !== 1) {
                return false;
            }
        }
    }

    return true;
}
