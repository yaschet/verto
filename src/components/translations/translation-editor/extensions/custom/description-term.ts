/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * DescriptionTerm Extension
 *
 * Represents the label/term in a description list (the "key" in a key-value pair).
 * Renders as <dt> element with fully editable inline content.
 *
 * Architecture: DescriptionList > DescriptionItem > DescriptionTerm + DescriptionValue
 * Both term and value are content nodes (not attributes) for native ProseMirror editability.
 */

import { Node, mergeAttributes } from '@tiptap/core';

export type DescriptionTermOptions = {
    HTMLAttributes: Record<string, unknown>;
};

export const DescriptionTerm = Node.create<DescriptionTermOptions>({
    name: 'descriptionTerm',

    addOptions() {
        return {
            HTMLAttributes: {},
        };
    },

    content: 'inline*',

    defining: true,

    parseHTML() {
        return [{ tag: 'dt' }];
    },

    renderHTML({ HTMLAttributes }) {
        return ['dt', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { class: 'dl-term' }), 0];
    },
});
