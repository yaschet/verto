/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * TableMenuContent Component
 * Table operations for context menu (flat structure, Notion-style)
 */

'use client';

import {
    ArrowLineDownIcon,
    ArrowLineLeftIcon,
    ArrowLineRightIcon,
    ArrowLineUpIcon,
    ArrowsInLineHorizontalIcon,
    ArrowsOutLineHorizontalIcon,
    TextHIcon,
    ColumnsIcon,
    MinusIcon,
    RowsIcon,
    TextAlignCenterIcon,
    TextAlignLeftIcon,
    TextAlignRightIcon,
    TrashIcon,
} from '@phosphor-icons/react';
import { MenuItemWithIcon } from '@/components/translations/translation-editor/components/context-menu/menu-item-with-icon';
import {
    ContextMenuSeparator,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
} from '@/components/ui/context-menu';
import type { TableControls } from '@/components/translations/translation-editor/hooks/use-table-controls';
import type { Editor } from '@tiptap/react';

type TableMenuContentProps = {
    editor: Editor;
    tableControls: TableControls;
    onClose?: () => void;
};

// Auxiliary component for SubMenu Triggers to ensure consistent styling with MenuItemWithIcon
function SubMenuTriggerWithIcon({
    icon: Icon,
    label,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
}) {
    return (
        <ContextMenuSubTrigger className="focus:bg-surface-200 focus:text-surface-800 dark:focus:bg-surface-900 dark:focus:text-surface-50 flex cursor-default items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium">
            <Icon className="size-3.5 shrink-0" />
            <span>{label}</span>
        </ContextMenuSubTrigger>
    );
}

export function TableMenuContent({ editor, onClose, tableControls }: TableMenuContentProps) {
    const handleAction = (action: () => void) => {
        action();
        onClose?.();
    };

    /**
     * Enforced Alignment Helper
     * Sets alignment on BOTH the Cell Container and the Content (Paragraph/Heading).
     * This "Force Syncs" the alignment to ensure zero ambiguity and fixes "Double Active" states.
     */
    const handleAlign = (alignment: 'left' | 'center' | 'right') => {
        editor
            .chain()
            .focus()
            // 1. Set Container Alignment
            .setCellAttribute('textAlign', alignment)
            // 2. Force Content Alignment (Explicitly set, don't just clear)
            .setTextAlign(alignment)
            .run();
        onClose?.();
    };

    const handleDeleteTable = () => {
        if (window.confirm('Delete this table?')) {
            tableControls.deleteTable();
        }
        onClose?.();
    };

    const canMerge = editor.can().mergeCells();
    const canSplit = editor.can().splitCell();

    return (
        <>
            {/* Format (Alignments) - Syncs Container & Content */
            /* Checking Content State (Standard Tiptap Behavior) - Now accurate because we sync it */}
            <MenuItemWithIcon
                active={editor.isActive({ textAlign: 'left' })}
                icon={TextAlignLeftIcon}
                label="Align left"
                onClick={() => handleAlign('left')}
            />
            <MenuItemWithIcon
                active={editor.isActive({ textAlign: 'center' })}
                icon={TextAlignCenterIcon}
                label="Align center"
                onClick={() => handleAlign('center')}
            />
            <MenuItemWithIcon
                active={editor.isActive({ textAlign: 'right' })}
                icon={TextAlignRightIcon}
                label="Align right"
                onClick={() => handleAlign('right')}
            />

            <ContextMenuSeparator />

            {/* Smart Cell Actions (Only show if applicable) */}
            {(canMerge || canSplit) && (
                <>
                    {canMerge && (
                        <MenuItemWithIcon
                            icon={ArrowsInLineHorizontalIcon}
                            label="Merge cells"
                            onClick={() => handleAction(tableControls.mergeCells)}
                        />
                    )}
                    {canSplit && (
                        <MenuItemWithIcon
                            icon={ArrowsOutLineHorizontalIcon}
                            label="Split cell"
                            onClick={() => handleAction(tableControls.splitCell)}
                        />
                    )}
                    <ContextMenuSeparator />
                </>
            )}

            <MenuItemWithIcon
                active={editor.isActive('tableHeader')}
                icon={TextHIcon}
                label="Header cell"
                onClick={() => handleAction(tableControls.toggleHeaderCell)}
            />

            <ContextMenuSeparator />

            {/* Structured Submenus for Row/Column Operations */}
            <ContextMenuSub>
                <SubMenuTriggerWithIcon icon={RowsIcon} label="Row" />
                <ContextMenuSubContent className="bg-surface-2 border-border text-foreground min-w-40 rounded-xl p-1">
                    <MenuItemWithIcon
                        icon={ArrowLineUpIcon}
                        label="Insert above"
                        onClick={() => handleAction(tableControls.addRowBefore)}
                    />
                    <MenuItemWithIcon
                        icon={ArrowLineDownIcon}
                        label="Insert below"
                        onClick={() => handleAction(tableControls.addRowAfter)}
                    />
                    <ContextMenuSeparator />
                    <MenuItemWithIcon
                        destructive
                        icon={MinusIcon}
                        label="Delete row"
                        onClick={() => handleAction(tableControls.deleteRow)}
                    />
                </ContextMenuSubContent>
            </ContextMenuSub>

            <ContextMenuSub>
                <SubMenuTriggerWithIcon icon={ColumnsIcon} label="Column" />
                <ContextMenuSubContent className="bg-surface-2 border-border text-foreground min-w-40 rounded-xl p-1">
                    <MenuItemWithIcon
                        icon={ArrowLineLeftIcon}
                        label="Insert left"
                        onClick={() => handleAction(tableControls.addColumnBefore)}
                    />
                    <MenuItemWithIcon
                        icon={ArrowLineRightIcon}
                        label="Insert right"
                        onClick={() => handleAction(tableControls.addColumnAfter)}
                    />
                    <ContextMenuSeparator />
                    <MenuItemWithIcon
                        destructive
                        icon={MinusIcon}
                        label="Delete column"
                        onClick={() => handleAction(tableControls.deleteColumn)}
                    />
                </ContextMenuSubContent>
            </ContextMenuSub>

            <ContextMenuSeparator />

            {/* Destructive Table Action */}
            <MenuItemWithIcon destructive icon={TrashIcon} label="Delete table" onClick={handleDeleteTable} />
        </>
    );
}
