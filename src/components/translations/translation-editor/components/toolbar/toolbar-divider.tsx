/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * ToolbarDivider Component
 * Visual separator between toolbar groups
 */

'use client';

import { memo } from 'react';

export const ToolbarDivider = memo(function ToolbarDivider() {
    return (
        <div
            aria-orientation="vertical"
            className="via-surface-300 dark:via-surface-700 mx-2 h-5 w-px bg-gradient-to-b from-transparent to-transparent"
            role="separator"
        />
    );
});
