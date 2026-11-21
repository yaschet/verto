/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import type { SpacerAttrs } from '@/components/translations/translation-editor/extensions/custom/spacer';
import type { FootnoteAttrs } from '@/components/translations/translation-editor/extensions/custom/footnote';
import '@tiptap/core';

declare module '@tiptap/core' {
    interface Storage {
        translationDirection?: 'ltr' | 'rtl';
    }
    interface Commands<ReturnType> {
        spacer: { setSpacer: (attrs?: SpacerAttrs) => ReturnType };
        footnote: { setFootnote: (attrs?: FootnoteAttrs) => ReturnType };
        thematicBreak: { setThematicBreak: () => ReturnType };
    }
}
