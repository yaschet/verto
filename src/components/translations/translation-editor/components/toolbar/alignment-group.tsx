/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * AlignmentGroup Component
 * Text alignment buttons (left, center, right, justify)
 *
 * For RTL languages, left/right are swapped:
 * - "Left" button sets textAlign: 'right' (logical start)
 * - "Right" button sets textAlign: 'left' (logical end)
 */

'use client';

import {
    TextAlignCenterIcon,
    TextAlignJustifyIcon,
    TextAlignLeftIcon,
    TextAlignRightIcon,
} from '@phosphor-icons/react';
import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/library/utils';
import type { ToolbarState } from '@/components/translations/translation-editor/hooks/use-toolbar-state';
import type { Editor } from '@tiptap/react';

type AlignmentGroupProps = {
    editor: Editor;
    state: ToolbarState;
};

export const AlignmentGroup = memo(function AlignmentGroup({ editor, state }: AlignmentGroupProps) {
    // In RTL mode:
    // - textAlign: 'left' renders visually on the Right (Start)
    // - textAlign: 'right' renders visually on the Left (End)
    //
    // Visual Expectation:
    // The Toolbar should always look like: [Align Left Icon] [Align Center Icon] [Align Right Icon]
    //
    // Implementation:
    // We swap the BUTTON POSITIONS and ICONS to match this visual expectation.
    // RTL Pos 1 (Left side): Needs to trigger Visual Left (Logical Right). Icon: Left.
    // RTL Pos 3 (Right side): Needs to trigger Visual Right (Logical Left). Icon: Right.

    const isRTL = state.isRTL;

    const LeftAlignButton = (
        <Button
            className={cn('h-8 w-8 p-0 transition-all duration-150', 'hover:scale-105 active:scale-95')}
            color={state.isAlignLeft ? 'primary' : 'default'}
            size="sm"
            tooltipContent={isRTL ? 'Align Start (Right)' : 'Align Left'}
            tooltipDelayDuration={400}
            tooltipSide="bottom"
            variant={state.isAlignLeft ? 'solid' : 'soft'}
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
        >
            {isRTL ? <TextAlignRightIcon className="size-4" /> : <TextAlignLeftIcon className="size-4" />}
        </Button>
    );

    const CenterAlignButton = (
        <Button
            className={cn('h-8 w-8 p-0 transition-all duration-150', 'hover:scale-105 active:scale-95')}
            color={state.isAlignCenter ? 'primary' : 'default'}
            size="sm"
            tooltipContent="Align Center"
            tooltipDelayDuration={400}
            tooltipSide="bottom"
            variant={state.isAlignCenter ? 'solid' : 'soft'}
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
        >
            <TextAlignCenterIcon className="size-4" />
        </Button>
    );

    const RightAlignButton = (
        <Button
            className={cn('h-8 w-8 p-0 transition-all duration-150', 'hover:scale-105 active:scale-95')}
            color={state.isAlignRight ? 'primary' : 'default'}
            size="sm"
            tooltipContent={isRTL ? 'Align End (Left)' : 'Align Right'}
            tooltipDelayDuration={400}
            tooltipSide="bottom"
            variant={state.isAlignRight ? 'solid' : 'soft'}
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
        >
            {isRTL ? <TextAlignLeftIcon className="size-4" /> : <TextAlignRightIcon className="size-4" />}
        </Button>
    );

    return (
        <>
            {isRTL ? RightAlignButton : LeftAlignButton}
            {CenterAlignButton}
            {isRTL ? LeftAlignButton : RightAlignButton}
            <Button
                className={cn('h-8 w-8 p-0 transition-all duration-150', 'hover:scale-105 active:scale-95')}
                color={state.isAlignJustify ? 'primary' : 'default'}
                size="sm"
                tooltipContent="Justify"
                tooltipDelayDuration={400}
                tooltipSide="bottom"
                variant={state.isAlignJustify ? 'solid' : 'soft'}
                onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            >
                <TextAlignJustifyIcon className="size-4" />
            </Button>
        </>
    );
});
