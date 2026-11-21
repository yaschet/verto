/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * LinkPreviewTooltip Component
 * Google Docs / Notion style link preview tooltip
 *
 * Appears when cursor is placed inside a link (not when selecting text).
 * Shows URL preview with Copy, Open, Edit, and Remove actions.
 */

'use client';

import { ArrowSquareOutIcon, CopyIcon, PencilSimpleIcon, TrashIcon } from '@phosphor-icons/react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/library/utils';
import type { Editor } from '@tiptap/react';

type LinkPreviewTooltipProps = {
    editor: Editor;
    onEdit: () => void;
    onRemove: () => void;
};

export function LinkPreviewTooltip({ editor, onEdit, onRemove }: LinkPreviewTooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [linkUrl, setLinkUrl] = useState('');

    useEffect(() => {
        const updateTooltip = () => {
            // Guard against resize/unmount when docView is null
            if (!(editor.view as typeof editor.view & { docView?: unknown }).docView) {
                setIsVisible(false);
                return;
            }

            const { selection } = editor.state;
            const { empty } = selection;

            // Only show when cursor is placed (empty selection), not when selecting text
            if (!empty) {
                setIsVisible(false);
                return;
            }

            // Check if cursor is inside a link using multiple detection methods
            const { from } = selection;
            const $from = editor.state.doc.resolve(from);

            // Method 1: Check marks at current position
            let linkMark = $from.marks().find((mark) => mark.type.name === 'link');

            // Method 2: If at boundary, check the node before cursor
            if (!linkMark && from > 0) {
                const $before = editor.state.doc.resolve(from - 1);
                linkMark = $before.marks().find((mark) => mark.type.name === 'link');
            }

            // Method 3: Fallback to editor.isActive (most reliable for UI state)
            if (!linkMark && editor.isActive('link')) {
                const attrs = editor.getAttributes('link');
                if (attrs.href) {
                    // Get position for tooltip using fixed positioning
                    const coords = editor.view.coordsAtPos(from);

                    setPosition({
                        top: coords.bottom + 8,
                        left: coords.left - 100,
                    });
                    setLinkUrl(attrs.href);
                    setIsVisible(true);
                    return;
                }
            }

            if (!linkMark?.attrs?.href) {
                setIsVisible(false);
                return;
            }

            // Get position for tooltip using fixed positioning relative to viewport
            const coords = editor.view.coordsAtPos(from);

            setPosition({
                top: coords.bottom + 8,
                left: coords.left - 100,
            });
            setLinkUrl(linkMark.attrs.href);
            setIsVisible(true);
        };

        editor.on('selectionUpdate', updateTooltip);
        editor.on('focus', updateTooltip);

        const handleBlur = () => setIsVisible(false);
        editor.on('blur', handleBlur);

        return () => {
            editor.off('selectionUpdate', updateTooltip);
            editor.off('focus', updateTooltip);
            editor.off('blur', handleBlur);
        };
    }, [editor]);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(linkUrl);
        toast.success('Link copied to clipboard');
    }, [linkUrl]);

    const handleOpen = useCallback(() => {
        window.open(linkUrl, '_blank', 'noopener,noreferrer');
    }, [linkUrl]);

    const handleEdit = useCallback(() => {
        setIsVisible(false);
        onEdit();
    }, [onEdit]);

    const handleRemove = useCallback(() => {
        setIsVisible(false);
        onRemove();
    }, [onRemove]);

    if (!isVisible) return null;

    // Truncate long URLs for display
    const displayUrl = linkUrl.length > 35 ? linkUrl.substring(0, 32) + '...' : linkUrl;

    return (
        <div
            className={cn(
                'fixed z-[100] flex items-center gap-1 rounded-xl border p-1.5 shadow-lg',
                'border-surface-200 dark:border-surface-800 dark:bg-surface-950 bg-white',
                'animate-in fade-in-0 zoom-in-95 duration-150',
            )}
            style={{ top: position.top, left: Math.max(8, position.left) }}
            onMouseDown={(e) => e.preventDefault()} // Prevent stealing focus
        >
            {/* URL Preview */}
            <span className="text-muted-foreground max-w-[180px] truncate px-2 text-sm">{displayUrl}</span>

            <div className="bg-surface-200 dark:bg-surface-700 h-4 w-px" />

            {/* Actions */}
            <Button
                className="h-7 w-7 p-0"
                size="sm"
                tooltipContent="Copy link"
                tooltipDelayDuration={300}
                tooltipSide="top"
                variant="soft"
                onClick={handleCopy}
            >
                <CopyIcon className="size-3.5" />
            </Button>
            <Button
                className="h-7 w-7 p-0"
                size="sm"
                tooltipContent="Open in new tab"
                tooltipDelayDuration={300}
                tooltipSide="top"
                variant="soft"
                onClick={handleOpen}
            >
                <ArrowSquareOutIcon className="size-3.5" />
            </Button>
            <Button
                className="h-7 w-7 p-0"
                size="sm"
                tooltipContent="Edit link"
                tooltipDelayDuration={300}
                tooltipSide="top"
                variant="soft"
                onClick={handleEdit}
            >
                <PencilSimpleIcon className="size-3.5" />
            </Button>
            <Button
                className="h-7 w-7 p-0"
                color="destructive"
                size="sm"
                tooltipContent="Remove link"
                tooltipDelayDuration={300}
                tooltipSide="top"
                variant="soft"
                onClick={handleRemove}
            >
                <TrashIcon className="size-3.5" />
            </Button>
        </div>
    );
}
