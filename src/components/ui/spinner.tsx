/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { type IconProps, CircleNotchIcon as SpinnerIcon } from '@phosphor-icons/react';
import { cva } from 'class-variance-authority';
import { motion } from 'framer-motion';
import React from 'react';
import { cn } from '@library/utils';
import type { MotionProps } from 'framer-motion';

const spinnerVariants = cva('size-5', {
    defaultVariants: {
        color: 'primary',
        size: 'md',
    },
    variants: {
        color: {
            currentColor: 'text-current',
            danger: 'text-destructive',
            dark: 'text-black',
            default: 'text-inherit',
            info: 'text-info',
            light: 'text-white',
            primary: 'text-primary',
            secondary: 'text-secondary',
            success: 'text-success',
            warning: 'text-warning',
        },
        size: {
            lg: 'size-16',
            md: 'size-12',
            sm: 'size-8',
            xl: 'size-20',
            xs: 'size-4',
        },
    },
});

export type SpinnerProps = IconProps &
    MotionProps & {
        size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
        color?:
            | 'default'
            | 'primary'
            | 'secondary'
            | 'success'
            | 'danger'
            | 'warning'
            | 'info'
            | 'light'
            | 'dark'
            | 'currentColor';
        className?: string;
    };

const SpinnerComponent = React.forwardRef<SVGSVGElement, SpinnerProps>((props, ref): React.JSX.Element => {
    const { className, color, size, weight = 'duotone', ...rest } = props;

    return (
        <SpinnerIcon
            ref={ref}
            className={cn(spinnerVariants({ color, size }), className)}
            color="currentColor"
            weight={weight}
            {...rest}
        />
    );
});

SpinnerComponent.displayName = 'Spinner';

const MotionSpinner = motion.create(SpinnerComponent, { forwardMotionProps: true });

export function Spinner({
    className,
    color = 'currentColor',
    size,
    weight = 'duotone',
    ...props
}: SpinnerProps) {
    return (
        <MotionSpinner
            animate={{ rotate: 360 }}
            className={cn('animate-spin', spinnerVariants({ color, size }), className)}
            color={color}
            initial={{ rotate: 0 }}
            size={size}
            transition={{
                bounce: 100,
                damping: 50,
                delay: 0.2,
                duration: 3,
                ease: 'easeInOut',
                mass: 10,
                repeat: Infinity,
                restDelta: 10,
                restSpeed: 0.5,
                stiffness: 0,
                type: 'spring',
                velocity: 10,
            }}
            weight={weight}
            {...props}
        />
    );
}

export default Spinner;
