/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * Footnote Node Extension for TipTap
 * Handles footnote references from the backend document pipeline
 *
 * Backend sends: { type: 'footnote', attrs: { number: 1 }, content: [...] }
 * This extension renders it as a superscript number with expandable content
 */

import { Node, mergeAttributes } from '@tiptap/react';

export type FootnoteAttrs = {
    number?: number;
};

/**
 * Custom TipTap Node for footnotes
 * Renders as a superscript number with tooltip or expandable content
 */
export const Footnote = Node.create<{ attrs: FootnoteAttrs }>({
    name: 'footnote',

    group: 'inline',

    inline: true,

    content: 'inline*', // Allow inline content for the footnote text

    atom: true, // Treat as a single unit

    selectable: true,

    draggable: false,

    addAttributes() {
        return {
            number: {
                default: 1,
                parseHTML: (element) => {
                    const num = element.getAttribute('data-footnote-number');
                    return num ? parseInt(num, 10) : 1;
                },
                renderHTML: (attributes) => {
                    return {
                        'data-footnote-number': attributes.number,
                    };
                },
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'span[data-type="footnote"]',
            },
            {
                tag: 'sup.footnote',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        const number = HTMLAttributes['data-footnote-number'] || 1;

        return [
            'span',
            mergeAttributes(HTMLAttributes, {
                'data-type': 'footnote',
                class: 'footnote-container',
            }),
            ['sup', { class: 'footnote-number' }, `[${number}]`],
        ];
    },

    addNodeView() {
        return ({ editor, getPos, node }) => {
            // Create container
            const container = document.createElement('span');
            container.setAttribute('data-type', 'footnote');
            container.className = 'footnote-container';

            // Create superscript number
            const sup = document.createElement('sup');
            sup.className = 'footnote-number';
            sup.textContent = `[${node.attrs.number || 1}]`;

            // Create tooltip container for footnote content
            const tooltip = document.createElement('div');
            tooltip.className = 'footnote-tooltip';

            // Add arrow to tooltip
            const arrow = document.createElement('div');
            arrow.className = 'footnote-tooltip-arrow';
            tooltip.appendChild(arrow);

            // Create content area for the footnote text
            const contentArea = document.createElement('div');
            contentArea.className = 'footnote-content-area';

            // Handle content
            if (node.content.size > 0) {
                const tempDiv = document.createElement('div');
                node.content.forEach((child) => {
                    if (child.isText) {
                        tempDiv.textContent = (tempDiv.textContent || '') + child.text;
                    }
                });
                contentArea.textContent = tempDiv.textContent || '';
                tooltip.insertBefore(contentArea, arrow);
            }

            // Show tooltip on hover
            container.addEventListener('mouseenter', () => {
                if (contentArea.textContent) {
                    tooltip.classList.add('visible');
                }
            });

            container.addEventListener('mouseleave', () => {
                tooltip.classList.remove('visible');
            });

            // Click to edit footnote number
            sup.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                const newNumber = prompt('Enter footnote number:', String(node.attrs.number || 1));
                if (newNumber && !isNaN(parseInt(newNumber, 10))) {
                    if (typeof getPos === 'function') {
                        const pos = getPos();
                        if (pos !== undefined) {
                            const tr = editor.state.tr;
                            tr.setNodeMarkup(pos, undefined, {
                                ...node.attrs,
                                number: parseInt(newNumber, 10),
                            });
                            editor.view.dispatch(tr);
                        }
                    }
                }
            });

            container.appendChild(sup);
            container.appendChild(tooltip);

            return {
                dom: container,
                contentDOM: contentArea,
                update: (node) => {
                    if (node.type.name !== 'footnote') {
                        return false;
                    }
                    sup.textContent = `[${node.attrs.number || 1}]`;

                    // Update content
                    if (node.content.size > 0) {
                        const tempDiv = document.createElement('div');
                        node.content.forEach((child) => {
                            if (child.isText) {
                                tempDiv.textContent = (tempDiv.textContent || '') + child.text;
                            }
                        });
                        contentArea.textContent = tempDiv.textContent || '';
                    } else {
                        contentArea.textContent = '';
                    }

                    return true;
                },
                ignoreMutation: (mutation) => {
                    // Ignore mutations to the tooltip
                    const target = mutation.target as unknown as globalThis.Node;
                    return (
                        mutation.target === tooltip ||
                        mutation.target === contentArea ||
                        (target && tooltip.contains(target))
                    );
                },
            };
        };
    },

    addCommands() {
        return {
            setFootnote:
                (attrs?: FootnoteAttrs) =>
                ({ commands }) => {
                    return commands.insertContent({
                        type: this.name,
                        attrs: {
                            number: attrs?.number || 1,
                        },
                        content: [
                            {
                                type: 'text',
                                text: 'Footnote content here',
                            },
                        ],
                    });
                },
        };
    },
});
