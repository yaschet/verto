/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { MagnifyingGlassIcon } from '@phosphor-icons/react';
import { type DialogProps } from '@radix-ui/react-dialog';
import { Command as CommandPrimitive } from 'cmdk';
import * as React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/library/utils';

const Command = React.forwardRef<
    React.ComponentRef<typeof CommandPrimitive>,
    React.ComponentPropsWithoutRef<typeof CommandPrimitive> & { className?: string }
>(({ className, ...props }, ref) => (
    <CommandPrimitive
        ref={ref}
        className={cn(
            'bg-popover text-popover-foreground flex h-full w-full flex-col overflow-hidden rounded-3xl shadow-sm',
            className,
        )}
        {...props}
    />
));
Command.displayName = CommandPrimitive.displayName;

type CommandDialogProps = {} & DialogProps;

function CommandDialog({ children, ...props }: CommandDialogProps) {
    return (
        <Dialog {...props}>
            <DialogContent className="w-auto overflow-hidden p-0 shadow-none">
                <Command
                    className={cn(
                        'rounded-3xl', // Add rounded-3xl to the Command component
                        '[&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]]:px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5',
                        '[&_[cmdk-item]]:rounded-xl', // Add rounded-xl to the cmdk-item elements
                    )}
                >
                    {children}
                </Command>
            </DialogContent>
        </Dialog>
    );
}

const CommandInput = React.forwardRef<
    React.ComponentRef<typeof CommandPrimitive.Input>,
    React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input> & { className?: string }
>(({ className, ...props }, ref) => (
    <div className="border-border flex items-center border-b px-3" cmdk-input-wrapper="">
        <MagnifyingGlassIcon
            className="text-muted mr-2 h-4 w-4 shrink-0"
            color="currentColor"
            weight="duotone"
        />
        <CommandPrimitive.Input
            ref={ref}
            className={cn(
                'placeholder:text-muted-foreground flex h-11 w-full rounded-3xl bg-transparent py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50',
                className,
            )}
            {...props}
        />
    </div>
));

CommandInput.displayName = CommandPrimitive.Input.displayName;

const CommandList = React.forwardRef<
    React.ComponentRef<typeof CommandPrimitive.List>,
    React.ComponentPropsWithoutRef<typeof CommandPrimitive.List> & { className?: string }
>(({ className, ...props }, ref) => (
    <CommandPrimitive.List
        ref={ref}
        className={cn('max-h-[300px] overflow-x-hidden overflow-y-auto', className)}
        {...props}
    />
));

CommandList.displayName = CommandPrimitive.List.displayName;

const CommandEmpty = React.forwardRef<
    React.ComponentRef<typeof CommandPrimitive.Empty>,
    React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => <CommandPrimitive.Empty ref={ref} className="py-6 text-center text-sm" {...props} />);

CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

const CommandGroup = React.forwardRef<
    React.ComponentRef<typeof CommandPrimitive.Group>,
    React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group> & { className?: string }
>(({ className, ...props }, ref) => (
    <CommandPrimitive.Group
        ref={ref}
        className={cn(
            'text-foreground [&_[cmdk-group-heading]]:text-muted-foreground overflow-hidden p-3 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium',
            className,
        )}
        {...props}
    />
));

CommandGroup.displayName = CommandPrimitive.Group.displayName;

const CommandSeparator = React.forwardRef<
    React.ComponentRef<typeof CommandPrimitive.Separator>,
    React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator> & { className?: string }
>(({ className, ...props }, ref) => (
    <CommandPrimitive.Separator
        ref={ref}
        className={cn('bg-surface-200 dark:bg-surface-800 -mx-1 h-px', className)}
        {...props}
    />
));
CommandSeparator.displayName = CommandPrimitive.Separator.displayName;

const CommandItem = React.forwardRef<
    React.ComponentRef<typeof CommandPrimitive.Item>,
    React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item> & { className?: string }
>(({ className, ...props }, ref) => (
    <CommandPrimitive.Item
        ref={ref}
        className={cn(
            // Layout and positioning
            'relative flex cursor-default items-center rounded-md text-nowrap select-none',

            // Padding and spacing
            'px-5 py-2.5',

            // Text styling
            'text-sm font-medium outline-none',

            // State-based styling
            'pointer-events-auto cursor-pointer',
            'data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
            "data-[selected='true']:bg-surface-100 data-[selected=true]:text-foreground dark:data-[selected=true]:bg-surface-900 dark:data-[selected=true]:text-foreground",

            // Additional className prop
            className,
        )}
        {...props}
    />
));

CommandItem.displayName = CommandPrimitive.Item.displayName;

function CommandShortcut({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
    return (
        <span className={cn('text-muted-foreground ml-auto text-xs tracking-widest', className)} {...props} />
    );
}
CommandShortcut.displayName = 'CommandShortcut';

export {
    Command,
    CommandDialog,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandShortcut,
    CommandSeparator,
};
