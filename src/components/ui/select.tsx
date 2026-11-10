/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { CaretDownIcon, CaretUpIcon, CaretUpDownIcon, CheckIcon } from '@phosphor-icons/react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { cva } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@library/utils';

type SelectSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SelectContext = React.createContext<{ size: SelectSize }>({
    size: 'md',
});

const Select: React.FC<React.ComponentProps<typeof SelectPrimitive.Root> & { size?: SelectSize }> = ({
    children,
    size = 'md',
    ...props
}) => (
    <SelectContext.Provider value={{ size }}>
        <SelectPrimitive.Root {...props}>{children}</SelectPrimitive.Root>
    </SelectContext.Provider>
);

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

const selectTriggerVariants = cva(
    'flex w-full items-center justify-between whitespace-nowrap bg-surface-100 shadow-none ring-offset-background placeholder:text-muted hover:bg-surface-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-surface-900 dark:hover:bg-surface-800 [&>span]:line-clamp-1',
    {
        variants: {
            size: {
                xs: 'h-7 rounded-lg py-1 pl-2.5 pr-1.5 text-xs',
                sm: 'h-8 rounded-lg py-1.5 pl-3 pr-2 text-xs',
                md: 'h-9 rounded-xl py-2 pl-4 pr-2 text-sm',
                lg: 'h-10 rounded-xl py-2.5 pl-5 pr-3 text-sm',
                xl: 'h-11 rounded-2xl py-3 pl-6 pr-3 text-lg',
            },
        },
        defaultVariants: {
            size: 'md',
        },
    },
);

const SelectTrigger = React.forwardRef<
    React.ComponentRef<typeof SelectPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & { className?: string; size?: SelectSize }
>(({ children, className, size, ...props }, ref) => {
    const { size: contextSize } = React.useContext(SelectContext);
    const resolvedSize = size || contextSize;

    return (
        <SelectPrimitive.Trigger
            ref={ref}
            className={cn(selectTriggerVariants({ size: resolvedSize }), className)}
            {...props}
        >
            {children}
            <SelectPrimitive.Icon asChild>
                <CaretUpDownIcon
                    className={cn(
                        'opacity-50',
                        resolvedSize === 'xs' && 'size-3',
                        resolvedSize === 'sm' && 'size-3.5',
                        (resolvedSize === 'md' || !resolvedSize) && 'size-4',
                        resolvedSize === 'lg' && 'size-4',
                        resolvedSize === 'xl' && 'size-5',
                    )}
                    weight="bold"
                />
            </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
    );
});
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<
    React.ComponentRef<typeof SelectPrimitive.ScrollUpButton>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton> & { className?: string }
>(({ className, ...props }, ref) => (
    <SelectPrimitive.ScrollUpButton
        ref={ref}
        className={cn('flex cursor-default items-center justify-center py-1', className)}
        {...props}
    >
        <CaretUpIcon
            className={cn(
                'size-4',
                'opacity-50',
                'dark:opacity-50',
                'dark:hover:opacity-100',
                'hover:opacity-100',
            )}
            weight="duotone"
        />
    </SelectPrimitive.ScrollUpButton>
));

SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
    React.ComponentRef<typeof SelectPrimitive.ScrollDownButton>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton> & { className?: string }
>(({ className, ...props }, ref) => (
    <SelectPrimitive.ScrollDownButton
        ref={ref}
        className={cn('flex cursor-default items-center justify-center py-1', className)}
        {...props}
    >
        <CaretDownIcon
            className={cn(
                'size-4',
                'opacity-50',
                'dark:opacity-50',
                'dark:hover:opacity-100',
                'hover:opacity-100',
            )}
            weight="duotone"
        />
    </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

const selectContentVariants = cva(
    'relative z-50 max-h-60 overflow-hidden border border-border bg-surface-2 text-popover-foreground shadow-large data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
    {
        variants: {
            size: {
                xs: 'rounded-xl',
                sm: 'rounded-2xl',
                md: 'rounded-3xl',
                lg: 'rounded-[2rem]',
                xl: 'rounded-[2.5rem]',
            },
        },
        defaultVariants: {
            size: 'md',
        },
    },
);

const selectViewportVariants = cva('', {
    variants: {
        size: {
            xs: 'p-1.5',
            sm: 'p-2',
            md: 'p-3',
            lg: 'p-4',
            xl: 'p-5',
        },
    },
    defaultVariants: {
        size: 'md',
    },
});

const SelectContent = React.forwardRef<
    React.ComponentRef<typeof SelectPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> & {
        className?: string;
        position?: 'popper' | 'static';
    }
>(({ children, className, position = 'popper', ...props }, ref) => {
    const { size } = React.useContext(SelectContext);

    return (
        <SelectPrimitive.Portal>
            <SelectPrimitive.Content
                ref={ref}
                className={cn(
                    selectContentVariants({ size }),
                    position === 'popper' &&
                        'w-[var(--radix-select-trigger-width)] data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
                    className,
                )}
                position={position}
                {...props}
            >
                <SelectScrollUpButton />
                <SelectPrimitive.Viewport
                    className={cn(
                        selectViewportVariants({ size }),
                        position === 'popper' && 'w-full min-w-[var(--radix-select-trigger-width)]',
                    )}
                >
                    {children}
                </SelectPrimitive.Viewport>
                <SelectScrollDownButton />
            </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
    );
});
SelectContent.displayName = SelectPrimitive.Content.displayName;

const selectLabelVariants = cva('font-semibold text-muted', {
    variants: {
        size: {
            xs: 'px-1.5 py-0.5 text-xs',
            sm: 'px-2 py-1 text-xs',
            md: 'px-2 py-1.5 text-sm',
            lg: 'px-3 py-2 text-base',
            xl: 'px-4 py-2.5 text-lg',
        },
    },
    defaultVariants: {
        size: 'md',
    },
});

const SelectLabel = React.forwardRef<
    React.ComponentRef<typeof SelectPrimitive.Label>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label> & { className?: string }
>(({ className, ...props }, ref) => {
    const { size } = React.useContext(SelectContext);
    return (
        <SelectPrimitive.Label
            ref={ref}
            className={cn(selectLabelVariants({ size }), className)}
            {...props}
        />
    );
});

SelectLabel.displayName = SelectPrimitive.Label.displayName;

const selectItemVariants = cva(
    'relative flex w-full cursor-default select-none flex-row items-center gap-2 outline-none focus:bg-primary focus:font-bold focus:text-primary-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
    {
        variants: {
            size: {
                // Border radius follows nesting: items are 1/2 of content radius
                xs: 'px-2.5 py-1 pr-7 text-xs rounded-lg',
                sm: 'px-3 py-1.5 pr-6 text-xs rounded-xl',
                md: 'px-4 py-2 pr-8 text-sm rounded-xl',
                lg: 'px-5 py-2.5 pr-9 text-sm rounded-2xl',
                xl: 'px-6 py-3 pr-10 text-lg rounded-[1.25rem]',
            },
        },
        defaultVariants: {
            size: 'md',
        },
    },
);

const SelectItem = React.forwardRef<
    React.ComponentRef<typeof SelectPrimitive.Item>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & { className?: string }
>(({ children, className, ...props }, ref) => {
    const { size } = React.useContext(SelectContext);
    return (
        <SelectPrimitive.Item ref={ref} className={cn(selectItemVariants({ size }), className)} {...props}>
            <span
                className={cn(
                    'absolute flex items-center justify-center',
                    size === 'xs' && 'right-1.5 size-3',
                    size === 'sm' && 'right-2 size-3',
                    (size === 'md' || !size) && 'right-2 size-3.5',
                    size === 'lg' && 'right-2.5 size-4',
                    size === 'xl' && 'right-3 size-4',
                )}
            >
                <SelectPrimitive.ItemIndicator>
                    <CheckIcon
                        className={cn(
                            size === 'xs' && 'size-2.5',
                            size === 'sm' && 'size-3',
                            (size === 'md' || !size) && 'size-3.5',
                            size === 'lg' && 'size-4',
                            size === 'xl' && 'size-4',
                        )}
                        weight="regular"
                    />
                </SelectPrimitive.ItemIndicator>
            </span>
            <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
        </SelectPrimitive.Item>
    );
});
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
    React.ComponentRef<typeof SelectPrimitive.Separator>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator> & { className?: string }
>(({ className, ...props }, ref) => (
    <SelectPrimitive.Separator ref={ref} className={cn('bg-muted -mx-1 my-1 h-px', className)} {...props} />
));

SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
    Select,
    SelectGroup,
    SelectValue,
    SelectTrigger,
    SelectContent,
    SelectLabel,
    SelectItem,
    SelectSeparator,
    SelectScrollUpButton,
    SelectScrollDownButton,
};
