/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * Extension Bundle
 * Centralizes all TipTap extension imports and configuration
 */

import CharacterCount from '@tiptap/extension-character-count';
import Link from '@tiptap/extension-link';
import TableRow from '@tiptap/extension-table-row';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { Markdown } from '@tiptap/markdown';
import StarterKit from '@tiptap/starter-kit';
import {
    type ExtensionOptions,
    getExtensionConfig,
} from '@/components/translations/translation-editor/extensions/config';
import { DescriptionItem } from '@/components/translations/translation-editor/extensions/custom/description-item';
import { DescriptionList } from '@/components/translations/translation-editor/extensions/custom/description-list';
import { DescriptionTerm } from '@/components/translations/translation-editor/extensions/custom/description-term';

// Custom extensions
import { DescriptionValue } from '@/components/translations/translation-editor/extensions/custom/description-value';
import { Footnote } from '@/components/translations/translation-editor/extensions/custom/footnote';
import { TableHeaderExtended } from '@/components/translations/translation-editor/extensions/custom/table-header-extended';
import { ThematicBreak } from '@/components/translations/translation-editor/extensions/custom/thematic-break';
import { TableCellExtended } from '@/components/translations/translation-editor/extensions/custom/table-cell-extended';
import { HeadingExtended } from '@/components/translations/translation-editor/extensions/custom/heading-extended';
import { ParagraphExtended } from '@/components/translations/translation-editor/extensions/custom/paragraph-extended';
import { PasteMarkdown } from '@/components/translations/translation-editor/extensions/paste-markdown';
import { TableKeyboardShortcuts } from '@/components/translations/translation-editor/extensions/table-keyboard-shortcuts';
import { Spacer } from '@/components/translations/translation-editor/extensions/custom/spacer';
import { TableExtended } from '@/components/translations/translation-editor/extensions/custom/table-extended';

/**
 * Creates the complete extension array for the translation editor
 */
export function createExtensions(options?: ExtensionOptions) {
    const config = getExtensionConfig(options);

    return [
        StarterKit.configure(config.starterKit),
        Underline,
        TextAlign.configure(config.textAlign),
        Link.configure(config.link),

        // Extended heading and paragraph (always serialize attrs to prevent data loss)
        HeadingExtended.configure({ levels: [1, 2, 3, 4, 5, 6] }),
        ParagraphExtended,

        // Markdown support - enables paste markdown auto-formatting
        Markdown,
        PasteMarkdown,

        // Table extensions (using extended versions with textAlign attribute)
        TableExtended.configure(config.table),
        TableRow.configure(config.tableRow),
        TableCellExtended.configure(config.tableCell),
        TableHeaderExtended.configure(config.tableHeader),
        TableKeyboardShortcuts,

        // Character count
        CharacterCount.configure(config.characterCount),

        // Custom extensions from translation pipeline
        Spacer,
        DescriptionList,
        DescriptionItem,
        DescriptionTerm,
        DescriptionValue,
        Footnote,
        ThematicBreak,
    ];
}

// Re-export custom extensions for external use
export { Spacer } from '@/components/translations/translation-editor/extensions/custom/spacer';
export { DescriptionList } from '@/components/translations/translation-editor/extensions/custom/description-list';
export { DescriptionItem } from '@/components/translations/translation-editor/extensions/custom/description-item';
export { DescriptionTerm } from '@/components/translations/translation-editor/extensions/custom/description-term';
export { DescriptionValue } from '@/components/translations/translation-editor/extensions/custom/description-value';
export { Footnote } from '@/components/translations/translation-editor/extensions/custom/footnote';
export { ThematicBreak } from '@/components/translations/translation-editor/extensions/custom/thematic-break';
export { TableExtended } from '@/components/translations/translation-editor/extensions/custom/table-extended';
export { TableCellExtended } from '@/components/translations/translation-editor/extensions/custom/table-cell-extended';
export { TableHeaderExtended } from '@/components/translations/translation-editor/extensions/custom/table-header-extended';
export { HeadingExtended } from '@/components/translations/translation-editor/extensions/custom/heading-extended';
export { ParagraphExtended } from '@/components/translations/translation-editor/extensions/custom/paragraph-extended';
export { TableKeyboardShortcuts } from '@/components/translations/translation-editor/extensions/table-keyboard-shortcuts';
export { PasteMarkdown } from '@/components/translations/translation-editor/extensions/paste-markdown';
export { getExtensionConfig } from '@/components/translations/translation-editor/extensions/config';
export type { ExtensionOptions } from '@/components/translations/translation-editor/extensions/config';
