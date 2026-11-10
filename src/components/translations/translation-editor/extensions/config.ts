/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * Extension Configuration
 * Centralizes all TipTap extension configurations
 */

export type ExtensionOptions = {
    editable?: boolean;
};

export function getExtensionConfig(_options?: ExtensionOptions) {
    return {
        starterKit: {
            // Disable default horizontal rule (we use ThematicBreak)
            horizontalRule: false as const,
            link: false as const,
            underline: false as const,
            // Disable default heading and paragraph - using extended versions
            // that always serialize attrs to prevent data loss on save/reload
            heading: false as const,
            paragraph: false as const,
        },
        textAlign: {
            // Only heading and paragraph - tableCell/tableHeader handled by extended extensions
            // to avoid global/instance attribute conflict
            types: ['heading', 'paragraph'],
            alignments: ['left', 'right', 'center', 'justify', 'start', 'end'],
        },
        link: {
            openOnClick: false,
            HTMLAttributes: {
                class: 'editor-link',
            },
        },
        table: {
            resizable: false, // Styling handled in Google Docs export
            renderWrapper: true, // Creates .tableWrapper div for padding trick (drag handle hover zone)
            HTMLAttributes: {
                class: 'translation-table',
            },
        },
        tableHeader: {
            HTMLAttributes: {
                class: 'translation-table-header',
            },
        },
        tableCell: {
            HTMLAttributes: {
                class: 'translation-table-cell',
            },
        },
        tableRow: {},
        characterCount: {
            limit: null, // No character limit
        },
    };
}
