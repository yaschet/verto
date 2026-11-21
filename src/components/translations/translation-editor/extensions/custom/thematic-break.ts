/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * Thematic Break Node Extension for TipTap
 * Maps backend `{ type: 'thematicBreak' }` nodes to a rendered horizontal rule.
 */

import { Node } from '@tiptap/core';

export const ThematicBreak = Node.create({
    name: 'thematicBreak',
    group: 'block',
    atom: true,
    draggable: true, // Can be dragged with DragHandle
    selectable: true,

    parseHTML() {
        return [
            {
                tag: 'hr[data-type="thematic-break"]',
            },
            {
                tag: 'hr',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            'hr',
            {
                ...HTMLAttributes,
                'data-type': 'thematic-break',
                class: 'tiptap-thematic-break',
            },
        ];
    },

    addCommands() {
        return {
            setThematicBreak:
                () =>
                ({ commands }) => {
                    return commands.insertContent({
                        type: this.name,
                    });
                },
        };
    },
});
