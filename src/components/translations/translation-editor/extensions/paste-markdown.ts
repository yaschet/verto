/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * PasteMarkdown Extension
 * Auto-detects and parses markdown when pasting into the editor
 * Notion-like behavior: paste markdown code, get formatted content
 */

import { Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';

/**
 * Heuristic to detect if text looks like markdown
 */
function looksLikeMarkdown(text: string): boolean {
    const patterns = [
        /^#{1,6}\s/m, // Headings: # ## ### etc
        /\*\*[^*]+\*\*/, // Bold: **text**
        /\*[^*]+\*/, // Italic: *text*
        /__[^_]+__/, // Bold: __text__
        /_[^_]+_/, // Italic: _text_
        /\[.+\]\(.+\)/, // Links: [text](url)
        /^[-*+]\s/m, // Unordered lists: - * +
        /^\d+\.\s/m, // Ordered lists: 1. 2. 3.
        /^>\s/m, // Blockquotes: >
        /`[^`]+`/, // Inline code: `code`
        /^```/m, // Code blocks: ```
        /!\[.+\]\(.+\)/, // Images: ![alt](url)
        /^---$/m, // Horizontal rule
        /^\|.+\|$/m, // Tables: | col | col |
    ];

    return patterns.some((pattern) => pattern.test(text));
}

export const PasteMarkdown = Extension.create({
    name: 'pasteMarkdown',

    addProseMirrorPlugins() {
        const editor = this.editor;

        return [
            new Plugin({
                props: {
                    handlePaste(view, event) {
                        const text = event.clipboardData?.getData('text/plain');
                        const html = event.clipboardData?.getData('text/html');

                        // If HTML is present, let default handler deal with it
                        // (e.g., copying from web pages)
                        if (html && html.trim().length > 0) {
                            return false;
                        }

                        // No text to process
                        if (!text || text.trim().length === 0) {
                            return false;
                        }

                        // Check if text looks like markdown
                        if (!looksLikeMarkdown(text)) {
                            return false;
                        }

                        // Parse markdown and insert as formatted content
                        try {
                            // Use the editor's markdown manager to parse
                            if (!editor.markdown) {
                                console.warn('Markdown extension not available');
                                return false;
                            }
                            const json = editor.markdown.parse(text);

                            // Insert the parsed content
                            editor.commands.insertContent(json);

                            return true;
                        } catch (error) {
                            // If parsing fails, let default handler take over
                            console.warn('Markdown paste parsing failed:', error);
                            return false;
                        }
                    },
                },
            }),
        ];
    },
});
