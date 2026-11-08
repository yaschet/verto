/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * EditorContextMenu Component
 * Intelligent context menu that shows relevant options based on cursor position
 *
 * - In table: Shows table operations (insert row/col, merge, align, delete)
 * - In text: Shows text formatting (bold, italic, link, etc.)
 */

'use client';

import { useCallback, useState } from 'react';
import { TableMenuContent } from '@/components/translations/translation-editor/components/context-menu/table-menu-content';
import { TextMenuContent } from '@/components/translations/translation-editor/components/context-menu/text-menu-content';
import { LinkDialog } from '@/components/translations/translation-editor/components/toolbar/link-dialog';
import { useLinkDialog } from '@/components/translations/translation-editor/hooks/use-link-dialog';
import { useTableControls } from '@/components/translations/translation-editor/hooks/use-table-controls';
import { useToolbarState } from '@/components/translations/translation-editor/hooks/use-toolbar-state';
import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from '@/components/ui/context-menu';
import type { Editor } from '@tiptap/react';
import { cn } from '@/library/utils';

type EditorContextMenuProps = {
    editor: Editor;
    children: React.ReactNode;
};

type ContextType = 'table' | 'text';

export function EditorContextMenu({ children, editor }: EditorContextMenuProps) {
    const [contextType, setContextType] = useState<ContextType>('text');
    const [, setIsOpen] = useState(false);
    const toolbarState = useToolbarState(editor);
    const tableControls = useTableControls(editor);

    // Link dialog management (lifted up from TextMenuContent)
    const {
        getCurrentLink,
        getSelectedText,
        handleRemove: handleLinkRemove,
        handleSubmit: handleLinkSubmit,
        isOpen: isLinkDialogOpen,
        setIsOpen: setLinkDialogOpen,
    } = useLinkDialog(editor);

    const { hasExistingLink, rel: currentRel, target: currentTarget, url: currentUrl } = getCurrentLink();
    const selectedText = getSelectedText();

    const handleOpenChange = useCallback(
        (open: boolean) => {
            if (open) {
                // Detect context when menu opens
                setContextType(editor.isActive('table') ? 'table' : 'text');
            }
            setIsOpen(open);
        },
        [editor],
    );

    const handleClose = useCallback(() => {
        setIsOpen(false);
    }, []);

    // Open link dialog from context menu
    const handleOpenLinkDialog = useCallback(() => {
        setIsOpen(false); // Close context menu first
        setLinkDialogOpen(true);
    }, [setLinkDialogOpen]);

    return (
        <>
            <ContextMenu modal={false} onOpenChange={handleOpenChange}>
                <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
                <ContextMenuContent
                    className={cn(
                        // COMPACT PREMIUM CONTAINER (Matches TableColumnMenu/TableRowMenu)
                        'border-border text-foreground min-w-44 overflow-hidden border', // Base properties
                        'bg-surface-2', // Premium Surface (matches UserMenu)
                        'rounded-xl p-1', // Compact Premium Geometry

                        // Premium Shadows (Light Mode)
                        // Note: ContextMenuContent has default shadows we might be overriding or augmenting relative to order
                        'shadow-[0_2px_24px_rgba(0,0,0,0.08),0_0_0_0.5px_rgba(0,0,0,0.04)]',

                        // Premium Shadows (Dark Mode)
                        'dark:border-surface-800 dark:bg-surface-950 dark:text-surface-50',
                        'dark:shadow-[0_4px_16px_rgba(0,0,0,0.48),0_0_0_1px_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.24)]',
                    )}
                >
                    {contextType === 'table' ? (
                        <TableMenuContent
                            editor={editor}
                            tableControls={tableControls}
                            onClose={handleClose}
                        />
                    ) : (
                        <TextMenuContent
                            editor={editor}
                            toolbarState={toolbarState}
                            onClose={handleClose}
                            onOpenLinkDialog={handleOpenLinkDialog}
                        />
                    )}
                </ContextMenuContent>
            </ContextMenu>

            {/* Link Dialog - outside context menu so it persists after menu closes */}
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
