/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { ArrowsDownUpIcon, type Icon, SortAscendingIcon, SortDescendingIcon } from '@phosphor-icons/react';
import React, { Fragment } from 'react';
import { Tooltip, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Skeleton } from '@components/ui/skeleton';
import { TooltipTrigger } from '@components/ui/tooltip';
import { cn } from '@library/utils';
import type { Column, Table } from '@tanstack/react-table';
import type { ReactNode } from 'react';

export function SectionTitle({
    children,
    className,
    description,
    icon,
    isLoading,
    title,
}: React.PropsWithChildren<{
    icon: Icon;
    title: string | ReactNode;
    description?: string | ReactNode;
    isLoading?: boolean;
    className?: string;
}>) {
    const IconComponent: Icon = icon;

    if (isLoading) {
        return (
            <div className={cn('flex w-full items-center justify-between gap-3', className)}>
                <div className="flex w-full items-center justify-start gap-3">
                    <Skeleton className="bg-surface-3 size-8 rounded-xl" innerClassName="via-surface-4/50" />
                    <div className="flex flex-col items-start justify-start gap-2">
                        <Skeleton
                            className="bg-surface-3 h-6 w-24 rounded-xl"
                            innerClassName="via-surface-4/50"
                        />
                        {description && (
                            <Skeleton
                                className="bg-surface-3 h-4 w-full rounded-xl"
                                innerClassName="via-surface-4/50"
                            />
                        )}
                    </div>
                </div>

                {/* Buttons */}
                {children && (
                    <div className="flex flex-row items-center justify-start gap-2">
                        <Skeleton
                            className="bg-surface-3 h-8 w-8 rounded-xl"
                            innerClassName="via-surface-4/50"
                        />
                        <Skeleton
                            className="bg-surface-3 h-8 w-8 rounded-xl"
                            innerClassName="via-surface-4/50"
                        />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            className={cn(
                'relative flex w-full max-w-full flex-row items-center justify-between gap-3',
                className,
            )}
        >
            <div className="flex flex-row items-center justify-start gap-3">
                <div className="border-border dark:bg-surface-950 flex aspect-square h-10 w-auto items-center justify-center rounded-3xl border bg-white">
                    <IconComponent
                        className="text-surface-600 dark:text-surface-400 size-5"
                        color="currentColor"
                        weight="duotone"
                    />
                </div>
                <div className="flex flex-col items-start justify-start gap-0">
                    <h1 className="text-surface-800 dark:text-surface-200 text-xl font-extrabold">{title}</h1>
                    {description && (
                        <p className="text-surface-600 dark:text-surface-400 text-sm">{description}</p>
                    )}
                </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-row items-center justify-start gap-2">
                {/* Children of the Component */}
                {children}
            </div>
        </div>
    );
}

type TableHeaderProps<TData, TValue> = {
    column?: Column<TData, TValue>;
    table?: Table<TData>;
    children: string | ReactNode;
    className?: string;
};

export function TableHeader<TData, TValue>({ children, className, column }: TableHeaderProps<TData, TValue>) {
    if (column?.id === 'actions') {
        return (
            <div
                className={cn(
                    'text-surface-400 dark:text-surface-500 flex w-full items-center justify-start gap-2 text-start font-bold',
                    className,
                )}
            >
                {children}
            </div>
        );
    }

    const handleSortingChange = () => {
        if (!column?.getCanSort()) return;

        // Context-aware sort defaults:
        // - Timestamp columns (created_at, updated_at): Default to 'desc' (newest first)
        // - Text/name columns: Default to 'asc' (alphabetical)
        // - Status columns: Default to 'asc' (pending → completed)
        const isTimestampColumn = ['created_at', 'updated_at'].includes(column.id);
        const defaultSortDirection = isTimestampColumn ? 'desc' : 'asc';

        const currentSort = column.getIsSorted() as 'asc' | 'desc' | false;

        if (!currentSort) {
            // First click: Apply context-aware default
            column.toggleSorting(defaultSortDirection === 'desc');
        } else {
            // Subsequent clicks: Toggle between asc ↔ desc
            // If currently ascending, switch to descending (true), and vice versa
            column.toggleSorting(currentSort === 'asc');
        }

        // Note: column.toggleSorting() automatically triggers the table's onSortingChange callback,
        // which handles URL updates via router.push() in translations-table.tsx
    };

    return (
        <TooltipProvider>
            <Tooltip delayDuration={50}>
                <div
                    className={cn(
                        `text-surface-400 hover:text-surface-500 dark:text-surface-500 dark:hover:text-surface-400 flex w-full items-center justify-between gap-2 font-bold ${column?.getCanSort() ? 'cursor-pointer' : 'cursor-default'}`,
                        className,
                    )}
                    onClick={handleSortingChange}
                >
                    {children}
                    <TooltipTrigger>
                        {column?.getCanSort() &&
                            (column.getIsSorted() ? (
                                column.getIsSorted() === 'asc' ? (
                                    <SortAscendingIcon className="size-5" weight="duotone" />
                                ) : (
                                    <SortDescendingIcon className="size-5" weight="duotone" />
                                )
                            ) : (
                                <ArrowsDownUpIcon className="size-5" weight="duotone" />
                            ))}
                    </TooltipTrigger>
                </div>
                <TooltipContent>
                    {column?.getCanSort() ? (
                        <span>
                            {column?.getIsSorted() === 'asc' ? (
                                <Fragment>
                                    Sorted in <b>ascending</b> order.
                                </Fragment>
                            ) : column?.getIsSorted() === 'desc' ? (
                                <Fragment>
                                    Sorted in <b>descending</b> order.
                                </Fragment>
                            ) : (
                                <Fragment>
                                    Click to sort by{' '}
                                    {typeof children === 'string'
                                        ? children.toString().toLowerCase()
                                        : 'this column'}
                                    .
                                </Fragment>
                            )}
                        </span>
                    ) : (
                        <span>This column cannot be sorted.</span>
                    )}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
