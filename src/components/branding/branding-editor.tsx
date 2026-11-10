/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { useMemo } from 'react';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import LinkIcon from '@tiptap/extension-link';
import { TextBIcon, TextItalicIcon, LinkIcon as PhosphorLinkIcon } from '@phosphor-icons/react';
import { cn } from '@library/utils';
import { Button } from '@components/ui/button';
import { ScrollArea } from '@components/ui/scroll-area';
import { LinkDialog } from '@components/translations/translation-editor/components/toolbar/link-dialog';
import { useLinkDialog } from '@components/translations/translation-editor/hooks/use-link-dialog';
import type { ProseMirrorJSON } from '@/types/document/branding-settings';
import type { Editor } from '@tiptap/react';

/**
 * Minimal toolbar state for branding editor
 * Uses useEditorState for reactive updates when selection changes
 */
type BrandingToolbarState = {
    isBold: boolean;
    isItalic: boolean;
    isLink: boolean;
    canToggleBold: boolean;
    canToggleItalic: boolean;
};

function useBrandingToolbarState(editor: Editor | null): BrandingToolbarState | null {
    return useEditorState({
        editor,
        selector: ({ editor: e }): BrandingToolbarState | null => {
            if (!e) return null;
            return {
                isBold: e.isActive('bold'),
                isItalic: e.isActive('italic'),
                isLink: e.isActive('link'),
                canToggleBold: e.can().chain().focus().toggleBold().run(),
                canToggleItalic: e.can().chain().focus().toggleItalic().run(),
            };
        },
    });
}

type BrandingEditorProps = {
    content: ProseMirrorJSON | null;
    onChange: (content: ProseMirrorJSON | null) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
};

/**
 * Minimal TipTap editor for branding text fields
 * Supports only: bold, italic, and links
 * Uses floating BubbleMenu that appears on text selection
 */
export function BrandingEditor({
    content,
    onChange,
    placeholder = 'Enter text...',
    className,
    disabled = false,
}: BrandingEditorProps) {
    // Create minimal extensions
    const extensions = useMemo(
        () => [
            StarterKit.configure({
                // Disable everything except basic text formatting
                heading: false,
                bulletList: false,
                orderedList: false,
                listItem: false,
                blockquote: false,
                codeBlock: false,
                code: false,
                horizontalRule: false,
                dropcursor: false,
                gapcursor: false,
            }),
            LinkIcon.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-primary underline hover:text-primary/80 cursor-pointer',
                },
            }),
        ],
        [],
    );

    // Initialize editor
    // Initialize editor
    const editor = useEditor({
        extensions,
        content: content || { type: 'doc', content: [] },
        editable: !disabled,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            const json = editor.getJSON() as ProseMirrorJSON;
            // Check if content is empty (just an empty doc)
            const isEmpty =
                !json.content ||
                json.content.length === 0 ||
                (json.content.length === 1 &&
                    json.content[0].type === 'paragraph' &&
                    !json.content[0].content);
            onChange(isEmpty ? null : json);
        },
        editorProps: {
            attributes: {
                class: cn(
                    'prose prose-sm dark:prose-invert focus:outline-none',
                    'text-sm leading-relaxed',
                    'branding-editor',
                    disabled && 'opacity-50 cursor-not-allowed',
                    // Alignment classes also on editor just in case, but wrapper handles visual alignment
                    className?.includes('text-right') && 'text-right',
                    className?.includes('text-center') && 'text-center',
                ),
                'data-placeholder': placeholder,
            },
        },
    });

    // Reactive toolbar state - updates when selection changes
    const toolbarState = useBrandingToolbarState(editor);

    // Use the shared link dialog hook from Translation Editor
    const {
        getCurrentLink,
        getSelectedText,
        handleRemove: handleLinkRemove,
        handleSubmit: handleLinkSubmit,
        isOpen: isLinkDialogOpen,
        openDialog: openLinkDialog,
        setIsOpen: setLinkDialogOpen,
    } = useLinkDialog(editor!);

    if (!editor) {
        return (
            <div
                className={cn(
                    'min-h-[60px] rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900 animate-pulse',
                    className,
                )}
            />
        );
    }

    const { hasExistingLink, rel: currentRel, target: currentTarget, url: currentUrl } = getCurrentLink();
    const selectedText = getSelectedText();

    return (
        <div className="relative">
            {/* Floating Bubble Menu - appears on text selection */}
            <BubbleMenu
                editor={editor}
                options={{
                    placement: 'top',
                    offset: 8,
                }}
                className="flex items-center gap-1 rounded-xl bg-popover text-popover-foreground p-1.5 shadow-lg border border-border"
            >
                <Button
                    className={cn(
                        'h-8 w-8 p-0 transition-all duration-150',
                        'hover:scale-105 active:scale-95',
                    )}
                    color={toolbarState?.isBold ? 'primary' : 'default'}
                    size="sm"
                    variant={toolbarState?.isBold ? 'solid' : 'soft'}
                    tooltipContent="Bold (Cmd+B)"
                    tooltipDelayDuration={400}
                    tooltipSide="bottom"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    disabled={disabled || !toolbarState?.canToggleBold}
                >
                    <TextBIcon className="size-4" weight="bold" />
                </Button>

                <Button
                    className={cn(
                        'h-8 w-8 p-0 transition-all duration-150',
                        'hover:scale-105 active:scale-95',
                    )}
                    color={toolbarState?.isItalic ? 'primary' : 'default'}
                    size="sm"
                    variant={toolbarState?.isItalic ? 'solid' : 'soft'}
                    tooltipContent="Italic (Cmd+I)"
                    tooltipDelayDuration={400}
                    tooltipSide="bottom"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    disabled={disabled || !toolbarState?.canToggleItalic}
                >
                    <TextItalicIcon className="size-4" />
                </Button>

                <Button
                    className={cn(
                        'h-8 w-8 p-0 transition-all duration-150',
                        'hover:scale-105 active:scale-95',
                    )}
                    color={toolbarState?.isLink ? 'primary' : 'default'}
                    size="sm"
                    variant={toolbarState?.isLink ? 'solid' : 'soft'}
                    tooltipContent="Add Link (Cmd+K)"
                    tooltipDelayDuration={400}
                    tooltipSide="bottom"
                    onClick={openLinkDialog}
                    disabled={disabled}
                >
                    <PhosphorLinkIcon className="size-4" />
                </Button>
            </BubbleMenu>

            {/* Editor with Custom ScrollArea */}
            <ScrollArea
                className={cn(
                    'rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900',
                    'focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-0',
                    'hover:bg-surface-100 dark:hover:bg-surface-800/80 transition-all duration-150',
                    // Fix for ScrollArea max-height issue: Apply constraints to Viewport, not Root
                    '[&>[data-radix-scroll-area-viewport]]:max-h-[100px]',
                    '[&>[data-radix-scroll-area-viewport]]:min-h-[60px]',
                    // Override size-full (h-full) on viewport to avoid layout shift/locking
                    '[&>[data-radix-scroll-area-viewport]]:!h-auto',
                    className, // Pass container classes (margins etc)
                )}
            >
                <div
                    className={cn(
                        'p-3',
                        // Alignment needs to be on this wrapper as well/instead
                        className?.includes('text-right') && 'text-right',
                        className?.includes('text-center') && 'text-center',
                        !className?.includes('text-right') &&
                            !className?.includes('text-center') &&
                            'text-left',
                    )}
                >
                    <EditorContent editor={editor} />
                </div>
            </ScrollArea>

            {/* Link Dialog - same as Translation Editor */}
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
        </div>
    );
}
