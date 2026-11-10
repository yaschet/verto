/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import * as React from 'react';
import { ToggleGroup as RadixToggleGroup } from 'radix-ui';
import { cn } from '@library/utils';

type GroupStyle = { size?: 'sm' | 'default' | 'lg' | 'icon'; variant?: 'default' | 'outline' };
const GroupStyleContext = React.createContext<GroupStyle>({});
type ToggleGroupProps = React.ComponentProps<typeof RadixToggleGroup.Root> & GroupStyle;
type ToggleGroupItemProps = React.ComponentProps<typeof RadixToggleGroup.Item> & GroupStyle;

function ToggleGroup({
    children,
    className,
    size = 'default',
    variant = 'default',
    ...props
}: ToggleGroupProps) {
    return (
        <RadixToggleGroup.Root
            className={cn(
                'flex w-fit items-center gap-0.5 rounded-xl bg-surface-100 p-0.5 dark:bg-surface-900',
                variant === 'outline' && 'border border-surface-200 dark:border-surface-800',
                className,
            )}
            {...props}
        >
            <GroupStyleContext.Provider value={{ size, variant }}>{children}</GroupStyleContext.Provider>
        </RadixToggleGroup.Root>
    );
}

function ToggleGroupItem({ className, size, variant, ...props }: ToggleGroupItemProps) {
    const group = React.useContext(GroupStyleContext);
    const resolvedSize = size ?? group.size ?? 'default';
    return (
        <RadixToggleGroup.Item
            className={cn(
                'inline-flex shrink-0 items-center justify-center gap-2 rounded-lg text-sm font-bold text-surface-600 outline-none transition-colors hover:bg-surface-200 focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-50 dark:text-surface-400 dark:hover:bg-surface-800',
                'data-[state=on]:bg-primary-950 data-[state=on]:text-primary-50 dark:data-[state=on]:bg-primary-50 dark:data-[state=on]:text-primary-950',
                resolvedSize === 'sm'
                    ? 'h-7 min-w-7 px-2.5'
                    : resolvedSize === 'lg'
                      ? 'h-9 min-w-9 px-4'
                      : resolvedSize === 'icon'
                        ? 'size-8'
                        : 'h-8 min-w-8 px-3',
                className,
            )}
            data-variant={variant ?? group.variant}
            {...props}
        />
    );
}

export { ToggleGroup, ToggleGroupItem, type ToggleGroupProps, type ToggleGroupItemProps };
