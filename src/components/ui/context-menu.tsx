/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import * as ContextMenuPrimitive from '@radix-ui/react-context-menu';
import { CheckIcon, ChevronRightIcon, DotFilledIcon } from '@radix-ui/react-icons';
import * as React from 'react';
import { cn } from '@library/utils';

const ContextMenu = ContextMenuPrimitive.Root;

const ContextMenuTrigger = ContextMenuPrimitive.Trigger;

const ContextMenuGroup = ContextMenuPrimitive.Group;

const ContextMenuPortal = ContextMenuPrimitive.Portal;

const ContextMenuSub = ContextMenuPrimitive.Sub;

const ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup;

const ContextMenuSubTrigger = React.forwardRef<
    React.ComponentRef<typeof ContextMenuPrimitive.SubTrigger>,
    React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubTrigger> & {
        inset?: boolean;
    } & { className?: string }
>(({ children, className, inset, ...props }, ref) => (
    <ContextMenuPrimitive.SubTrigger
        ref={ref}
        className={cn(
            'focus:bg-accent focus:text-accent-foreground dark:focus:bg-surface-900 dark:focus:text-surface-50 data-[state=open]:bg-accent data-[state=open]:text-accent-foreground dark:data-[state=open]:bg-surface-900 dark:data-[state=open]:text-surface-50 flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-none select-none',
            inset && 'pl-8',
            className,
        )}
        {...props}
    >
        {children}
        <ChevronRightIcon className="ml-auto size-4" />
    </ContextMenuPrimitive.SubTrigger>
));
ContextMenuSubTrigger.displayName = ContextMenuPrimitive.SubTrigger.displayName;

const ContextMenuSubContent = React.forwardRef<
    React.ComponentRef<typeof ContextMenuPrimitive.SubContent>,
    React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubContent> & { className?: string }
>(({ className, ...props }, ref) => (
    <ContextMenuPrimitive.SubContent
        ref={ref}
        className={cn(
            'border-border bg-popover text-popover-foreground z-50 min-w-[8rem] overflow-hidden rounded-3xl border p-1 shadow-sm',
            // Light mode: soft Flat UI shadow
            'shadow-[0_2px_24px_rgba(0,0,0,0.08),0_0_0_0.5px_rgba(0,0,0,0.04)]',
            // Dark mode: deep black with soft Flat UI shadows
            'dark:border-surface-800 dark:bg-surface-950 dark:text-surface-50',
            'dark:shadow-[0_4px_32px_rgba(0,0,0,0.32),0_2px_16px_rgba(0,0,0,0.16),0_0_0_0.5px_rgba(255,255,255,0.03)]',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
            className,
        )}
        {...props}
    />
));
ContextMenuSubContent.displayName = ContextMenuPrimitive.SubContent.displayName;

const ContextMenuContent = React.forwardRef<
    React.ComponentRef<typeof ContextMenuPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Content> & { className?: string }
>(({ className, ...props }, ref) => (
    <ContextMenuPrimitive.Portal>
        <ContextMenuPrimitive.Content
            ref={ref}
            className={cn(
                'border-border bg-popover text-popover-foreground z-50 min-w-[8rem] overflow-hidden rounded-3xl border p-1 shadow-lg',
                // Light mode: soft Flat UI shadow
                'shadow-[0_2px_24px_rgba(0,0,0,0.08),0_0_0_0.5px_rgba(0,0,0,0.04)]',
                // Dark mode: deep black with soft Flat UI shadows
                'dark:border-surface-800 dark:bg-surface-950 dark:text-surface-50',
                'dark:shadow-[0_4px_32px_rgba(0,0,0,0.32),0_2px_16px_rgba(0,0,0,0.16),0_0_0_0.5px_rgba(255,255,255,0.03)]',
                'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
                className,
            )}
            {...props}
        />
    </ContextMenuPrimitive.Portal>
));
ContextMenuContent.displayName = ContextMenuPrimitive.Content.displayName;

const ContextMenuItem = React.forwardRef<
    React.ComponentRef<typeof ContextMenuPrimitive.Item>,
    React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Item> & {
        inset?: boolean;
    } & { className?: string }
>(({ className, inset, ...props }, ref) => (
    <ContextMenuPrimitive.Item
        ref={ref}
        className={cn(
            'focus:bg-accent focus:text-accent-foreground dark:focus:bg-surface-900 dark:focus:text-surface-50 relative flex cursor-default items-center rounded-sm px-3.5 py-2.5 pr-8 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
            inset && 'pl-8',
            className,
        )}
        {...props}
    />
));
ContextMenuItem.displayName = ContextMenuPrimitive.Item.displayName;

const ContextMenuCheckboxItem = React.forwardRef<
    React.ComponentRef<typeof ContextMenuPrimitive.CheckboxItem>,
    React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.CheckboxItem> & {
        className?: string;
        checked?: boolean;
    }
>(({ checked, children, className, ...props }, ref) => (
    <ContextMenuPrimitive.CheckboxItem
        ref={ref}
        checked={checked}
        className={cn(
            'focus:bg-accent focus:text-accent-foreground dark:focus:bg-surface-900 dark:focus:text-surface-50 relative flex cursor-default items-center rounded-sm py-1.5 pr-2 pl-8 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
            className,
        )}
        {...props}
    >
        <span className="absolute left-2 flex size-3.5 items-center justify-center">
            <ContextMenuPrimitive.ItemIndicator>
                <CheckIcon className="size-4" />
            </ContextMenuPrimitive.ItemIndicator>
        </span>
        {children}
    </ContextMenuPrimitive.CheckboxItem>
));
ContextMenuCheckboxItem.displayName = ContextMenuPrimitive.CheckboxItem.displayName;

const ContextMenuRadioItem = React.forwardRef<
    React.ComponentRef<typeof ContextMenuPrimitive.RadioItem>,
    React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.RadioItem> & { className?: string }
>(({ children, className, ...props }, ref) => (
    <ContextMenuPrimitive.RadioItem
        ref={ref}
        className={cn(
            'focus:bg-accent focus:text-accent-foreground dark:focus:bg-surface-900 dark:focus:text-surface-50 relative flex cursor-default items-center rounded-sm py-1.5 pr-2 pl-8 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
            className,
        )}
        {...props}
    >
        <span className="absolute left-2 flex size-3.5 items-center justify-center">
            <ContextMenuPrimitive.ItemIndicator>
                <DotFilledIcon className="size-4 fill-current" />
            </ContextMenuPrimitive.ItemIndicator>
        </span>
        {children}
    </ContextMenuPrimitive.RadioItem>
));
ContextMenuRadioItem.displayName = ContextMenuPrimitive.RadioItem.displayName;

const ContextMenuLabel = React.forwardRef<
    React.ComponentRef<typeof ContextMenuPrimitive.Label>,
    React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Label> & {
        inset?: boolean;
    } & { className?: string }
>(({ className, inset, ...props }, ref) => (
    <ContextMenuPrimitive.Label
        ref={ref}
        className={cn('text-foreground px-2 py-1.5 text-sm font-semibold', inset && 'pl-8', className)}
        {...props}
    />
));
ContextMenuLabel.displayName = ContextMenuPrimitive.Label.displayName;

const ContextMenuSeparator = React.forwardRef<
    React.ComponentRef<typeof ContextMenuPrimitive.Separator>,
    React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Separator> & { className?: string }
>(({ className, ...props }, ref) => (
    <ContextMenuPrimitive.Separator
        ref={ref}
        className={cn('bg-border dark:bg-surface-800 -mx-1 my-1 h-px', className)}
        {...props}
    />
));
ContextMenuSeparator.displayName = ContextMenuPrimitive.Separator.displayName;

function ContextMenuShortcut({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
    return <span className={cn('text-muted ml-auto text-xs tracking-widest', className)} {...props} />;
}
ContextMenuShortcut.displayName = 'ContextMenuShortcut';

export {
    ContextMenu,
    ContextMenuTrigger,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuCheckboxItem,
    ContextMenuRadioItem,
    ContextMenuLabel,
    ContextMenuSeparator,
    ContextMenuShortcut,
    ContextMenuGroup,
    ContextMenuPortal,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuRadioGroup,
};
