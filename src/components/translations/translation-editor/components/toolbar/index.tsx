/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * Toolbar Component
 * Main toolbar that composes all toolbar groups
 */

'use client';

import { AlignmentGroup } from '@/components/translations/translation-editor/components/toolbar/alignment-group';
import { FormatGroup } from '@/components/translations/translation-editor/components/toolbar/format-group';
import { HeadingSelect } from '@/components/translations/translation-editor/components/toolbar/heading-select';
import { HistoryGroup } from '@/components/translations/translation-editor/components/toolbar/history-group';
import { InsertGroup } from '@/components/translations/translation-editor/components/toolbar/insert-group';
import { ListGroup } from '@/components/translations/translation-editor/components/toolbar/list-group';
import { ResetGroup } from '@/components/translations/translation-editor/components/toolbar/reset-group';
import { ToolbarDivider } from '@/components/translations/translation-editor/components/toolbar/toolbar-divider';
import { useToolbarState } from '@/components/translations/translation-editor/hooks/use-toolbar-state';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { JSONContent } from '@tiptap/react';
import type { Editor } from '@tiptap/react';

type ToolbarProps = {
    editor: Editor;
    originalContent?: JSONContent | null;
    onReset?: () => void;
};

export function Toolbar({ editor, onReset, originalContent }: ToolbarProps) {
    const state = useToolbarState(editor);

    if (!state) return null;

    return (
        <ScrollArea
            className="border-surface-3 dark:bg-surface-950 h-full w-full border-b bg-white px-2"
            orientation="horizontal"
        >
            <div className="flex h-14 w-full min-w-max items-center justify-center gap-1">
                <HistoryGroup editor={editor} state={state} />
                <ToolbarDivider />
                <HeadingSelect currentHeading={state.currentHeading} editor={editor} />
                <ToolbarDivider />
                <FormatGroup editor={editor} state={state} />
                <ToolbarDivider />
                <AlignmentGroup editor={editor} state={state} />
                <ToolbarDivider />
                <ListGroup editor={editor} state={state} />
                <ToolbarDivider />
                <InsertGroup editor={editor} state={state} />
                <ToolbarDivider />
                <ResetGroup editor={editor} originalContent={originalContent} onReset={onReset} />
            </div>
        </ScrollArea>
    );
}

// Re-export subcomponents
export { HeadingSelect } from './heading-select';
export { FormatGroup } from './format-group';
export { AlignmentGroup } from './alignment-group';
export { ListGroup } from './list-group';
export { InsertGroup } from './insert-group';
export { HistoryGroup } from './history-group';
export { ResetGroup } from './reset-group';
export { ToolbarDivider } from './toolbar-divider';
