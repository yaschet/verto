/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * Table Keyboard Shortcuts Extension
 * Adds Tab/Shift-Tab navigation for tables
 */

import { Extension } from '@tiptap/core';

export const TableKeyboardShortcuts = Extension.create({
    name: 'tableKeyboardShortcuts',

    addKeyboardShortcuts() {
        return {
            Tab: () => {
                if (this.editor.isActive('table')) {
                    return this.editor.commands.goToNextCell();
                }
                return false;
            },
            'Shift-Tab': () => {
                if (this.editor.isActive('table')) {
                    return this.editor.commands.goToPreviousCell();
                }
                return false;
            },
        };
    },
});
