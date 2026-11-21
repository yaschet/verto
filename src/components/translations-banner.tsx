/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { ArrowClockwiseIcon, XIcon } from '@phosphor-icons/react';
import { Button } from '@components/ui/button';
import { cn } from '@library/utils';

type TranslationsBannerProps = {
    count: number;
    onRefresh: () => void;
    onDismiss: () => void;
    className?: string;
};

/**
 * Non-intrusive banner for new translations availability.
 * Appears at top of translations table when new items are created.
 * Follows Vercel deployments table UX pattern.
 */
export function TranslationsBanner({ className, count, onDismiss, onRefresh }: TranslationsBannerProps) {
    if (count === 0) return null;

    return (
        <div
            className={cn(
                'flex w-full items-center justify-between gap-3 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 backdrop-blur-sm',
                'animate-in fade-in slide-in-from-top-2 duration-300',
                className,
            )}
        >
            <div className="flex items-center gap-2">
                <div className="flex size-2 items-center justify-center">
                    <div className="size-2 animate-pulse rounded-full bg-blue-500" />
                </div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    {count === 1 ? '1 new translation available' : `${count} new translations available`}
                </p>
            </div>

            <div className="flex items-center gap-2">
                <Button
                    className="h-8 gap-2 text-blue-700 hover:bg-blue-500/20 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
                    size="sm"
                    variant="plain"
                    onClick={onRefresh}
                >
                    <ArrowClockwiseIcon className="size-4" weight="bold" />
                    <span className="text-xs font-semibold">Refresh</span>
                </Button>
                <Button
                    className="size-8 p-0 text-blue-700 hover:bg-blue-500/20 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
                    size="sm"
                    variant="plain"
                    onClick={onDismiss}
                >
                    <XIcon className="size-4" weight="bold" />
                </Button>
            </div>
        </div>
    );
}
