/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * TextMenuContent Component
 * Text formatting operations for context menu
 */

'use client';

import {
    LinkIcon,
    LinkBreakIcon,
    PencilSimpleIcon,
    TextBIcon,
    TextItalicIcon,
    TextStrikethroughIcon,
    TextUnderlineIcon,
} from '@phosphor-icons/react';
import { MenuItemWithIcon } from '@/components/translations/translation-editor/components/context-menu/menu-item-with-icon';
import { ContextMenuSeparator } from '@/components/ui/context-menu';
import type { ToolbarState } from '@/components/translations/translation-editor/hooks/use-toolbar-state';
import type { Editor } from '@tiptap/react';

type TextMenuContentProps = {
    editor: Editor;
    toolbarState: ToolbarState | null;
    onClose?: () => void;
    onOpenLinkDialog?: () => void;
};

export function TextMenuContent({ editor, onClose, onOpenLinkDialog, toolbarState }: TextMenuContentProps) {
    const handleAction = (action: () => void) => {
        action();
        onClose?.();
    };

    const handleAddLink = () => {
        // Use the full-featured LinkDialog instead of window.prompt
        onOpenLinkDialog?.();
    };

    const handleRemoveLink = () => {
        editor.chain().focus().unsetLink().run();
        onClose?.();
    };

    const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const mod = isMac ? '⌘' : 'Ctrl+';

    return (
        <>
            {/* Text Formatting */}
            <MenuItemWithIcon
                active={toolbarState?.isBold}
                icon={TextBIcon}
                label="Bold"
                shortcut={`${mod}B`}
                onClick={() => handleAction(() => editor.chain().focus().toggleBold().run())}
            />
            <MenuItemWithIcon
                active={toolbarState?.isItalic}
                icon={TextItalicIcon}
                label="Italic"
                shortcut={`${mod}I`}
                onClick={() => handleAction(() => editor.chain().focus().toggleItalic().run())}
            />
            <MenuItemWithIcon
                active={toolbarState?.isUnderline}
                icon={TextUnderlineIcon}
                label="Underline"
                shortcut={`${mod}U`}
                onClick={() => handleAction(() => editor.chain().focus().toggleUnderline().run())}
            />
            <MenuItemWithIcon
                active={toolbarState?.isStrike}
                icon={TextStrikethroughIcon}
                label="Strikethrough"
                shortcut={`${mod}⇧S`}
                onClick={() => handleAction(() => editor.chain().focus().toggleStrike().run())}
            />

            <ContextMenuSeparator />

            {/* LinkIcon Operations */}
            {toolbarState?.isLink ? (
                <>
                    <MenuItemWithIcon
                        icon={PencilSimpleIcon}
                        label="Edit link"
                        shortcut={`${mod}K`}
                        onClick={handleAddLink}
                    />
                    <MenuItemWithIcon
                        destructive
                        icon={LinkBreakIcon}
                        label="Remove link"
                        onClick={handleRemoveLink}
                    />
                </>
            ) : (
                <MenuItemWithIcon
                    icon={LinkIcon}
                    label="Add link"
                    shortcut={`${mod}K`}
                    onClick={handleAddLink}
                />
            )}
        </>
    );
}
