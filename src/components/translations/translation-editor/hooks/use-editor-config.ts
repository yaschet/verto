/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * useEditorConfig Hook
 * Provides memoized editor configuration
 */

'use client';

import { useMemo } from 'react';
import { createExtensions } from '@/components/translations/translation-editor/extensions';
import { sanitizeProseMirrorDocument } from '@/engine/document/sanitize-prosemirror-document';
import type { EditorOptions, JSONContent } from '@tiptap/react';

type UseEditorConfigOptions = {
    initialContent: JSONContent | null;
    editable?: boolean;
    onChange?: (content: JSONContent) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    direction?: 'ltr' | 'rtl';
};

/**
 * Hook that provides complete editor configuration
 * Memoizes extensions and content to prevent unnecessary recreations
 */
export function useEditorConfig({
    editable = true,
    initialContent,
    onBlur,
    onChange,
    onFocus,
    direction = 'ltr',
}: UseEditorConfigOptions): Partial<EditorOptions> {
    // Memoize extensions - only recreate if editable changes
    const extensions = useMemo(() => createExtensions({ editable }), [editable]);

    // Memoize and sanitize content - pass direction for RTL alignment inversion
    const content = useMemo(
        () => sanitizeProseMirrorDocument(initialContent, direction),
        [initialContent, direction],
    );

    // Memoize the complete config
    return useMemo(
        () => ({
            extensions,
            content,
            editable,
            // direction: 'rtl' sets global text direction
            // TipTap will handle some alignment, but we force dir attribute too
            textDirection: direction,
            immediatelyRender: false,
            // Performance: don't re-render on every transaction
            // Use useEditorState selectors instead for reactive state
            shouldRerenderOnTransaction: false,
            onUpdate: ({ editor }) => {
                // CRITICAL: Post-process JSON to restore default attrs that ProseMirror omits
                // ProseMirror's toJSON() skips attributes equal to their default value,
                // which causes data loss on save/reload cycles. We sanitize the output
                // to ensure all required attrs (level, textAlign, colspan, rowspan) are present.
                const json = editor.getJSON();
                const sanitized = sanitizeProseMirrorDocument(json);
                onChange?.(sanitized);
            },
            onFocus: () => {
                onFocus?.();
            },
            onBlur: () => {
                onBlur?.();
            },
            editorProps: {
                attributes: {
                    class: 'tiptap focus:outline-none',
                    // Explicitly set direction attribute for CSS usage
                    dir: direction,
                    // Additional class for RTL-specific styling if needed
                    'data-direction': direction,
                },
            },
        }),
        [extensions, content, editable, onChange, onFocus, onBlur, direction],
    );
}
