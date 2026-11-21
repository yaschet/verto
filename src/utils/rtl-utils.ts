/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import type { JSONContent } from '@tiptap/react';

/**
 * Recursively traverses TipTap JSON content and swaps 'left'/'right' alignments
 * to ensure correct rendering in RTL mode (where 'right' is the start/default).
 */
export function normalizeContentForRTL(content: JSONContent | null): JSONContent | null {
    if (!content) return null;

    // Deep clone to avoid mutating original
    const newContent = JSON.parse(JSON.stringify(content));

    function traverse(node: JSONContent) {
        if (node.attrs && node.attrs.textAlign) {
            if (node.attrs.textAlign === 'left') {
                node.attrs.textAlign = 'right';
            } else if (node.attrs.textAlign === 'right') {
                node.attrs.textAlign = 'left';
            }
        }

        if (node.content && Array.isArray(node.content)) {
            node.content.forEach(traverse);
        }
    }

    traverse(newContent);
    return newContent;
}
