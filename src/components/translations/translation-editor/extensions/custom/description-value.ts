/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * DescriptionValue Extension
 *
 * Represents the value/description in a description list (the "value" in a key-value pair).
 * Renders as <dd> element with fully editable inline content.
 *
 * Architecture: DescriptionList > DescriptionItem > DescriptionTerm + DescriptionValue
 * Both term and value are content nodes (not attributes) for native ProseMirror editability.
 */

import { Node, mergeAttributes } from '@tiptap/core';

export type DescriptionValueOptions = {
    HTMLAttributes: Record<string, unknown>;
};

export const DescriptionValue = Node.create<DescriptionValueOptions>({
    name: 'descriptionValue',

    addOptions() {
        return {
            HTMLAttributes: {},
        };
    },

    content: 'inline*',

    defining: true,

    parseHTML() {
        return [{ tag: 'dd' }];
    },

    renderHTML({ HTMLAttributes }) {
        return ['dd', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { class: 'dl-value' }), 0];
    },
});
