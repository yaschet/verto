/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * CharacterCount Component
 * Displays word and character count
 */

'use client';

import { cn } from '@/library/utils';
import type { Editor } from '@tiptap/react';

type CharacterCountProps = {
    editor: Editor;
};

export function CharacterCount({ editor }: CharacterCountProps) {
    const characters = editor.storage.characterCount?.characters() ?? 0;
    const words = editor.storage.characterCount?.words() ?? 0;

    return (
        <div
            className={cn(
                'sticky bottom-0 flex justify-end px-4 py-2',
                'dark:from-surface-950 dark:via-surface-950 bg-gradient-to-t from-white via-white',
            )}
        >
            <div
                className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-1.5',
                    'dark:bg-surface-950/80 bg-white/80 backdrop-blur-sm',
                    'text-surface-400 text-xs',
                )}
            >
                <span>{characters.toLocaleString()} characters</span>
                <span className="bg-surface-300 dark:bg-surface-700 h-3 w-px" />
                <span>{words.toLocaleString()} words</span>
            </div>
        </div>
    );
}
