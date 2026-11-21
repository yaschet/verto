/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * Spacer Node Extension for TipTap
 * Handles vertical spacing nodes from the backend document pipeline
 *
 * Backend sends: { type: 'spacer', attrs: { height: 24 } }
 * This extension renders it as a non-editable div with specified height
 */

import { Node, ReactNodeViewRenderer } from '@tiptap/react';
import { SpacerComponent } from './spacer-component';

export type SpacerAttrs = {
    height?: number;
};

/**
 * Custom TipTap Node for vertical spacing
 * Makes spacing visible and selectable but not directly editable
 */
export const Spacer = Node.create<{ attrs: SpacerAttrs }>({
    name: 'spacer',

    group: 'block',

    atom: true, // Node is atomic (not editable directly)

    selectable: true, // Can be selected and deleted

    draggable: true, // Allow dragging

    addAttributes() {
        return {
            height: {
                default: 24,
                parseHTML: (element) => {
                    const height = element.getAttribute('data-height');
                    return height ? parseInt(height, 10) : 32;
                },
                renderHTML: (attributes) => {
                    return {
                        'data-height': attributes.height,
                    };
                },
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="spacer"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        const height = HTMLAttributes['data-height'] || 24;
        return [
            'div',
            {
                ...HTMLAttributes,
                'data-type': 'spacer',
                class: 'tiptap-spacer',
                style: `height: ${height}px;`,
            },
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(SpacerComponent);
    },

    addCommands() {
        return {
            setSpacer:
                (attrs?: SpacerAttrs) =>
                ({ commands }) => {
                    return commands.insertContent({
                        type: this.name,
                        attrs: {
                            height: attrs?.height || 24,
                        },
                    });
                },
        };
    },
});
