/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * Extended TableCell Extension
 *
 * CRITICAL: Defines ALL attributes with complete parseHTML/renderHTML methods.
 * Do NOT use ...this.parent?.() - TipTap's default TableCell has incomplete
 * attribute definitions that cause serialization failures.
 *
 * IMPORTANT: renderHTML MUST always return attributes (even default values)
 * because TipTap uses renderHTML for BOTH HTML rendering AND JSON serialization.
 * Returning {} for default values causes getJSON() to omit the attribute entirely,
 * leading to data loss on save/reload cycles.
 */

import TableCell from '@tiptap/extension-table-cell';

export const TableCellExtended = TableCell.extend({
    addAttributes() {
        return {
            // colspan - number of columns this cell spans
            colspan: {
                default: 1,
                keepOnSplit: false, // Reset colspan when cell is split
                parseHTML: (element) => {
                    const colspan = element.getAttribute('colspan');
                    return colspan ? parseInt(colspan, 10) : 1;
                },
                renderHTML: (attributes) => {
                    // ALWAYS include colspan - required for proper JSON serialization
                    return { colspan: attributes.colspan };
                },
            },

            // rowspan - number of rows this cell spans
            rowspan: {
                default: 1,
                keepOnSplit: false, // Reset rowspan when cell is split
                parseHTML: (element) => {
                    const rowspan = element.getAttribute('rowspan');
                    return rowspan ? parseInt(rowspan, 10) : 1;
                },
                renderHTML: (attributes) => {
                    // ALWAYS include rowspan - required for proper JSON serialization
                    return { rowspan: attributes.rowspan };
                },
            },

            // colwidth - column width array for resizable tables
            colwidth: {
                default: null,
                keepOnSplit: true, // Preserve column width when cell is split
                parseHTML: (element) => {
                    const colwidth = element.getAttribute('colwidth');
                    if (colwidth) {
                        return colwidth.split(',').map((w) => parseInt(w, 10));
                    }
                    // Fallback: check colgroup
                    const table = element.closest('table');
                    const cols = table?.querySelectorAll('colgroup > col');
                    const cellIndex = Array.from(element.parentElement?.children || []).indexOf(element);
                    if (cellIndex > -1 && cols && cols[cellIndex]) {
                        const colWidth = cols[cellIndex].getAttribute('width');
                        return colWidth ? [parseInt(colWidth, 10)] : null;
                    }
                    return null;
                },
                renderHTML: (attributes) => {
                    // Only render if colwidth has a value (null is valid default)
                    if (!attributes.colwidth) return {};
                    return { colwidth: attributes.colwidth.join(',') };
                },
            },

            // textAlign - cell text alignment (left, center, right, justify)
            textAlign: {
                default: null,
                keepOnSplit: true, // Preserve alignment when cell is split
                parseHTML: (element) => {
                    // Check inline style first
                    const styleAlign = element.style.textAlign;
                    if (styleAlign) return styleAlign;
                    // Fallback to data attribute
                    return element.getAttribute('data-text-align') || null;
                },
                renderHTML: (attributes) => {
                    // Only render if textAlign has a value (null is valid default)
                    if (!attributes.textAlign) return {};
                    return {
                        style: `text-align: ${attributes.textAlign}`,
                        'data-text-align': attributes.textAlign,
                    };
                },
            },
        };
    },
});
