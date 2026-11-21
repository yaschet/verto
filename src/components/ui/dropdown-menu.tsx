/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { CaretRightIcon, CheckIcon } from '@phosphor-icons/react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { cva } from 'class-variance-authority';
import * as React from 'react';
import { Button, type ButtonProps } from '@components/ui/button';
import { cn } from '@library/utils';
import type { JSX } from 'react';

type DropdownMenuSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const DropdownMenuContext = React.createContext<{ size: DropdownMenuSize }>({
    size: 'md',
});

// Hook to get dropdown menu size from context
export const useDropdownMenuSize = () => {
    return React.useContext(DropdownMenuContext).size;
};

// DropdownMenu component that accepts size prop and provides it via context
const DropdownMenu = React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Root> & {
        size?: DropdownMenuSize;
    }
>(({ size = 'md', ...props }, _ref) => {
    return (
        <DropdownMenuContext.Provider value={{ size }}>
            <DropdownMenuPrimitive.Root {...props} />
        </DropdownMenuContext.Provider>
    );
});

DropdownMenu.displayName = DropdownMenuPrimitive.Root.displayName;

// Wrapper for DropdownMenuTrigger that can sync size with menu
const DropdownMenuTrigger = React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Trigger> & {
        size?: DropdownMenuSize;
    }
>(({ size: propSize, ...props }, ref) => {
    const contextSize = React.useContext(DropdownMenuContext).size;
    const size = propSize ?? contextSize;

    // If asChild is used, we can't directly control the child's size
    // The child component should use useDropdownMenuSize() hook or match size manually
    return <DropdownMenuPrimitive.Trigger ref={ref} {...props} data-size={size} />;
});

DropdownMenuTrigger.displayName = DropdownMenuPrimitive.Trigger.displayName;

// Helper component: DropdownMenuTriggerButton that automatically syncs button size with menu size
export const DropdownMenuTriggerButton = React.forwardRef<
    HTMLButtonElement,
    ButtonProps & { asChild?: boolean }
>(({ size: propSize, ...props }, ref) => {
    const menuSize = useDropdownMenuSize();
    const size = propSize ?? menuSize;

    return (
        <DropdownMenuTrigger asChild>
            <Button ref={ref} size={size} {...props} />
        </DropdownMenuTrigger>
    );
});

DropdownMenuTriggerButton.displayName = 'DropdownMenuTriggerButton';

const DropdownMenuGroup = DropdownMenuPrimitive.Group;

const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

const DropdownMenuSub = DropdownMenuPrimitive.Sub;

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const dropdownMenuItemVariants = cva(
    'relative flex size-auto flex-row items-center justify-start gap-2 whitespace-nowrap cursor-pointer outline-none select-none transition-transform duration-75 ease-in-out active:scale-[0.95] data-[disabled]:pointer-events-none data-[disabled]:opacity-50 flex-1 focus:bg-surface-200 focus:text-surface-800 dark:focus:bg-surface-900 dark:focus:text-surface-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
    {
        variants: {
            size: {
                // Border radius follows nesting: items are 1/2 of menu radius
                xs: 'px-2.5 py-1 text-xs font-medium rounded-lg [&_svg]:size-3.5',
                sm: 'px-3 py-1.5 text-xs font-medium rounded-xl [&_svg]:size-4',
                md: 'px-4 py-2 text-sm font-medium rounded-xl [&_svg]:size-5',
                lg: 'px-5 py-2.5 text-sm font-medium rounded-2xl [&_svg]:size-5',
                xl: 'px-6 py-3 text-lg font-medium rounded-[1.25rem] [&_svg]:size-6',
            },
            inset: {
                true: 'pl-8',
                false: '',
            },
        },
        defaultVariants: {
            size: 'md',
            inset: false,
        },
    },
);

const DropdownMenuSubTrigger = React.forwardRef<
    React.ComponentRef<typeof DropdownMenuPrimitive.SubTrigger>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
        inset?: boolean;
    } & { className?: string }
>(({ children, className, inset, ...props }, ref) => {
    const { size } = React.useContext(DropdownMenuContext);
    return (
        <DropdownMenuPrimitive.SubTrigger
            ref={ref}
            className={cn(
                dropdownMenuItemVariants({ size, inset }),
                // Nested items: 1/4 of menu radius
                size === 'xs' && 'rounded-md',
                size === 'sm' && 'rounded-lg',
                (size === 'md' || !size) && 'rounded-lg',
                size === 'lg' && 'rounded-xl',
                size === 'xl' && 'rounded-xl',
                className,
            )}
            {...props}
        >
            {children}
            <CaretRightIcon
                className={cn(
                    'ml-auto',
                    size === 'xs' && 'size-3.5',
                    size === 'sm' && 'size-4',
                    (size === 'md' || !size) && 'size-5',
                    size === 'lg' && 'size-5',
                    size === 'xl' && 'size-6',
                )}
                weight="duotone"
            />
        </DropdownMenuPrimitive.SubTrigger>
    );
});

DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;

const dropdownMenuContentVariants = cva(
    'border-border bg-surface-2 text-foreground shadow-sm z-50 mt-2.5 flex min-w-[8rem] flex-col overflow-hidden border',
    {
        variants: {
            size: {
                xs: 'p-1.5 rounded-xl',
                sm: 'p-2 rounded-2xl',
                md: 'p-3 rounded-3xl',
                lg: 'p-4 rounded-[2rem]',
                xl: 'p-5 rounded-[2.5rem]',
            },
        },
        defaultVariants: {
            size: 'md',
        },
    },
);

const DropdownMenuSubContent = React.forwardRef<
    React.ComponentRef<typeof DropdownMenuPrimitive.SubContent>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent> & { className?: string }
>(({ className, ...props }, ref) => {
    const { size } = React.useContext(DropdownMenuContext);
    return (
        <DropdownMenuPrimitive.SubContent
            ref={ref}
            className={cn(
                dropdownMenuContentVariants({ size }),
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
    );
});

DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;

const DropdownMenuContent = React.forwardRef<
    React.ComponentRef<typeof DropdownMenuPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content> & {
        className?: string;
        sideOffset?: number;
        allowOverflow?: boolean;
        size?: DropdownMenuSize;
    }
>(({ allowOverflow = false, className, sideOffset = 4, size: propSize, ...props }, ref) => {
    // Try to get size from context first, fallback to prop or default
    const contextSize = React.useContext(DropdownMenuContext).size;
    const size = propSize ?? contextSize ?? 'md';

    return (
        <DropdownMenuPrimitive.Portal>
            <DropdownMenuContext.Provider value={{ size }}>
                <DropdownMenuPrimitive.Content
                    ref={ref}
                    className={cn(
                        dropdownMenuContentVariants({ size }),
                        'min-w-32 shadow-lg', // Override shadow and min-width from base variants if needed or add to base
                        !allowOverflow && 'overflow-hidden',
                        // Dark mode: deep black with Apple-style shadows
                        'dark:border-surface-800 dark:bg-surface-950 dark:text-surface-50',
                        'dark:shadow-[0_4px_16px_rgba(0,0,0,0.48),0_0_0_1px_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.24)]',
                        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
                        className,
                    )}
                    sideOffset={sideOffset}
                    {...props}
                />
            </DropdownMenuContext.Provider>
        </DropdownMenuPrimitive.Portal>
    );
});

DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

const DropdownMenuItem = React.forwardRef<
    React.ComponentRef<typeof DropdownMenuPrimitive.Item>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
        inset?: boolean;
        className?: string;
        asChild?: boolean;
    }
>(({ className, inset, ...props }, ref) => {
    const { size } = React.useContext(DropdownMenuContext);
    return (
        <DropdownMenuPrimitive.Item
            ref={ref}
            className={cn(dropdownMenuItemVariants({ size, inset }), className)}
            {...props}
        />
    );
});

DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

const DropdownMenuCheckboxItem = React.forwardRef<
    React.ComponentRef<typeof DropdownMenuPrimitive.CheckboxItem>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem> & {
        className?: string;
        checked?: boolean;
    }
>(({ checked, children, className, ...props }, ref): JSX.Element => {
    const { size } = React.useContext(DropdownMenuContext);
    return (
        <DropdownMenuPrimitive.CheckboxItem
            ref={ref}
            checked={checked}
            className={cn(dropdownMenuItemVariants({ size }), className)}
            {...props}
        >
            <span
                className={cn(
                    'flex items-center justify-center',
                    size === 'xs' && 'size-3',
                    size === 'sm' && 'size-3',
                    (size === 'md' || !size) && 'size-3.5',
                    size === 'lg' && 'size-4',
                    size === 'xl' && 'size-4',
                )}
            >
                <DropdownMenuPrimitive.ItemIndicator>
                    <CheckIcon
                        className={cn(
                            size === 'xs' && 'size-2.5',
                            size === 'sm' && 'size-3',
                            (size === 'md' || !size) && 'size-3.5',
                            size === 'lg' && 'size-4',
                            size === 'xl' && 'size-4',
                        )}
                        weight="duotone"
                    />
                </DropdownMenuPrimitive.ItemIndicator>
            </span>
            {children}
        </DropdownMenuPrimitive.CheckboxItem>
    );
});

DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;

const DropdownMenuRadioItem = React.forwardRef<
    React.ComponentRef<typeof DropdownMenuPrimitive.RadioItem>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem> & { className?: string }
>(({ children, className, ...props }, ref) => {
    const { size } = React.useContext(DropdownMenuContext);
    return (
        <DropdownMenuPrimitive.RadioItem
            ref={ref}
            className={cn(
                dropdownMenuItemVariants({ size }),
                size === 'xs' && 'pl-7',
                size === 'sm' && 'pl-7.5',
                (size === 'md' || !size) && 'pl-9',
                size === 'lg' && 'pl-10',
                size === 'xl' && 'pl-11',
                className,
            )}
            {...props}
        >
            <DropdownMenuPrimitive.ItemIndicator
                className={cn(
                    'text-primary absolute top-0 flex h-full items-center justify-center',
                    size === 'xs' && 'left-2',
                    size === 'sm' && 'left-2',
                    (size === 'md' || !size) && 'left-2.5',
                    size === 'lg' && 'left-3',
                    size === 'xl' && 'left-3',
                )}
            >
                <CheckIcon
                    className={cn(
                        'fill-current',
                        size === 'xs' && 'size-2.5',
                        size === 'sm' && 'size-3',
                        (size === 'md' || !size) && 'size-3.5',
                        size === 'lg' && 'size-4',
                        size === 'xl' && 'size-4',
                    )}
                    color="currentColor"
                    weight="bold"
                />
            </DropdownMenuPrimitive.ItemIndicator>
            <span className="flex-1">{children}</span>
        </DropdownMenuPrimitive.RadioItem>
    );
});
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

const DropdownMenuLabel = React.forwardRef<
    React.ComponentRef<typeof DropdownMenuPrimitive.Label>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
        inset?: boolean;
        className?: string;
    }
>(({ className, inset, ...props }, ref) => {
    const { size } = React.useContext(DropdownMenuContext);
    return (
        <DropdownMenuPrimitive.Label
            ref={ref}
            className={cn(
                'dark:text-surface-200 font-semibold',
                size === 'xs'
                    ? 'px-1.5 py-0.5 text-xs'
                    : size === 'sm'
                      ? 'px-2 py-1 text-xs'
                      : size === 'lg'
                        ? 'px-3 py-2 text-base'
                        : size === 'xl'
                          ? 'px-4 py-2.5 text-lg'
                          : 'px-2 py-1.5 text-sm',
                inset && 'pl-8',
                className,
            )}
            {...props}
        />
    );
});
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

const DropdownMenuSeparator = React.forwardRef<
    React.ComponentRef<typeof DropdownMenuPrimitive.Separator>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator> & { className?: string }
>(({ className, ...props }, ref) => {
    const { size } = React.useContext(DropdownMenuContext);
    return (
        <DropdownMenuPrimitive.Separator
            ref={ref}
            className={cn(
                'bg-border dark:bg-surface-800 h-px',
                size === 'xs'
                    ? '-mx-1.5 my-1.5'
                    : size === 'sm'
                      ? '-mx-2 my-2'
                      : size === 'lg'
                        ? '-mx-3 my-3'
                        : size === 'xl'
                          ? '-mx-4 my-4'
                          : '-mx-2.5 my-2.5',
                className,
            )}
            {...props}
        />
    );
});
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

function DropdownMenuShortcut({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
    return (
        <span
            className={cn(
                'dark:text-surface-400 ml-auto text-xs tracking-widest opacity-60 dark:opacity-80',
                className,
            )}
            {...props}
        />
    );
}
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut';

export {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuCheckboxItem,
    DropdownMenuRadioItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuGroup,
    DropdownMenuPortal,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuRadioGroup,
};
