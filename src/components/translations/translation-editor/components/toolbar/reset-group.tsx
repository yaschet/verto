/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * ResetGroup Component
 * Clear all edits button with confirmation dialog
 *
 * Features:
 * - Reset button in toolbar
 * - Confirmation dialog before reset
 * - Disabled when no original content available
 */

'use client';

import { ArrowCounterClockwiseIcon } from '@phosphor-icons/react';
import { memo, useCallback, useState } from 'react';
import { ClearEditsDialog } from '@/components/translations/translation-editor/components/toolbar/clear-edits-dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/library/utils';
import type { Editor } from '@tiptap/react';
import type { JSONContent } from '@tiptap/react';

type ResetGroupProps = {
    editor: Editor;
    originalContent?: JSONContent | null;
    onReset?: () => void;
};

export const ResetGroup = memo(function ResetGroup({ editor, onReset, originalContent }: ResetGroupProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleConfirmReset = useCallback(() => {
        if (originalContent) {
            editor.commands.setContent(originalContent);
            onReset?.();
        }
        setIsDialogOpen(false);
    }, [editor, originalContent, onReset]);

    // Disable if no original content available
    const isDisabled = !originalContent;

    return (
        <>
            <Button
                className={cn('h-8 w-8 p-0 transition-all duration-150', 'hover:scale-105 active:scale-95')}
                disabled={isDisabled}
                size="sm"
                tooltipContent="Clear All Edits"
                tooltipDelayDuration={400}
                tooltipSide="bottom"
                variant="soft"
                onClick={() => setIsDialogOpen(true)}
            >
                <ArrowCounterClockwiseIcon className="size-4" />
            </Button>

            <ClearEditsDialog
                open={isDialogOpen}
                onConfirm={handleConfirmReset}
                onOpenChange={setIsDialogOpen}
            />
        </>
    );
});
