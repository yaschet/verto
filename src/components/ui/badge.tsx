/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { type VariantProps, cva } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@library/utils';

const badgeVariants = cva(
    'inline-flex cursor-pointer select-none items-center justify-center gap-2 rounded-xl px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:cursor-pointer',
    {
        compoundVariants: [
            // * Plain Variants:
            {
                class: 'bg-transparent text-primary-500 hover:bg-primary-100 hover:text-primary-500 active:bg-primary-200 dark:bg-transparent dark:text-primary-500 dark:hover:bg-primary-950 dark:hover:text-primary-500 dark:active:bg-primary-900',
                color: 'primary',
                variant: 'plain',
            },
            {
                class: 'bg-transparent text-secondary-500 hover:bg-secondary-100 hover:text-secondary-500 active:bg-secondary-200 dark:bg-transparent dark:text-secondary-500 dark:hover:bg-secondary-950 dark:hover:text-secondary-500 dark:active:bg-secondary-900',
                color: 'secondary',
                variant: 'plain',
            },
            {
                class: 'bg-transparent text-accent-500 hover:bg-accent-100 hover:text-accent-500 active:bg-accent-200 dark:bg-transparent dark:text-accent-500 dark:hover:bg-accent-950 dark:hover:text-accent-500 dark:active:bg-accent-900',
                color: 'accent',
                variant: 'plain',
            },
            {
                class: 'bg-transparent text-success-500 hover:bg-success-100 hover:text-success-500 active:bg-success-200 dark:bg-transparent dark:text-success-500 dark:hover:bg-success-950 dark:hover:text-success-500 dark:active:bg-success-900',
                color: 'success',
                variant: 'plain',
            },
            {
                class: 'bg-transparent text-warning-500 hover:bg-warning-100 hover:text-warning-500 active:bg-warning-200 dark:bg-transparent dark:text-warning-500 dark:hover:bg-warning-950 dark:hover:text-warning-500 dark:active:bg-warning-900',
                color: 'warning',
                variant: 'plain',
            },
            {
                class: 'bg-transparent text-info-500 hover:bg-info-100 hover:text-info-500 active:bg-info-200 dark:bg-transparent dark:text-info-500 dark:hover:bg-info-950 dark:hover:text-info-500 dark:active:bg-info-900',
                color: 'info',
                variant: 'plain',
            },
            {
                class: 'bg-transparent text-destructive-500 hover:bg-destructive-100 hover:text-destructive-500 active:bg-destructive-200 dark:bg-transparent dark:text-destructive-500 dark:hover:bg-destructive-950 dark:hover:text-destructive-500 dark:active:bg-destructive-900',
                color: 'destructive',
                variant: 'plain',
            },
            // * Outlined Variants:
            {
                class: 'border-primary-100 bg-primary-50 text-primary-500 hover:bg-primary-100 active:bg-primary-200 dark:border-primary-900 dark:bg-primary-950 dark:hover:bg-primary-950 dark:active:bg-primary-900',
                color: 'primary',
                variant: 'outlined',
            },
            {
                class: 'border-secondary-100 bg-secondary-50 text-secondary-500 hover:bg-secondary-100 active:bg-secondary-200 dark:border-secondary-900 dark:bg-secondary-950 dark:hover:bg-secondary-950 dark:active:bg-secondary-900',
                color: 'secondary',
                variant: 'outlined',
            },
            {
                class: 'border-accent-100 bg-accent-50 text-accent-500 hover:bg-accent-100 active:bg-accent-200 dark:border-accent-900 dark:bg-accent-950 dark:hover:bg-accent-950 dark:active:bg-accent-900',
                color: 'accent',
                variant: 'outlined',
            },
            {
                class: 'border-success-100 bg-success-50 text-success-500 hover:bg-success-100 active:bg-success-200 dark:border-success-900 dark:bg-success-950 dark:hover:bg-success-900 dark:active:bg-success-900',
                color: 'success',
                variant: 'outlined',
            },
            {
                class: 'border-warning-100 bg-warning-50 text-warning-500 hover:bg-warning-100 active:bg-warning-200 dark:border-warning-900 dark:bg-warning-950 dark:hover:bg-warning-950 dark:active:bg-warning-900',
                color: 'warning',
                variant: 'outlined',
            },
            {
                class: 'border-info-100 bg-info-50 text-info-500 hover:bg-info-100 active:bg-info-200 dark:border-info-900 dark:bg-info-950 dark:hover:bg-info-950 dark:active:bg-info-900',
                color: 'info',
                variant: 'outlined',
            },
            {
                class: 'border-destructive-100 bg-destructive-50 text-destructive-500 hover:bg-destructive-100 active:bg-destructive-200 dark:border-destructive-900 dark:bg-destructive-950 dark:hover:bg-destructive-950 dark:active:bg-destructive-900',
                color: 'destructive',
                variant: 'outlined',
            },
            // * Soft Variants:
            {
                class: 'bg-primary-100 text-primary-500 hover:bg-primary-200 hover:text-primary-600 active:bg-primary-300 active:text-primary-700 dark:bg-primary-950 dark:text-primary-500 dark:hover:bg-primary-900 dark:hover:text-primary-400 dark:active:bg-primary-800 dark:active:text-primary-300',
                color: 'primary',
                variant: 'soft',
            },
            {
                class: 'bg-secondary-100 text-secondary-500 hover:bg-secondary-200 hover:text-secondary-600 active:bg-secondary-300 active:text-secondary-700 dark:bg-secondary-950 dark:text-secondary-500 dark:hover:bg-secondary-900 dark:hover:text-secondary-400 dark:active:bg-secondary-800 dark:active:text-secondary-300',
                color: 'secondary',
                variant: 'soft',
            },
            {
                class: 'bg-accent-100 text-accent-500 hover:bg-accent-200 hover:text-accent-600 active:bg-accent-300 active:text-accent-700 dark:bg-accent-950 dark:text-accent-500 dark:hover:bg-accent-900 dark:hover:text-accent-400 dark:active:bg-accent-800 dark:active:text-accent-300',
                color: 'accent',
                variant: 'soft',
            },
            {
                class: 'bg-success-100 text-success-500 hover:bg-success-200 hover:text-success-600 active:bg-success-300 active:text-success-700 dark:bg-success-950 dark:text-success-500 dark:hover:bg-success-900 dark:hover:text-success-400 dark:active:bg-success-800 dark:active:text-success-300',
                color: 'success',
                variant: 'soft',
            },
            {
                class: 'bg-warning-100 text-warning-500 hover:bg-warning-200 hover:text-warning-600 active:bg-warning-300 active:text-warning-700 dark:bg-warning-950 dark:text-warning-500 dark:hover:bg-warning-900 dark:hover:text-warning-400 dark:active:bg-warning-800 dark:active:text-warning-300',
                color: 'warning',
                variant: 'soft',
            },
            {
                class: 'bg-info-100 text-info-500 hover:bg-info-200 hover:text-info-600 active:bg-info-300 active:text-info-700 dark:bg-info-950 dark:text-info-500 dark:hover:bg-info-900 dark:hover:text-info-400 dark:active:bg-info-800 dark:active:text-info-300',
                color: 'info',
                variant: 'soft',
            },
            {
                class: 'bg-destructive-100 text-destructive-500 hover:bg-destructive-200 hover:text-destructive-600 active:bg-destructive-300 active:text-destructive-700 dark:bg-destructive-950 dark:text-destructive-500 dark:hover:bg-destructive-900 dark:hover:text-destructive-400 dark:active:bg-destructive-800 dark:active:text-destructive-300',
                color: 'destructive',
                variant: 'soft',
            },
            // * Solid Variants:
            {
                class: 'bg-primary-950 dark:bg-primary-50 dark:text-primary-950 text-primary-50 hover:bg-primary-800 hover:text-primary-100 active:bg-primary-900 active:text-primary-100 dark:hover:bg-primary-200 dark:hover:text-primary-900 dark:active:bg-primary-100 dark:active:text-primary-900',
                color: 'primary',
                variant: 'solid',
            },
            {
                class: 'bg-secondary-500 text-secondary-100 hover:bg-secondary-600 hover:text-secondary-200 active:bg-secondary-700 active:text-secondary-200 dark:bg-secondary-500 dark:hover:bg-secondary-600 dark:hover:text-secondary-100 dark:active:bg-secondary-700 dark:active:text-secondary-200',
                color: 'secondary',
                variant: 'solid',
            },
            {
                class: 'bg-accent-500 text-accent-100 hover:bg-accent-600 hover:text-accent-200 active:bg-accent-700 active:text-accent-200 dark:bg-accent-500 dark:hover:bg-accent-600 dark:hover:text-accent-100 dark:active:bg-accent-700 dark:active:text-accent-200',
                color: 'accent',
                variant: 'solid',
            },
            {
                class: 'bg-success-500 text-success-100 hover:bg-success-600 hover:text-success-200 active:bg-success-700 active:text-success-200 dark:bg-success-500 dark:hover:bg-success-600 dark:hover:text-success-100 dark:active:bg-success-700 dark:active:text-success-200',
                color: 'success',
                variant: 'solid',
            },
            {
                class: 'bg-warning-500 text-warning-100 hover:bg-warning-600 hover:text-warning-200 active:bg-warning-700 active:text-warning-200 dark:bg-warning-500 dark:hover:bg-warning-600 dark:hover:text-warning-100 dark:active:bg-warning-700 dark:active:text-warning-200',
                color: 'warning',
                variant: 'solid',
            },
            {
                class: 'bg-info-500 text-white hover:bg-info-600 focus:outline-none dark:bg-info-500 dark:hover:bg-info-600',
                color: 'info',
                variant: 'solid',
            },
            {
                class: 'bg-destructive-500 text-destructive-100 hover:bg-destructive-600 hover:text-destructive-200 active:bg-destructive-700 active:text-destructive-200 dark:bg-destructive-500 dark:hover:bg-destructive-600 dark:hover:text-destructive-100 dark:active:bg-destructive-700 dark:active:text-destructive-200',
                color: 'destructive',
                variant: 'solid',
            },
        ],
        defaultVariants: {
            color: 'primary',
            size: 'md',
            variant: 'solid',
        },
        variants: {
            color: {
                accent: 'border-accent-700 text-accent-700 hover:bg-accent-700',
                destructive: 'border-destructive-700 text-destructive-700 hover:bg-destructive-700',
                info: 'border-info-700 text-info-700 hover:bg-info-700',
                primary: 'border-primary-700 text-primary-700 hover:bg-primary-700',
                secondary: 'border-secondary-700 text-secondary-700 hover:bg-secondary-700',
                success: 'border-success-700 text-success-700 hover:bg-success-700',
                warning: 'border-warning-700 text-warning-700 hover:bg-warning-700',
            },
            disabled: {
                true: 'cursor-not-allowed opacity-50',
            },
            size: {
                lg: 'px-3 py-1 text-sm',
                md: 'px-3 py-0.5 text-xs',
                sm: 'px-2.5 py-0.5 text-xs',
            },
            variant: {
                outlined: 'border',
                plain: 'border-transparent',
                soft: '',
                solid: 'text-white',
            },
        },
    },
);

export type BadgeProps = {
    children?: React.ReactNode;
    color?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'info' | 'destructive';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
} & Omit<React.HTMLAttributes<HTMLDivElement>, 'variant' | 'color' | 'size' | 'disabled'> &
    VariantProps<typeof badgeVariants>;

function Badge({ className, color, disabled, size, variant, ...props }: BadgeProps) {
    return <span className={cn(badgeVariants({ className, color, disabled, size, variant }))} {...props} />;
}

export { Badge, badgeVariants };
