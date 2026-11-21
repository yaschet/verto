/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { CheckIcon, MinusIcon } from '@phosphor-icons/react';
import { cn } from '@library/utils';

type Color = 'default' | 'accent' | 'info' | 'primary' | 'success' | 'warning' | 'destructive';
type CheckboxProps = Omit<
    React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
    'color' | 'asChild'
> & {
    color?: Color;
    variant?: Color;
    size?: 'sm' | 'default' | 'lg';
    radius?: 'sm' | 'default' | 'md' | 'lg' | 'full';
    isSelected?: boolean;
    defaultSelected?: boolean;
    isDisabled?: boolean;
    isRequired?: boolean;
    onValueChange?: (checked: boolean) => void;
    indeterminate?: boolean;
};

const colors: Record<Color, string> = {
    default:
        'data-[state=checked]:bg-surface-950 data-[state=checked]:text-surface-50 data-[state=indeterminate]:bg-surface-950 data-[state=indeterminate]:text-surface-50 dark:data-[state=checked]:bg-surface-50 dark:data-[state=checked]:text-surface-950 dark:data-[state=indeterminate]:bg-surface-50 dark:data-[state=indeterminate]:text-surface-950',
    accent: 'data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground',
    primary:
        'data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground',
    info: 'data-[state=checked]:bg-info data-[state=checked]:text-info-foreground data-[state=indeterminate]:bg-info data-[state=indeterminate]:text-info-foreground',
    success:
        'data-[state=checked]:bg-success data-[state=checked]:text-success-foreground data-[state=indeterminate]:bg-success data-[state=indeterminate]:text-success-foreground',
    warning:
        'data-[state=checked]:bg-warning data-[state=checked]:text-warning-foreground data-[state=indeterminate]:bg-warning data-[state=indeterminate]:text-warning-foreground',
    destructive:
        'data-[state=checked]:bg-destructive data-[state=checked]:text-destructive-foreground data-[state=indeterminate]:bg-destructive data-[state=indeterminate]:text-destructive-foreground',
};
const radii = {
    sm: 'rounded-[5px]',
    default: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-[7px]',
    full: 'rounded-full',
};
const sizes = { sm: 'size-4.5', default: 'size-5', lg: 'size-6' };

const Checkbox = React.forwardRef<React.ComponentRef<typeof CheckboxPrimitive.Root>, CheckboxProps>(
    function Checkbox(
        {
            checked,
            className,
            color,
            variant,
            size = 'default',
            radius = 'default',
            defaultChecked,
            defaultSelected,
            disabled,
            isDisabled,
            required,
            isRequired,
            isSelected,
            indeterminate,
            onCheckedChange,
            onValueChange,
            ...props
        },
        ref,
    ) {
        return (
            <CheckboxPrimitive.Root
                ref={ref}
                checked={indeterminate ? 'indeterminate' : (checked ?? isSelected)}
                defaultChecked={defaultChecked ?? defaultSelected}
                disabled={disabled ?? isDisabled}
                required={required ?? isRequired}
                className={cn(
                    'peer inline-flex shrink-0 items-center justify-center border border-input bg-background outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                    colors[color ?? variant ?? 'default'],
                    sizes[size],
                    radii[radius],
                    className,
                )}
                onCheckedChange={(value) => {
                    onCheckedChange?.(value);
                    if (typeof value === 'boolean') onValueChange?.(value);
                }}
                {...props}
            >
                <CheckboxPrimitive.Indicator className="flex items-center justify-center">
                    {indeterminate ? (
                        <MinusIcon aria-hidden className="size-3.5" weight="bold" />
                    ) : (
                        <CheckIcon aria-hidden className="size-3.5" weight="bold" />
                    )}
                </CheckboxPrimitive.Indicator>
            </CheckboxPrimitive.Root>
        );
    },
);

export { Checkbox, type CheckboxProps };
