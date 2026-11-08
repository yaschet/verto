/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * ListGroup Component
 * Bullet list and numbered list buttons
 */

'use client';

import { ListBulletsIcon, ListNumbersIcon } from '@phosphor-icons/react';
import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/library/utils';
import type { ToolbarState } from '@/components/translations/translation-editor/hooks/use-toolbar-state';
import type { Editor } from '@tiptap/react';

type ListGroupProps = {
    editor: Editor;
    state: ToolbarState;
};

export const ListGroup = memo(function ListGroup({ editor, state }: ListGroupProps) {
    return (
        <>
            <Button
                className={cn('h-8 w-8 p-0 transition-all duration-150', 'hover:scale-105 active:scale-95')}
                color={state.isBulletList ? 'primary' : 'default'}
                size="sm"
                tooltipContent="Bullet List (Cmd+Shift+8)"
                tooltipDelayDuration={400}
                tooltipSide="bottom"
                variant={state.isBulletList ? 'solid' : 'soft'}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
                <ListBulletsIcon className="size-4" />
            </Button>
            <Button
                className={cn('h-8 w-8 p-0 transition-all duration-150', 'hover:scale-105 active:scale-95')}
                color={state.isOrderedList ? 'primary' : 'default'}
                size="sm"
                tooltipContent="Numbered List (Cmd+Shift+7)"
                tooltipDelayDuration={400}
                tooltipSide="bottom"
                variant={state.isOrderedList ? 'solid' : 'soft'}
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
                <ListNumbersIcon className="size-4" />
            </Button>
        </>
    );
});
