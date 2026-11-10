/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * TranslationEditor Component
 * Main TipTap editor for translation review workflow
 *
 * Features:
 * - Memoized toolbar state (useToolbarState hook)
 * - Full table manipulation with context menu
 * - Notion-style drag handle for block reordering
 * - BubbleMenu for quick formatting on selection
 * - Character/word count display
 * - Professional typography
 */

'use client';

import { EditorContent, type JSONContent, useEditor } from '@tiptap/react';
import { useEffect, useRef } from 'react';
import { EditorBubbleMenu } from '@/components/translations/translation-editor/components/bubble-menu';
import { EditorContextMenu } from '@/components/translations/translation-editor/components/context-menu';
import { EditorDragHandle } from '@/components/translations/translation-editor/components/drag-handle';
import { EditorFooter } from '@/components/translations/translation-editor/components/editor-footer';
import { LinkPreviewTooltip } from '@/components/translations/translation-editor/components/link-preview-tooltip';
import { NotionTableUI } from '@/components/translations/translation-editor/components/table-menu';
import { Toolbar } from '@/components/translations/translation-editor/components/toolbar';
import { LinkDialog } from '@/components/translations/translation-editor/components/toolbar/link-dialog';
import { useEditorConfig } from '@/components/translations/translation-editor/hooks/use-editor-config';
import { useLinkDialog } from '@/components/translations/translation-editor/hooks/use-link-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EditorSkeleton } from '../editor-skeleton';

type TranslationEditorProps = {
    initialContent: JSONContent | null;
    localOnly?: boolean;
    onChange: (content: JSONContent) => void;
    editable?: boolean;
    originalContent?: JSONContent | null;
    onReset?: () => void;
    isSaving?: boolean;
    lastSaveTime?: Date | null;
    hasUnsavedChanges?: boolean;
    /**
     * Text direction for the editor content.
     * 'rtl' handles RTL language alignment and layout.
     * Defaults to 'ltr'.
     */
    direction?: 'ltr' | 'rtl';
};

export function TranslationEditor({
    direction = 'ltr',
    editable = true,
    hasUnsavedChanges,
    initialContent,
    localOnly = false,
    isSaving,
    lastSaveTime,
    onChange,
    onReset,
    originalContent,
}: TranslationEditorProps) {
    const config = useEditorConfig({
        initialContent,
        editable,
        onChange,
        direction, // Pass direction to config
    });

    const editor = useEditor(config);
    const portalContainerRef = useRef<HTMLDivElement>(null);

    // Sync editable state
    useEffect(() => {
        if (editor && editor.isEditable !== editable) {
            editor.setEditable(editable);
        }
    }, [editor, editable]);

    // Sync direction to editor options for extensions that might needs it
    useEffect(() => {
        if (!editor || !direction) return;

        // We still sync to options just in case extensions read from there
        // But visual rendering is handled by EditorContent prop

        // Only update if actually changed to avoid overhead
        const currentDir = (editor.options.editorProps.attributes as Record<string, string>)?.dir;

        if (currentDir !== direction) {
            const attributes = editor.options.editorProps.attributes as Record<string, string>;
            const existingClass = attributes?.class || 'tiptap focus:outline-none';

            editor.setOptions({
                editorProps: {
                    attributes: {
                        class: existingClass,
                        dir: direction,
                        'data-direction': direction,
                    },
                },
            });
        }
    }, [editor, direction]);

    // Link dialog management for LinkPreviewTooltip (after editor check)
    const linkDialog = useLinkDialog(editor!);

    if (!editor) {
        return <EditorSkeleton />;
    }

    // Destructure link dialog after editor is guaranteed
    const {
        getCurrentLink,
        getSelectedText,
        handleRemove: handleLinkRemove,
        handleSubmit: handleLinkSubmit,
        isOpen: isLinkDialogOpen,
        setIsOpen: setLinkDialogOpen,
    } = linkDialog;

    const { hasExistingLink, rel: currentRel, target: currentTarget, url: currentUrl } = getCurrentLink();
    const selectedText = getSelectedText();

    return (
        <div className="dark:bg-surface-950 flex h-full flex-col bg-white">
            {/* Sticky Toolbar */}
            {editable && (
                <div className="sticky top-0 z-50 h-14 shrink-0">
                    <Toolbar editor={editor} originalContent={originalContent} onReset={onReset} />
                </div>
            )}

            {/* Drag Handle - outside scroll area for proper positioning */}
            {editable && <EditorDragHandle editor={editor} />}

            {/* Editor Content with Intelligent Context Menu */}
            <EditorContextMenu editor={editor}>
                <ScrollArea className="flex-1">
                    {/* Content wrapper with centered max-width */}
                    <div className="relative mx-auto max-w-4xl px-12 py-12 lg:px-12 lg:py-10">
                        {/* Main Editor */}
                        <EditorContent
                            dir={direction}
                            data-direction={direction}
                            className="tiptap text-foreground min-h-[calc(100vh-200px)] focus:outline-none"
                            editor={editor}
                        />

                        {/* 
                          Portal container for table overlays.
                          INSIDE the same container as EditorContent so they share 
                          the same positioning origin and scroll together.
                        */}
                        <div
                            ref={portalContainerRef}
                            className="pointer-events-none absolute inset-0 z-30 overflow-hidden"
                        />
                    </div>

                    {/* Editor Footer - full width outside max-w-4xl */}
                    <EditorFooter
                        localOnly={localOnly}
                        editor={editor}
                        hasUnsavedChanges={hasUnsavedChanges}
                        isSaving={isSaving}
                        lastSaveTime={lastSaveTime}
                    />
                </ScrollArea>
            </EditorContextMenu>

            {/* Link Preview Tooltip - Google Docs / Notion style (fixed position) */}
            {editable && (
                <LinkPreviewTooltip
                    editor={editor}
                    onEdit={() => setLinkDialogOpen(true)}
                    onRemove={handleLinkRemove}
                />
            )}

            {/* Link Dialog - for editing links from preview tooltip */}
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

            {/* Floating BubbleMenu */}
            {editable && <EditorBubbleMenu editor={editor} />}

            {/* Notion-style Table UI - handles, menus, add buttons, selection */}
            {editable && <NotionTableUI editor={editor} portalContainerRef={portalContainerRef} />}
        </div>
    );
}
