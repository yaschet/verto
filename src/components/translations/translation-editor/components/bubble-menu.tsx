/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * EditorBubbleMenu Component
 * Floating toolbar that appears on text selection
 */

'use client';

import { LinkIcon, TextBIcon, TextItalicIcon, TextUnderlineIcon } from '@phosphor-icons/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { LinkDialog } from '@/components/translations/translation-editor/components/toolbar/link-dialog';
import { useLinkDialog } from '@/components/translations/translation-editor/hooks/use-link-dialog';
import { useToolbarState } from '@/components/translations/translation-editor/hooks/use-toolbar-state';
import { Button } from '@/components/ui/button';
import { cn } from '@/library/utils';
import type { Editor } from '@tiptap/react';

type EditorBubbleMenuProps = {
    editor: Editor;
};

export function EditorBubbleMenu({ editor }: EditorBubbleMenuProps) {
    const state = useToolbarState(editor);
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

    if (!state) return null;

    return (
        <>
            <BubbleMenu
                className={cn(
                    'flex items-center gap-1 rounded-xl border p-1.5 shadow-lg',
                    'border-surface-200 dark:border-surface-800 dark:bg-surface-950 bg-white',
                    'animate-in fade-in-0 zoom-in-95 duration-150',
                )}
                editor={editor}
                options={{
                    placement: 'top',
                    offset: 8,
                }}
                shouldShow={({ editor, view }) => {
                    // Prevent errors during resize when docView is null
                    if (!(view as typeof view & { docView?: unknown }).docView) return false;
                    // Only show when there's a text selection
                    const { selection } = editor.state;
                    return !selection.empty;
                }}
            >
                <Button
                    className="h-7 w-7 p-0"
                    color={state.isBold ? 'primary' : 'default'}
                    size="sm"
                    variant={state.isBold ? 'solid' : 'soft'}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                >
                    <TextBIcon className="size-3.5" />
                </Button>
                <Button
                    className="h-7 w-7 p-0"
                    color={state.isItalic ? 'primary' : 'default'}
                    size="sm"
                    variant={state.isItalic ? 'solid' : 'soft'}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                >
                    <TextItalicIcon className="size-3.5" />
                </Button>
                <Button
                    className="h-7 w-7 p-0"
                    color={state.isUnderline ? 'primary' : 'default'}
                    size="sm"
                    variant={state.isUnderline ? 'solid' : 'soft'}
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                >
                    <TextUnderlineIcon className="size-3.5" />
                </Button>

                <div className="bg-surface-200 dark:bg-surface-700 mx-1 h-4 w-px" />

                <Button
                    className="h-7 w-7 p-0"
                    color={state.isLink ? 'primary' : 'default'}
                    size="sm"
                    variant={state.isLink ? 'solid' : 'soft'}
                    onClick={openLinkDialog}
                >
                    <LinkIcon className="size-3.5" />
                </Button>
            </BubbleMenu>

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
        </>
    );
}
