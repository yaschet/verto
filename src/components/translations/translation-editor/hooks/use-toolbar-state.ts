/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * useToolbarState Hook
 * Provides memoized, reactive toolbar state using TipTap's useEditorState
 *
 * This fixes the toolbar state sync bug where buttons didn't visually
 * toggle when selecting styled content. Using useEditorState ensures
 * the toolbar only re-renders when relevant editor state changes.
 */

'use client';

import { useEditorState } from '@tiptap/react';
import type { Editor } from '@tiptap/react';
export type ToolbarState = {
    // Text formatting
    isBold: boolean;
    isItalic: boolean;
    isUnderline: boolean;
    isStrike: boolean;

    // Text alignment
    isAlignLeft: boolean;
    isAlignCenter: boolean;
    isAlignRight: boolean;
    isAlignJustify: boolean;

    // RTL State
    isRTL: boolean;

    // Lists
    isBulletList: boolean;
    isOrderedList: boolean;

    // Links
    isLink: boolean;

    // Heading level
    currentHeading: string;

    // History
    canUndo: boolean;
    canRedo: boolean;

    // Table context
    isInTable: boolean;

    // Command capabilities
    canToggleBold: boolean;
    canToggleItalic: boolean;
    canToggleUnderline: boolean;
    canToggleStrike: boolean;
};

/**
 * Helper to determine current heading level
 */
function getHeadingLevel(editor: Editor): string {
    for (let i = 1; i <= 6; i++) {
        if (editor.isActive('heading', { level: i })) {
            return String(i);
        }
    }
    return 'paragraph';
}

/**
 * Helper to get text direction from editor or attributes
 */
function getIsRTL(editor: Editor): boolean {
    // Check various sources for direction
    const dir =
        editor.storage?.translationDirection ||
        (editor.options.editorProps.attributes as Record<string, string>)?.dir ||
        (editor.options.element as HTMLElement)?.getAttribute('dir');

    return dir === 'rtl';
}

/**
 * Hook that provides memoized toolbar state
 * Only triggers re-render when toolbar-relevant state changes
 */
export function useToolbarState(editor: Editor | null): ToolbarState | null {
    return useEditorState({
        editor,
        selector: ({ editor: e }): ToolbarState | null => {
            if (!e) return null;

            return {
                // Text formatting
                isBold: e.isActive('bold'),
                isItalic: e.isActive('italic'),
                isUnderline: e.isActive('underline'),
                isStrike: e.isActive('strike'),

                // Text alignment
                isAlignLeft: e.isActive({ textAlign: 'left' }),
                isAlignCenter: e.isActive({ textAlign: 'center' }),
                isAlignRight: e.isActive({ textAlign: 'right' }),
                isAlignJustify: e.isActive({ textAlign: 'justify' }),

                // RTL State
                isRTL: getIsRTL(e),

                // Lists
                isBulletList: e.isActive('bulletList'),
                isOrderedList: e.isActive('orderedList'),

                // Links
                isLink: e.isActive('link'),

                // Heading
                currentHeading: getHeadingLevel(e),

                // History - use chain().focus() pattern for proper state check
                canUndo: e.can().chain().focus().undo().run(),
                canRedo: e.can().chain().focus().redo().run(),

                // Table context
                isInTable: e.isActive('table'),

                // Command capabilities
                canToggleBold: e.can().chain().focus().toggleBold().run(),
                canToggleItalic: e.can().chain().focus().toggleItalic().run(),
                canToggleUnderline: e.can().chain().focus().toggleUnderline().run(),
                canToggleStrike: e.can().chain().focus().toggleStrike().run(),
            };
        },
    });
}
