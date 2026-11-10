/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * DescriptionList Extension
 *
 * Parent container for key-value pairs in academic/legal documents.
 * Renders as <dl> element containing multiple descriptionItem nodes.
 *
 * Architecture: DescriptionList > DescriptionItem > DescriptionTerm + DescriptionValue
 *
 * This is the correct ProseMirror pattern for editable key-value pairs:
 * - Both term (label) and value are content nodes with `inline*` content
 * - ProseMirror manages cursor, selection, and editing natively
 * - No custom NodeView required
 *
 * Reference: ProseMirror forum discussion with Marijn (creator)
 * "A new node type with actual dedicated term and description child nodes
 * is probably going to require less hacks"
 */

import { Node, mergeAttributes } from '@tiptap/core';
import type { CommandProps } from '@tiptap/core';

export type DescriptionListOptions = {
    HTMLAttributes: Record<string, unknown>;
};

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        descriptionList: {
            /**
             * Insert a new description list with one empty item
             */
            insertDescriptionList: () => ReturnType;
            /**
             * Add a new item to the current description list
             */
            addDescriptionItem: () => ReturnType;
        };
    }
}

export const DescriptionList = Node.create<DescriptionListOptions>({
    name: 'descriptionList',

    addOptions() {
        return {
            HTMLAttributes: {},
        };
    },

    group: 'block',

    content: 'descriptionItem+',

    parseHTML() {
        return [{ tag: 'dl' }];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            'dl',
            mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { class: 'description-list' }),
            0,
        ];
    },

    addCommands() {
        return {
            insertDescriptionList:
                () =>
                ({ commands }: CommandProps) => {
                    return commands.insertContent({
                        type: 'descriptionList',
                        content: [
                            {
                                type: 'descriptionItem',
                                content: [
                                    { type: 'descriptionTerm', content: [{ type: 'text', text: 'Label' }] },
                                    { type: 'descriptionValue', content: [{ type: 'text', text: 'Value' }] },
                                ],
                            },
                        ],
                    });
                },

            addDescriptionItem:
                () =>
                ({ commands, state }: CommandProps) => {
                    const { $from } = state.selection;

                    // Find if we're inside a descriptionList
                    let listPos = null;
                    for (let d = $from.depth; d > 0; d--) {
                        if ($from.node(d).type.name === 'descriptionList') {
                            listPos = $from.end(d);
                            break;
                        }
                    }

                    if (listPos === null) {
                        return false;
                    }

                    // Insert new item at the end of the list
                    return commands.insertContentAt(listPos, {
                        type: 'descriptionItem',
                        content: [
                            { type: 'descriptionTerm', content: [{ type: 'text', text: 'Label' }] },
                            { type: 'descriptionValue', content: [{ type: 'text', text: 'Value' }] },
                        ],
                    });
                },
        };
    },

    addKeyboardShortcuts() {
        return {
            // Enter in descriptionValue creates new item
            Enter: ({ editor }) => {
                const { state } = editor;
                const { $from } = state.selection;

                // Check if we're in a descriptionValue
                let inValue = false;
                let inTerm = false;
                for (let d = $from.depth; d > 0; d--) {
                    const nodeName = $from.node(d).type.name;
                    if (nodeName === 'descriptionValue') {
                        inValue = true;
                        break;
                    }
                    if (nodeName === 'descriptionTerm') {
                        inTerm = true;
                        break;
                    }
                }

                if (inTerm) {
                    // Move cursor to the value (next sibling)
                    // Find the end of the current term and move to the start of value
                    for (let d = $from.depth; d > 0; d--) {
                        if ($from.node(d).type.name === 'descriptionItem') {
                            const itemStart = $from.start(d);
                            const item = $from.node(d);
                            // descriptionItem has exactly 2 children: term and value
                            // Move to start of value (second child)
                            const termSize = item.child(0).nodeSize;
                            const valueStart = itemStart + termSize + 1; // +1 for entering the value node
                            return editor.commands.setTextSelection(valueStart);
                        }
                    }
                }

                if (inValue) {
                    // Create new description item after current one
                    return editor.commands.addDescriptionItem();
                }

                return false;
            },

            // Backspace at start of empty term deletes the whole item
            Backspace: ({ editor }) => {
                const { state } = editor;
                const { $from, empty } = state.selection;

                if (!empty) return false;

                // Check if we're at the start of a descriptionTerm
                for (let d = $from.depth; d > 0; d--) {
                    const node = $from.node(d);
                    if (node.type.name === 'descriptionTerm') {
                        const isAtStart = $from.parentOffset === 0;
                        const isEmpty = node.textContent.length === 0;

                        if (isAtStart && isEmpty) {
                            // Find the parent item and delete it
                            for (let pd = d - 1; pd > 0; pd--) {
                                if ($from.node(pd).type.name === 'descriptionItem') {
                                    // Check if there's more than one item in the list
                                    const listDepth = pd - 1;
                                    if ($from.node(listDepth).type.name === 'descriptionList') {
                                        const list = $from.node(listDepth);
                                        if (list.childCount > 1) {
                                            // Delete just this item
                                            const itemStart = $from.before(pd);
                                            const itemEnd = $from.after(pd);
                                            return editor.commands.deleteRange({
                                                from: itemStart,
                                                to: itemEnd,
                                            });
                                        } else {
                                            // Delete the whole list if only one item
                                            const listStart = $from.before(listDepth);
                                            const listEnd = $from.after(listDepth);
                                            return editor.commands.deleteRange({
                                                from: listStart,
                                                to: listEnd,
                                            });
                                        }
                                    }
                                }
                            }
                        }
                        break;
                    }
                }

                return false;
            },
        };
    },
});
