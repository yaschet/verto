/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * MenuItemWithIcon Component
 * Reusable compact context menu item with icon and optional shortcut
 */

'use client';

import { ContextMenuItem, ContextMenuShortcut } from '@/components/ui/context-menu';
import { cn } from '@/library/utils';
import type { Icon } from '@phosphor-icons/react';

type MenuItemWithIconProps = {
    icon: Icon;
    label: string;
    shortcut?: string;
    onClick: () => void;
    active?: boolean;
    destructive?: boolean;
    disabled?: boolean;
};

// COMPACT PREMIUM STANDARD (B2B Editor-Grade)
export function MenuItemWithIcon({
    active,
    destructive,
    disabled,
    icon: IconComponent,
    label,
    onClick,
    shortcut,
}: MenuItemWithIconProps) {
    return (
        <ContextMenuItem
            className={cn(
                // COMPACT PREMIUM METRICS
                'flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium',

                // DEFAULT STATE (Not Active/Destructive): Overriding ContextMenu accent defaults
                !active &&
                    !destructive && [
                        'focus:bg-surface-200 focus:text-surface-800',
                        'dark:focus:bg-surface-900 dark:focus:text-surface-50',
                    ],

                // DESTRUCTIVE STATE
                destructive && [
                    'text-destructive-500 font-bold',
                    // High contrast filled red on focus/hover
                    'focus:bg-destructive-500 focus:text-destructive-50',
                    'dark:focus:bg-destructive-500 dark:focus:text-destructive-50',
                ],

                // ACTIVE STATE (Solid Default Variant - "Black on Light / White on Dark")
                // Matches Button color="default" variant="solid"
                active && [
                    // Light Mode: Surface 950 (Blackish)
                    'bg-surface-950 text-surface-50',
                    // Dark Mode: Surface 50 (Whitish)
                    'dark:bg-surface-50 dark:text-surface-950',

                    // Hover/Focus state on the active item (Slightly lighter/darker)
                    'focus:bg-surface-900 focus:text-surface-50',
                    'dark:focus:bg-surface-200 dark:focus:text-surface-950',

                    // Remove default focus styles if they clash
                    'data-[highlighted]:bg-surface-900 data-[highlighted]:text-surface-50',
                    'dark:data-[highlighted]:bg-surface-200 dark:data-[highlighted]:text-surface-950',
                ],
            )}
            disabled={disabled}
            onClick={onClick}
        >
            {/* Icon size 14px (3.5) for compactness */}
            <IconComponent
                className={cn('size-3.5 shrink-0', destructive && 'text-current')}
                weight={active ? 'fill' : 'regular'}
            />
            <span className="flex-1">{label}</span>
            {shortcut && (
                <ContextMenuShortcut className={cn(active && 'text-current opacity-70')}>
                    {shortcut}
                </ContextMenuShortcut>
            )}
        </ContextMenuItem>
    );
}
