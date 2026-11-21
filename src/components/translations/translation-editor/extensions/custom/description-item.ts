/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * DescriptionItem Extension
 *
 * Wrapper node that ensures a term and value are always paired together.
 * Renders as a <div> with data-type attribute for CSS grid layout.
 *
 * Architecture: DescriptionList > DescriptionItem > DescriptionTerm + DescriptionValue
 *
 * Content schema: exactly one descriptionTerm followed by one descriptionValue.
 * This constraint is enforced by ProseMirror's content validation.
 */

import { Node, mergeAttributes } from '@tiptap/core';

export type DescriptionItemOptions = {
    HTMLAttributes: Record<string, unknown>;
};

export const DescriptionItem = Node.create<DescriptionItemOptions>({
    name: 'descriptionItem',

    addOptions() {
        return {
            HTMLAttributes: {},
        };
    },

    content: 'descriptionTerm descriptionValue',

    defining: true,

    parseHTML() {
        return [{ tag: 'div[data-type="dl-item"]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            'div',
            mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
                'data-type': 'dl-item',
                class: 'dl-item',
            }),
            0,
        ];
    },
});
