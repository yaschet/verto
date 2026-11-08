/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * InsertGroup Component
 * Link, Table, and Description List insert buttons
 */

'use client';

import { ArrowsVerticalIcon, ColumnsIcon, LinkIcon, TableIcon } from '@phosphor-icons/react';
import { memo, useCallback } from 'react';
import { LinkDialog } from '@/components/translations/translation-editor/components/toolbar/link-dialog';
import { useLinkDialog } from '@/components/translations/translation-editor/hooks/use-link-dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/library/utils';
import type { ToolbarState } from '@/components/translations/translation-editor/hooks/use-toolbar-state';
import type { Editor } from '@tiptap/react';

type InsertGroupProps = {
    editor: Editor;
    state: ToolbarState;
};

export const InsertGroup = memo(function InsertGroup({ editor, state }: InsertGroupProps) {
    const {
        getCurrentLink,
        getSelectedText,
        handleRemove: handleLinkRemove,
        handleSubmit: handleLinkSubmit,
        isOpen: isLinkDialogOpen,
        openDialog: openLinkDialog,
        setIsOpen: setLinkDialogOpen,
    } = useLinkDialog(editor);

    const { hasExistingLink, rel: currentRel, target: currentTarget, url: currentUrl } = getCurrentLink();
    const selectedText = getSelectedText();

    const handleAddTable = useCallback(() => {
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    }, [editor]);

    const handleAddDescriptionList = useCallback(() => {
        editor.chain().focus().insertDescriptionList().run();
    }, [editor]);

    const handleAddSpacer = useCallback(() => {
        editor.chain().focus().setSpacer().run();
    }, [editor]);

    return (
        <>
            <Button
                className={cn('h-8 w-8 p-0 transition-all duration-150', 'hover:scale-105 active:scale-95')}
                color={state.isLink ? 'primary' : 'default'}
                size="sm"
                tooltipContent="Add Link (Cmd+K)"
                tooltipDelayDuration={400}
                tooltipSide="bottom"
                variant={state.isLink ? 'solid' : 'soft'}
                onClick={openLinkDialog}
            >
                <LinkIcon className="size-4" />
            </Button>

            <LinkDialog
                hasExistingLink={hasExistingLink}
                initialRel={currentRel}
                initialTarget={currentTarget}
                initialText={selectedText}
                initialUrl={currentUrl}
                open={isLinkDialogOpen}
                onOpenChange={setLinkDialogOpen}
                onRemove={handleLinkRemove}
                onSubmit={handleLinkSubmit}
            />

            <Button
                className={cn('h-8 w-8 p-0 transition-all duration-150', 'hover:scale-105 active:scale-95')}
                size="sm"
                tooltipContent="Insert Table"
                tooltipDelayDuration={400}
                tooltipSide="bottom"
                variant="soft"
                onClick={handleAddTable}
            >
                <TableIcon className="size-4" />
            </Button>
            <Button
                className={cn('h-8 w-8 p-0 transition-all duration-150', 'hover:scale-105 active:scale-95')}
                size="sm"
                tooltipContent="Insert Key-Value Pair"
                tooltipDelayDuration={400}
                tooltipSide="bottom"
                variant="soft"
                onClick={handleAddDescriptionList}
            >
                <ColumnsIcon className="size-4" />
            </Button>
            <Button
                className={cn('h-8 w-8 p-0 transition-all duration-150', 'hover:scale-105 active:scale-95')}
                size="sm"
                tooltipContent="Insert Spacer"
                tooltipDelayDuration={400}
                tooltipSide="bottom"
                variant="soft"
                onClick={handleAddSpacer}
            >
                <ArrowsVerticalIcon className="size-4" />
            </Button>
        </>
    );
});
