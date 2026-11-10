/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * EditorDragHandle Component
 * Notion-style drag handle for reordering blocks
 *
 * Floating UI positions the handle at the left edge of the block's bounding box.
 * CSS transform then shifts it to the correct visual position.
 *
 * For tables, we set a data-node-type attribute on the drag handle element
 * so CSS can disable the transform (tables don't need it).
 */

'use client';

import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { DotsSixVerticalIcon } from '@phosphor-icons/react';
import DragHandle from '@tiptap/extension-drag-handle-react';
import { NodeSelection } from '@tiptap/pm/state';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/library/utils';
import type { Editor } from '@tiptap/react';
import { getTextDirection } from '@/constants/translations';

type EditorDragHandleProps = {
    editor: Editor;
};

export function EditorDragHandle({ editor }: EditorDragHandleProps) {
    const [currentPos, setCurrentPos] = useState<number | null>(null);
    const [isVisible, setIsVisible] = useState(true);
    const dragHandleRef = useRef<HTMLDivElement>(null);

    const isRTL =
        editor.storage.translationDirection === 'rtl' ||
        getTextDirection(
            ((editor.options.editorProps.attributes as Record<string, string>)?.lang as string) || '',
        ) === 'rtl' ||
        (editor.options.editorProps.attributes as Record<string, string>)?.dir === 'rtl';

    const handleNodeChange = useCallback((data: { node: ProseMirrorNode | null; pos: number } | null) => {
        if (data) {
            setCurrentPos(data.pos);
            const nodeType = data.node?.type?.name || null;

            // Set data-node-type on the drag handle parent element
            // This allows CSS to conditionally style based on node type
            const dragHandle = dragHandleRef.current?.closest('.drag-handle');
            if (dragHandle instanceof HTMLElement) {
                if (nodeType) {
                    dragHandle.dataset.nodeType = nodeType;
                } else {
                    delete dragHandle.dataset.nodeType;
                }
            }
        } else {
            setCurrentPos(null);
            // Clear the data attribute when no node is hovered
            const dragHandle = dragHandleRef.current?.closest('.drag-handle');
            if (dragHandle instanceof HTMLElement) {
                delete dragHandle.dataset.nodeType;
            }
        }
    }, []);

    const handleClick = useCallback(() => {
        if (currentPos !== null && !editor.isDestroyed) {
            // Select the node at the current drag handle position
            const tr = editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, currentPos));
            editor.view.dispatch(tr);
            editor.view.focus();
        }
    }, [editor, currentPos]);

    // Track visibility on scroll to hide handle when out of bounds
    useEffect(() => {
        const checkVisibility = () => {
            if (currentPos === null || !editor || !editor.view || !editor.view.dom) return;

            try {
                const getScrollParent = (node: HTMLElement): HTMLElement => {
                    if (!node) return document.documentElement;
                    const overflowY = window.getComputedStyle(node).overflowY;
                    const isScrollable = overflowY !== 'visible' && overflowY !== 'hidden';
                    if (isScrollable && node.scrollHeight >= node.clientHeight) {
                        return node;
                    }
                    return getScrollParent(node.parentElement as HTMLElement) || document.documentElement;
                };

                const scrollParent = getScrollParent(editor.view.dom);
                const scrollRect = scrollParent.getBoundingClientRect();
                const coords = editor.view.coordsAtPos(currentPos);
                const CLIP_PADDING = 10;

                const isVisibleInView =
                    coords.top >= scrollRect.top - CLIP_PADDING &&
                    coords.top <= scrollRect.bottom + CLIP_PADDING;

                setIsVisible(isVisibleInView);
            } catch {
                // Fallback to visible if coords calculation fails
                setIsVisible(true);
            }
        };

        // Check initially and on updates
        checkVisibility();

        const handleScroll = () => {
            // Use requestAnimationFrame for performance
            requestAnimationFrame(checkVisibility);
        };

        window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
        window.addEventListener('resize', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll, { capture: true });
            window.removeEventListener('resize', handleScroll);
        };
    }, [editor, currentPos]); // Re-bind when position changes to ensure fresh check

    return (
        <DragHandle
            className={cn('drag-handle', isRTL && 'is-rtl', !isVisible && 'hidden')}
            computePositionConfig={{
                placement: isRTL ? 'right-start' : 'left-start',
                strategy: 'fixed',
            }}
            editor={editor}
            onNodeChange={handleNodeChange}
        >
            <div
                ref={dragHandleRef}
                className={cn(
                    'flex h-6 w-5 items-center justify-center rounded-md',
                    'cursor-grab active:cursor-grabbing',
                    'transition-colors duration-75',
                    'hover:bg-surface-100 dark:hover:bg-surface-800',
                )}
                onClick={handleClick}
            >
                <DotsSixVerticalIcon
                    className="text-surface-400 dark:text-surface-500 size-4"
                    weight="bold"
                />
            </div>
        </DragHandle>
    );
}
