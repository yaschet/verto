/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * Extended Table Extension
 *
 * Adds support for dynamic CSS classes on tables.
 * Used for kvp-table (borderless key-value pair tables) vs regular tables.
 *
 * draggable: true enables DragHandle to detect tables in the hover zone.
 * Without this, the handle never appears when hovering table whitespace.
 */

import { Table } from '@tiptap/extension-table';

export const TableExtended = Table.extend({
    // Enable drag handle detection for tables
    draggable: true,
    selectable: true,

    addAttributes() {
        return {
            ...this.parent?.(),
            // Dynamic class for styling variants (e.g., 'kvp-table' for borderless)
            class: {
                default: null,
                parseHTML: (element: HTMLElement) => {
                    // Check for kvp-table class
                    if (element.classList.contains('kvp-table')) {
                        return 'kvp-table';
                    }
                    return element.getAttribute('data-table-class') || null;
                },
                renderHTML: (attributes: Record<string, unknown>) => {
                    if (!attributes.class) return {};
                    return {
                        class: attributes.class,
                        'data-table-class': attributes.class,
                    };
                },
            },
        };
    },
});
