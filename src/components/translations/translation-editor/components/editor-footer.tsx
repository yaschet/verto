/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * EditorFooter Component
 * Displays save status and character/word count
 */

'use client';

import { CheckCircleIcon, CircleNotchIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/library/utils';
import type { Editor } from '@tiptap/react';

type EditorFooterProps = {
    editor: Editor;
    localOnly?: boolean;
    isSaving?: boolean;
    lastSaveTime?: Date | null;
    hasUnsavedChanges?: boolean;
};

export function EditorFooter({
    editor,
    localOnly = false,
    hasUnsavedChanges = false,
    isSaving = false,
    lastSaveTime = null,
}: EditorFooterProps) {
    const characters = editor.storage.characterCount?.characters() ?? 0;
    const words = editor.storage.characterCount?.words() ?? 0;

    return (
        <div
            className={cn(
                'sticky bottom-0 z-50 flex items-center justify-between px-8 py-3 lg:px-12',
                'dark:from-surface-950 dark:via-surface-950 bg-gradient-to-t from-white via-white',
            )}
        >
            {/* Save Status (left) */}
            <div className="flex items-center gap-3">
                {localOnly ? (
                    <span className="text-surface-600 dark:text-surface-300 text-xs font-medium">
                        {hasUnsavedChanges
                            ? 'Local edits · reload to reset'
                            : 'Local sample · edits stay in this tab'}
                    </span>
                ) : isSaving ? (
                    <div className="text-surface-600 dark:text-surface-300 flex items-center gap-2 text-xs font-medium">
                        <div className="bg-primary-200 dark:bg-primary-500/20 flex h-6 w-6 items-center justify-center rounded-full">
                            <CircleNotchIcon
                                className="text-primary-600 dark:text-primary-400 size-4 animate-spin"
                                weight="bold"
                            />
                        </div>
                        <span>Saving...</span>
                    </div>
                ) : hasUnsavedChanges ? (
                    <div className="text-surface-600 dark:text-surface-300 flex items-center gap-2 text-xs font-medium">
                        <div className="bg-warning-200 dark:bg-warning-500/20 flex h-6 w-6 items-center justify-center rounded-full">
                            <WarningCircleIcon
                                className="text-warning-600 dark:text-warning-400 size-4"
                                weight="bold"
                            />
                        </div>
                        <span>Unsaved changes</span>
                    </div>
                ) : lastSaveTime ? (
                    <div className="text-surface-600 dark:text-surface-300 flex items-center gap-2 text-xs font-medium">
                        <div className="bg-success-200 dark:bg-success-500/20 flex h-6 w-6 items-center justify-center rounded-full">
                            <CheckCircleIcon
                                className="text-success-600 dark:text-success-400 size-4"
                                weight="bold"
                            />
                        </div>
                        <span>Saved {formatDistanceToNow(lastSaveTime, { addSuffix: true })}</span>
                    </div>
                ) : (
                    <div className="text-surface-600 dark:text-surface-300 flex items-center gap-2 text-xs font-medium">
                        <div className="bg-surface-200 dark:bg-surface-800 flex h-6 w-6 items-center justify-center rounded-full">
                            <CheckCircleIcon
                                className="text-surface-600 dark:text-surface-400 size-4"
                                weight="bold"
                            />
                        </div>
                        <span>All changes saved</span>
                    </div>
                )}
            </div>

            {/* Character Count (right) */}
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
