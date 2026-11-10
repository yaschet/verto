/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * useLinkDialog Hook
 * Manages link dialog state for both Toolbar and BubbleMenu
 *
 * Provides:
 * - Dialog open/close state
 * - Current link attributes retrieval
 * - Selected text retrieval
 * - Submit handler with proper TipTap commands
 * - Remove link handler
 */

import { useCallback, useState } from 'react';
import type { LinkData } from '@/components/translations/translation-editor/components/toolbar/link-dialog';
import type { Editor } from '@tiptap/react';

export function useLinkDialog(editor: Editor) {
    const [isOpen, setIsOpen] = useState(false);

    /**
     * Get current link attributes from cursor position
     * Uses mark inspection for reliable detection when cursor is inside a link
     */
    const getCurrentLink = useCallback(() => {
        const { from } = editor.state.selection;
        const $from = editor.state.doc.resolve(from);

        // Find the link mark at current position (works even without selection)
        const linkMark = $from.marks().find((mark) => mark.type.name === 'link');

        if (linkMark) {
            return {
                url: (linkMark.attrs.href as string) || '',
                target: (linkMark.attrs.target as string) || null,
                rel: (linkMark.attrs.rel as string) || null,
                hasExistingLink: true,
            };
        }

        // Fallback to editor.getAttributes (less reliable but covers edge cases)
        const attrs = editor.getAttributes('link');
        return {
            url: (attrs.href as string) || '',
            target: (attrs.target as string) || null,
            rel: (attrs.rel as string) || null,
            hasExistingLink: !!attrs.href,
        };
    }, [editor]);

    /**
     * Get currently selected text or link text at cursor position
     * When cursor is inside a link, returns the full link text
     */
    const getSelectedText = useCallback(() => {
        const { empty, from, to } = editor.state.selection;

        // If text is selected, return that
        if (!empty) {
            return editor.state.doc.textBetween(from, to, '');
        }

        // If cursor is inside a link, get the full link text
        const $from = editor.state.doc.resolve(from);
        const linkMark = $from.marks().find((mark) => mark.type.name === 'link');

        if (linkMark) {
            // Find the extent of this link mark
            let start = from;
            let end = from;

            while (start > 0) {
                const $pos = editor.state.doc.resolve(start - 1);
                const marks = $pos.marks();
                const hasLink = marks.some(
                    (m) => m.type.name === 'link' && m.attrs.href === linkMark.attrs.href,
                );
                if (!hasLink) break;
                start--;
            }

            // Walk forwards to find end
            while (end < editor.state.doc.content.size) {
                const $pos = editor.state.doc.resolve(end);
                const marks = $pos.marks();
                const hasLink = marks.some(
                    (m) => m.type.name === 'link' && m.attrs.href === linkMark.attrs.href,
                );
                if (!hasLink) break;
                end++;
            }

            return editor.state.doc.textBetween(start, end, '');
        }

        return '';
    }, [editor]);

    /**
     * Open the link dialog
     */
    const openDialog = useCallback(() => {
        setIsOpen(true);
    }, []);

    /**
     * Handle link submission
     * Applies link mark with provided attributes
     */
    const handleSubmit = useCallback(
        (data: LinkData) => {
            const { nofollow, openInNewTab, text, url } = data;

            // Build rel attribute
            const relParts: string[] = [];
            if (openInNewTab) {
                relParts.push('noopener', 'noreferrer');
            }
            if (nofollow) {
                relParts.push('nofollow');
            }

            const attrs = {
                href: url,
                target: openInNewTab ? '_blank' : null,
                rel: relParts.length > 0 ? relParts.join(' ') : null,
            };

            if (text) {
                // If display text provided, replace selection with new text + link
                editor
                    .chain()
                    .focus()
                    .extendMarkRange('link')
                    .deleteSelection()
                    .insertContent({
                        type: 'text',
                        text: text,
                        marks: [{ type: 'link', attrs }],
                    })
                    .run();
            } else {
                // Apply link to current selection
                editor.chain().focus().extendMarkRange('link').setLink(attrs).run();
            }
        },
        [editor],
    );

    /**
     * Remove link from current selection
     */
    const handleRemove = useCallback(() => {
        editor.chain().focus().extendMarkRange('link').unsetLink().run();
    }, [editor]);

    return {
        isOpen,
        setIsOpen,
        openDialog,
        getCurrentLink,
        getSelectedText,
        handleSubmit,
        handleRemove,
    };
}
