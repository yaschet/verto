/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * Extended Paragraph Extension
 *
 * CRITICAL: Defines ALL attributes with complete parseHTML/renderHTML methods.
 * Do NOT use ...this.parent?.() - TipTap's default Paragraph has incomplete
 * attribute definitions that cause serialization failures.
 *
 * IMPORTANT: renderHTML MUST always return attributes (even default values)
 * because TipTap uses renderHTML for BOTH HTML rendering AND JSON serialization.
 * Returning {} for default values causes getJSON() to omit the attribute entirely,
 * leading to data loss on save/reload cycles.
 */

import Paragraph from '@tiptap/extension-paragraph';

export const ParagraphExtended = Paragraph.extend({
    addAttributes() {
        return {
            // textAlign - paragraph text alignment (left, center, right, justify)
            textAlign: {
                default: null,
                parseHTML: (element: HTMLElement) => {
                    // Check inline style first
                    const styleAlign = element.style.textAlign;
                    if (styleAlign) return styleAlign;
                    // Fallback to data attribute
                    return element.getAttribute('data-text-align') || null;
                },
                renderHTML: (attributes: Record<string, unknown>) => {
                    // Only render if textAlign has a value (null is valid default)
                    if (!attributes.textAlign) return {};
                    return {
                        style: `text-align: ${attributes.textAlign}`,
                        'data-text-align': attributes.textAlign,
                    };
                },
            },
        };
    },
});
