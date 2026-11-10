/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * HistoryGroup Component
 * Undo and Redo buttons
 */

'use client';

import { ArrowUUpLeftIcon, ArrowUUpRightIcon } from '@phosphor-icons/react';
import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/library/utils';
import type { ToolbarState } from '@/components/translations/translation-editor/hooks/use-toolbar-state';
import type { Editor } from '@tiptap/react';

type HistoryGroupProps = {
    editor: Editor;
    state: ToolbarState;
};

export const HistoryGroup = memo(function HistoryGroup({ editor, state }: HistoryGroupProps) {
    return (
        <>
            <Button
                className={cn('h-8 w-8 p-0 transition-all duration-150', 'hover:scale-105 active:scale-95')}
                disabled={!state.canUndo}
                size="sm"
                tooltipContent="Undo (Cmd+Z)"
                tooltipDelayDuration={400}
                tooltipSide="bottom"
                variant="soft"
                onClick={() => editor.chain().focus().undo().run()}
            >
                <ArrowUUpLeftIcon className="size-4" />
            </Button>
            <Button
                className={cn('h-8 w-8 p-0 transition-all duration-150', 'hover:scale-105 active:scale-95')}
                disabled={!state.canRedo}
                size="sm"
                tooltipContent="Redo (Cmd+Shift+Z)"
                tooltipDelayDuration={400}
                tooltipSide="bottom"
                variant="soft"
                onClick={() => editor.chain().focus().redo().run()}
            >
                <ArrowUUpRightIcon className="size-4" />
            </Button>
        </>
    );
});
