/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * useTableControls Hook
 * Provides memoized table manipulation functions (essential operations only)
 */

'use client';

import { useCallback } from 'react';
import type { Editor } from '@tiptap/react';

export type TableControls = {
    // Insert operations
    insertTable: (rows?: number, cols?: number, withHeaderRow?: boolean) => void;

    // Row operations
    addRowBefore: () => void;
    addRowAfter: () => void;
    deleteRow: () => void;

    // Column operations
    addColumnBefore: () => void;
    addColumnAfter: () => void;
    deleteColumn: () => void;

    // Cell operations
    mergeCells: () => void;
    splitCell: () => void;
    toggleHeaderCell: () => void;

    // Table operations
    deleteTable: () => void;
    fixTables: () => void;

    // Navigation
    goToNextCell: () => void;
    goToPreviousCell: () => void;
};

/**
 * Hook that provides all table manipulation functions
 */
export function useTableControls(editor: Editor | null): TableControls {
    const insertTable = useCallback(
        (rows = 3, cols = 3, withHeaderRow = true) => {
            editor?.chain().focus().insertTable({ rows, cols, withHeaderRow }).run();
        },
        [editor],
    );

    const addRowBefore = useCallback(() => {
        editor?.chain().focus().addRowBefore().run();
    }, [editor]);

    const addRowAfter = useCallback(() => {
        editor?.chain().focus().addRowAfter().run();
    }, [editor]);

    const deleteRow = useCallback(() => {
        editor?.chain().focus().deleteRow().run();
    }, [editor]);

    const addColumnBefore = useCallback(() => {
        editor?.chain().focus().addColumnBefore().run();
    }, [editor]);

    const addColumnAfter = useCallback(() => {
        editor?.chain().focus().addColumnAfter().run();
    }, [editor]);

    const deleteColumn = useCallback(() => {
        editor?.chain().focus().deleteColumn().run();
    }, [editor]);

    const mergeCells = useCallback(() => {
        editor?.chain().focus().mergeCells().run();
    }, [editor]);

    const splitCell = useCallback(() => {
        editor?.chain().focus().splitCell().run();
    }, [editor]);

    const toggleHeaderCell = useCallback(() => {
        editor?.chain().focus().toggleHeaderCell().run();
    }, [editor]);

    const deleteTable = useCallback(() => {
        editor?.chain().focus().deleteTable().run();
    }, [editor]);

    const fixTables = useCallback(() => {
        editor?.chain().focus().fixTables().run();
    }, [editor]);

    const goToNextCell = useCallback(() => {
        editor?.chain().focus().goToNextCell().run();
    }, [editor]);

    const goToPreviousCell = useCallback(() => {
        editor?.chain().focus().goToPreviousCell().run();
    }, [editor]);

    return {
        insertTable,
        addRowBefore,
        addRowAfter,
        deleteRow,
        addColumnBefore,
        addColumnAfter,
        deleteColumn,
        mergeCells,
        splitCell,
        toggleHeaderCell,
        deleteTable,
        fixTables,
        goToNextCell,
        goToPreviousCell,
    };
}
