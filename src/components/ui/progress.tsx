/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cva } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@library/utils';

const progressVariants = cva(
    [
        'relative h-2 w-full overflow-hidden rounded-full bg-primary/20',
        'size-full flex-1 bg-primary transition-all',
    ],
    {
        defaultVariants: {
            background: 'primary',
            color: 'primary',
            size: 'md',
        },
        variants: {
            background: {
                destructive: 'bg-destructive-50 dark:bg-destructive-950',
                info: 'bg-info-50 dark:bg-info-950',
                none: '',
                primary: 'bg-primary-50 dark:bg-primary-950',
                secondary: 'bg-secondary-50 dark:bg-secondary-950',
                success: 'bg-success-50 dark:bg-success-950',
                warning: 'bg-warning-50 dark:bg-warning-950',
            },
            color: {
                destructive: 'bg-destructive dark:bg-destructive',
                info: 'bg-info dark:bg-info',
                none: '',
                primary: 'bg-primary dark:bg-primary',
                secondary: 'bg-secondary dark:bg-secondary',
                success: 'bg-success dark:bg-success',
                warning: 'bg-warning dark:bg-warning',
            },
            size: {
                lg: 'h-3',
                md: 'h-2',
                sm: 'h-1',
            },
        },
    },
);

export type ProgressProps = {
    size?: 'sm' | 'md' | 'lg';
    color?: 'primary' | 'secondary' | 'success' | 'destructive' | 'warning' | 'info';
    background?: 'primary' | 'secondary' | 'success' | 'destructive' | 'warning' | 'info';
} & React.ComponentProps<typeof ProgressPrimitive.Root>;

const Progress = React.forwardRef<React.ComponentRef<typeof ProgressPrimitive.Root>, ProgressProps>(
    ({ className, color, size, value, ...props }, ref) => (
        <ProgressPrimitive.Root
            ref={ref}
            className={cn(
                'relative w-full overflow-hidden rounded-xl',
                className,
                progressVariants({ background: color, color: 'none', size }),
            )}
            {...props}
        >
            <ProgressPrimitive.Indicator
                className={cn(
                    'size-full flex-1 transition-all',
                    progressVariants({ background: 'none', color }),
                )}
                style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
            />
        </ProgressPrimitive.Root>
    ),
);
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
