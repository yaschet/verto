/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import * as SwitchPrimitive from '@radix-ui/react-switch';
import { type VariantProps, cva } from 'class-variance-authority';
import { motion } from 'motion/react';
import * as React from 'react';
import { cn } from '@library/utils';

/**
 * Switch component with beautiful Framer Motion animations.
 * Built on Radix UI primitives for accessibility.
 *
 * Features:
 * - Layout-based slide animation with spring physics
 * - Width expansion on press for tactile feedback
 * - Smooth color transitions
 * - Multiple color and size variants
 * - Full keyboard accessibility
 */

// Switch root variants
const switchVariants = cva(
    [
        'peer relative inline-flex shrink-0 cursor-pointer items-center justify-start rounded-full',
        'border border-transparent shadow-xs',
        'transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=checked]:justify-end',
    ],
    {
        variants: {
            variant: {
                default: ['bg-input data-[state=checked]:bg-primary', 'focus-visible:ring-ring/50'],
                info: ['bg-info/20 data-[state=checked]:bg-info', 'focus-visible:ring-info/50'],
                primary: ['bg-primary/20 data-[state=checked]:bg-primary', 'focus-visible:ring-primary/50'],
                success: ['bg-success/20 data-[state=checked]:bg-success', 'focus-visible:ring-success/50'],
                warning: ['bg-warning/20 data-[state=checked]:bg-warning', 'focus-visible:ring-warning/50'],
                destructive: [
                    'bg-destructive/20 data-[state=checked]:bg-destructive',
                    'focus-visible:ring-destructive/50',
                ],
            },
            size: {
                sm: 'h-4 w-7 px-px', // 16px × 28px
                default: 'h-5 w-8 px-px', // 20px × 32px
                lg: 'h-6 w-10 px-px', // 24px × 40px
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
);

// Thumb size mapping
const thumbSizeConfig = {
    sm: {
        base: 'size-3', // 12px
        pressed: 14, // 14px when pressed
    },
    default: {
        base: 'size-4', // 16px
        pressed: 19, // 19px when pressed
    },
    lg: {
        base: 'size-5', // 20px
        pressed: 23, // 23px when pressed
    },
} as const;

export type SwitchProps = {
    /**
     * Color variant of the switch
     */
    color?: 'default' | 'info' | 'primary' | 'success' | 'warning' | 'destructive';
} & Omit<React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>, 'asChild'> &
    VariantProps<typeof switchVariants>;

const Switch = React.forwardRef<React.ElementRef<typeof SwitchPrimitive.Root>, SwitchProps>(
    ({ className, color, size = 'default', variant, ...props }, ref) => {
        const finalColor = color ?? variant ?? 'default';
        const thumbConfig = thumbSizeConfig[size ?? 'default'];

        return (
            <SwitchPrimitive.Root
                className={cn(switchVariants({ variant: finalColor, size }), className)}
                {...props}
                ref={ref}
            >
                <SwitchPrimitive.Thumb asChild>
                    <motion.span
                        layout
                        className={cn(
                            'bg-background pointer-events-none relative z-10 block rounded-full',
                            'ring-0',
                            thumbConfig.base,
                        )}
                        transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 25,
                        }}
                        whileTap={
                            props.disabled
                                ? {}
                                : {
                                      width: thumbConfig.pressed,
                                      transition: {
                                          duration: 0.1,
                                      },
                                  }
                        }
                    />
                </SwitchPrimitive.Thumb>
            </SwitchPrimitive.Root>
        );
    },
);

Switch.displayName = 'Switch';

export { Switch };
