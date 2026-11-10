/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * HeadingSelect Component
 * Dropdown for selecting paragraph or heading levels
 */

'use client';

import {
    type Icon,
    TextHIcon,
    TextHFiveIcon,
    TextHFourIcon,
    TextHOneIcon,
    TextHSixIcon,
    TextHThreeIcon,
    TextHTwoIcon,
} from '@phosphor-icons/react';
import { memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/library/utils';
import type { Editor } from '@tiptap/react';

type HeadingSelectProps = {
    editor: Editor;
    currentHeading: string;
};

const HEADING_ICONS: Record<string, Icon> = {
    paragraph: TextHIcon,
    '1': TextHOneIcon,
    '2': TextHTwoIcon,
    '3': TextHThreeIcon,
    '4': TextHFourIcon,
    '5': TextHFiveIcon,
    '6': TextHSixIcon,
};

const HEADING_OPTIONS = [
    { value: '1', label: 'Heading 1', icon: TextHOneIcon },
    { value: '2', label: 'Heading 2', icon: TextHTwoIcon },
    { value: '3', label: 'Heading 3', icon: TextHThreeIcon },
    { value: '4', label: 'Heading 4', icon: TextHFourIcon },
    { value: '5', label: 'Heading 5', icon: TextHFiveIcon },
    { value: '6', label: 'Heading 6', icon: TextHSixIcon },
];

export const HeadingSelect = memo(function HeadingSelect({ currentHeading, editor }: HeadingSelectProps) {
    const handleSelect = useCallback(
        (value: string) => {
            // If clicking the active heading, toggle it off (set to paragraph)
            if (value === currentHeading) {
                editor.chain().focus().setParagraph().run();
                return;
            }

            // Otherwise set the new heading level
            const level = parseInt(value, 10) as 1 | 2 | 3 | 4 | 5 | 6;
            editor.chain().focus().setHeading({ level }).run();
        },
        [editor, currentHeading],
    );

    const isHeading = currentHeading !== 'paragraph';
    const CurrentIcon = HEADING_ICONS[currentHeading] || TextHIcon;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    className={cn(
                        'h-8 w-8 p-0 transition-all duration-150',
                        'hover:scale-105 active:scale-95',
                        // Ensure icon is centered and properly sized
                        'flex items-center justify-center',
                    )}
                    color={isHeading ? 'primary' : 'default'}
                    size="sm"
                    tooltipContent={isHeading ? `Heading ${currentHeading}` : 'Heading'}
                    variant={isHeading ? 'solid' : 'soft'}
                >
                    <CurrentIcon className="size-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                {HEADING_OPTIONS.map((option) => {
                    const isActive = currentHeading === option.value;
                    return (
                        <DropdownMenuItem
                            key={option.value}
                            className={cn(
                                'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                                isActive
                                    ? 'bg-primary-50 text-primary-900 dark:bg-primary-900/40 dark:text-primary-100'
                                    : 'text-surface-700 hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-surface-800',
                                'cursor-pointer outline-none',
                            )}
                            onClick={() => handleSelect(option.value)}
                        >
                            <option.icon
                                className={cn(
                                    'size-4 shrink-0',
                                    isActive
                                        ? 'text-primary-600 dark:text-primary-400'
                                        : 'text-surface-400 dark:text-surface-500',
                                )}
                                weight={isActive ? 'bold' : 'regular'}
                            />

                            <span className="flex-1 leading-none font-medium">{option.label}</span>

                            {isActive && (
                                <div className="bg-primary-500 dark:bg-primary-400 size-1.5 rounded-full shadow-sm" />
                            )}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
});
