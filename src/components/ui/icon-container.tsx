/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { type VariantProps, cva } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@library/utils';

const iconContainerVariants = cva(
    ['inline-flex items-center justify-center', 'transition-all duration-200 ease-out'],
    {
        compoundVariants: [
            // * Plain Variant - transparent background, colored icon
            {
                className: ['bg-transparent text-foreground dark:text-foreground'],
                color: 'default',
                variant: 'plain',
            },
            {
                className: ['bg-transparent text-primary-950 dark:text-primary-50'],
                color: 'primary',
                variant: 'plain',
            },
            {
                className: ['bg-transparent text-secondary-500 dark:text-secondary-500'],
                color: 'secondary',
                variant: 'plain',
            },
            {
                className: ['bg-transparent text-accent-500 dark:text-accent-500'],
                color: 'accent',
                variant: 'plain',
            },
            {
                className: ['bg-transparent text-success-500 dark:text-success-500'],
                color: 'success',
                variant: 'plain',
            },
            {
                className: ['bg-transparent text-warning-500 dark:text-warning-500'],
                color: 'warning',
                variant: 'plain',
            },
            {
                className: ['bg-transparent text-info-500 dark:text-info-500'],
                color: 'info',
                variant: 'plain',
            },
            {
                className: ['bg-transparent text-destructive-500 dark:text-destructive-500'],
                color: 'destructive',
                variant: 'plain',
            },
            // * Outlined Variant - border with colored background
            {
                className: [
                    'border-surface-200 bg-surface-50 text-surface-950 dark:border-surface-800 dark:bg-surface-950 dark:text-surface-50 border',
                ],
                color: 'default',
                variant: 'outlined',
            },
            {
                className: [
                    'border-primary-200 bg-primary-50 text-primary-950 dark:border-primary-800 dark:bg-primary-950 dark:text-primary-50 border',
                ],
                color: 'primary',
                variant: 'outlined',
            },
            {
                className: [
                    'border-secondary-200 bg-secondary-50 text-secondary-500 dark:border-secondary-800 dark:bg-secondary-950 dark:text-secondary-500 border',
                ],
                color: 'secondary',
                variant: 'outlined',
            },
            {
                className: [
                    'border-accent-200 bg-accent-50 text-accent-500 dark:border-accent-800 dark:bg-accent-950 dark:text-accent-500 border',
                ],
                color: 'accent',
                variant: 'outlined',
            },
            {
                className: [
                    'border-success-200 bg-success-50 text-success-500 dark:border-success-800 dark:bg-success-950 dark:text-success-500 border',
                ],
                color: 'success',
                variant: 'outlined',
            },
            {
                className: [
                    'border-warning-200 bg-warning-50 text-warning-500 dark:border-warning-800 dark:bg-warning-950 dark:text-warning-500 border',
                ],
                color: 'warning',
                variant: 'outlined',
            },
            {
                className: [
                    'border-info-200 bg-info-50 text-info-500 dark:border-info-800 dark:bg-info-950 dark:text-info-500 border',
                ],
                color: 'info',
                variant: 'outlined',
            },
            {
                className: [
                    'border-destructive-200 bg-destructive-50 text-destructive-500 dark:border-destructive-800 dark:bg-destructive-950 dark:text-destructive-500 border',
                ],
                color: 'destructive',
                variant: 'outlined',
            },
            // * Soft Variant - colored background, darker icon (default)
            {
                className: ['bg-surface-100 text-surface-950 dark:bg-surface-900 dark:text-surface-50'],
                color: 'default',
                variant: 'soft',
            },
            {
                className: ['bg-primary-100 text-primary-950 dark:bg-primary-900 dark:text-primary-50'],
                color: 'primary',
                variant: 'soft',
            },
            {
                className: [
                    'bg-secondary-100 text-secondary-500 dark:bg-secondary-950 dark:text-secondary-500',
                ],
                color: 'secondary',
                variant: 'soft',
            },
            {
                className: ['bg-accent-100 text-accent-500 dark:bg-accent-950 dark:text-accent-500'],
                color: 'accent',
                variant: 'soft',
            },
            {
                className: ['bg-success-100 text-success-500 dark:bg-success-950 dark:text-success-500'],
                color: 'success',
                variant: 'soft',
            },
            {
                className: ['bg-warning-100 text-warning-500 dark:bg-warning-950 dark:text-warning-500'],
                color: 'warning',
                variant: 'soft',
            },
            {
                className: ['bg-info-100 text-info-500 dark:bg-info-950 dark:text-info-500'],
                color: 'info',
                variant: 'soft',
            },
            {
                className: [
                    'bg-destructive-100 text-destructive-500 dark:bg-destructive-950 dark:text-destructive-500',
                ],
                color: 'destructive',
                variant: 'soft',
            },
            // * Solid Variant - strong colored background, light icon
            {
                className: ['bg-surface-950 text-surface-50 dark:bg-surface-50 dark:text-surface-950'],
                color: 'default',
                variant: 'solid',
            },
            {
                className: ['bg-primary-950 text-primary-50 dark:bg-primary-50 dark:text-primary-950'],
                color: 'primary',
                variant: 'solid',
            },
            {
                className: [
                    'bg-secondary-500 text-secondary-50 dark:bg-secondary-500 dark:text-secondary-50',
                ],
                color: 'secondary',
                variant: 'solid',
            },
            {
                className: [
                    'bg-accent-surface text-accent-foreground dark:bg-accent-surface dark:text-accent-foreground',
                ],
                color: 'accent',
                variant: 'solid',
            },
            {
                className: [
                    'bg-success-surface text-success-foreground dark:bg-success-surface dark:text-success-foreground',
                ],
                color: 'success',
                variant: 'solid',
            },
            {
                className: [
                    'bg-warning-surface text-warning-foreground dark:bg-warning-surface dark:text-warning-foreground',
                ],
                color: 'warning',
                variant: 'solid',
            },
            {
                className: [
                    'bg-info-surface text-info-foreground dark:bg-info-surface dark:text-info-foreground',
                ],
                color: 'info',
                variant: 'solid',
            },
            {
                className: [
                    'bg-destructive-surface text-destructive-foreground dark:bg-destructive-surface dark:text-destructive-foreground',
                ],
                color: 'destructive',
                variant: 'solid',
            },
        ],
        defaultVariants: {
            color: 'primary',
            shape: 'rounded',
            size: 'md',
            variant: 'soft',
        },
        variants: {
            color: {
                accent: '',
                default: '',
                destructive: '',
                info: '',
                primary: '',
                secondary: '',
                success: '',
                warning: '',
            },
            shape: {
                pill: 'rounded-full',
                rounded: 'rounded-xl',
                'rounded-lg': 'rounded-3xl',
                'rounded-sm': 'rounded-sm',
                square: 'rounded-none',
            },
            size: {
                icon: 'size-10',
                'icon-lg': 'size-12',
                'icon-md': 'size-10',
                'icon-sm': 'size-8',
                'icon-xl': 'size-14',
                'icon-xs': 'size-6',
                lg: 'size-12',
                md: 'size-10',
                sm: 'size-8',
                xl: 'size-14',
                xs: 'size-6',
            },
            variant: {
                outlined: '',
                plain: '',
                soft: '',
                solid: '',
            },
        },
    },
);

export type IconContainerProps = {
    children: React.ReactNode;
    className?: string;
    variant?: 'plain' | 'outlined' | 'soft' | 'solid';
    color?: 'default' | 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'info' | 'destructive';
    size?:
        | 'xs'
        | 'sm'
        | 'md'
        | 'lg'
        | 'xl'
        | 'icon'
        | 'icon-xs'
        | 'icon-sm'
        | 'icon-md'
        | 'icon-lg'
        | 'icon-xl';
    shape?: 'rounded' | 'pill' | 'square' | 'rounded-lg' | 'rounded-sm';
} & React.HTMLAttributes<HTMLDivElement> &
    VariantProps<typeof iconContainerVariants>;

const IconContainer = React.forwardRef<HTMLDivElement, IconContainerProps>(
    ({ children, className, color, shape, size, variant, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(iconContainerVariants({ className, color, shape, size, variant }))}
                {...props}
            >
                {children}
            </div>
        );
    },
);

IconContainer.displayName = 'IconContainer';

export { IconContainer, iconContainerVariants };
