/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * FormatGroup Component
 * Bold, Italic, Underline, Strikethrough buttons
 */

'use client';

import { TextBIcon, TextItalicIcon, TextStrikethroughIcon, TextUnderlineIcon } from '@phosphor-icons/react';
import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/library/utils';
import type { ToolbarState } from '@/components/translations/translation-editor/hooks/use-toolbar-state';
import type { Editor } from '@tiptap/react';

type FormatGroupProps = {
    editor: Editor;
    state: ToolbarState;
};

export const FormatGroup = memo(function FormatGroup({ editor, state }: FormatGroupProps) {
    return (
        <>
            <Button
                className={cn('h-8 w-8 p-0 transition-all duration-150', 'hover:scale-105 active:scale-95')}
                color={state.isBold ? 'primary' : 'default'}
                disabled={!state.canToggleBold}
                size="sm"
                tooltipContent="Bold (Cmd+B)"
                tooltipDelayDuration={400}
                tooltipSide="bottom"
                variant={state.isBold ? 'solid' : 'soft'}
                onClick={() => editor.chain().focus().toggleBold().run()}
            >
                <TextBIcon className="size-4" />
            </Button>
            <Button
                className={cn('h-8 w-8 p-0 transition-all duration-150', 'hover:scale-105 active:scale-95')}
                color={state.isItalic ? 'primary' : 'default'}
                disabled={!state.canToggleItalic}
                size="sm"
                tooltipContent="Italic (Cmd+I)"
                tooltipDelayDuration={400}
                tooltipSide="bottom"
                variant={state.isItalic ? 'solid' : 'soft'}
                onClick={() => editor.chain().focus().toggleItalic().run()}
            >
                <TextItalicIcon className="size-4" />
            </Button>
            <Button
                className={cn('h-8 w-8 p-0 transition-all duration-150', 'hover:scale-105 active:scale-95')}
                color={state.isUnderline ? 'primary' : 'default'}
                disabled={!state.canToggleUnderline}
                size="sm"
                tooltipContent="Underline (Cmd+U)"
                tooltipDelayDuration={400}
                tooltipSide="bottom"
                variant={state.isUnderline ? 'solid' : 'soft'}
                onClick={() => editor.chain().focus().toggleUnderline().run()}
            >
                <TextUnderlineIcon className="size-4" />
            </Button>
            <Button
                className={cn('h-8 w-8 p-0 transition-all duration-150', 'hover:scale-105 active:scale-95')}
                color={state.isStrike ? 'primary' : 'default'}
                disabled={!state.canToggleStrike}
                size="sm"
                tooltipContent="Strikethrough (Cmd+Shift+S)"
                tooltipDelayDuration={400}
                tooltipSide="bottom"
                variant={state.isStrike ? 'solid' : 'soft'}
                onClick={() => editor.chain().focus().toggleStrike().run()}
            >
                <TextStrikethroughIcon className="size-4" />
            </Button>
        </>
    );
});
