/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { XIcon } from '@phosphor-icons/react';
import { type VariantProps, cva } from 'class-variance-authority';
import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';
import { Button } from '@components/ui/button';
import { cn } from '@library/utils';
import type { MotionProps } from 'framer-motion';

const alertVariants = cva(
    'relative flex w-full flex-row flex-wrap items-start justify-start gap-3 rounded-xl border p-4 text-sm overflow-hidden',
    {
        defaultVariants: {
            variant: 'default',
        },
        variants: {
            variant: {
                default: cn(
                    'border-surface-200 bg-surface-1 text-foreground dark:border-surface-800 dark:bg-surface-2',
                ),
                destructive: cn(
                    'border-destructive-200 bg-destructive-50/50 text-destructive-500 dark:border-destructive-800 dark:bg-destructive-950/20 dark:text-destructive-500 [&>div]:text-destructive-500 dark:[&>div]:text-destructive-500 [&>svg]:text-destructive-300 dark:[&>svg]:text-destructive-700',
                ),
                info: cn(
                    'border-info-200 bg-info-50/50 text-info-500 dark:border-info-800 dark:bg-info-950/20 dark:text-info-500 [&>div]:text-info-500 dark:[&>div]:text-info-500 [&>svg]:text-info-300 dark:[&>svg]:text-info-700',
                ),
                success: cn(
                    'border-success-200 bg-success-50/50 text-success-500 dark:border-success-800 dark:bg-success-950/20 dark:text-success-500 [&>div]:text-success-500 dark:[&>div]:text-success-500 [&>svg]:text-success-300 dark:[&>svg]:text-success-700',
                ),
                warning: cn(
                    'border-warning-200 bg-warning-50/50 text-warning-500 dark:border-warning-800 dark:bg-warning-950/20 dark:text-warning-500 [&>div]:text-warning-500 dark:[&>div]:text-warning-500 [&>svg]:text-warning-300 dark:[&>svg]:text-warning-700',
                ),
            },
        },
    },
);

const Alert = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> &
        VariantProps<typeof alertVariants> & {
            onClose?: () => void;
            withCloseButton?: boolean;
            show?: boolean;
            children?: React.ReactNode;
        }
>(({ children, className, onClose, show = true, variant, withCloseButton = true, ...props }, ref) => {
    // Find the alert icon among the children
    const alertIcon = React.Children.toArray(children).find(
        (child) =>
            React.isValidElement(child) &&
            (child.type === AlertIcon || (React.isValidElement(child) && child.type === 'svg')),
    );

    // Filter out the alert icon from the children to get the content children
    const contentChildren = React.Children.toArray(children).filter(
        (child) => !(React.isValidElement(child) && child.type === AlertIcon),
    );

    return (
        <AnimatePresence mode="wait">
            {show && (
                <motion.div
                    ref={ref}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className={cn(alertVariants({ variant }), className)}
                    exit={{ opacity: 0, scale: 0.95, y: 5 }}
                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                    role="alert"
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    {...(props as MotionProps)}
                >
                    {/* Alert Icon */}
                    {alertIcon && <div className="mb-4 flex items-center justify-center">{alertIcon}</div>}
                    {/* Content Container */}
                    <div className="flex flex-1 flex-col items-start justify-start gap-1">
                        {contentChildren.map((contentChild, index) => (
                            <div key={index} className="w-full max-w-full whitespace-pre-wrap">
                                {contentChild}
                            </div>
                        ))}
                    </div>
                    {/* Close Icon */}
                    {withCloseButton && (
                        <Button
                            className="size-6 rounded-full p-1"
                            color={variant ?? 'default'}
                            size="icon"
                            type="button"
                            variant="soft"
                            onClick={() => {
                                onClose?.();
                            }}
                        >
                            <XIcon className="size-3" color="currentColor" weight="regular" />
                        </Button>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
});

export default Alert;

Alert.displayName = 'Alert';

const AlertIcon = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }
>(({ children, className, ...props }, ref) => (
    <div ref={ref} className={cn('size-5', className)} {...props}>
        {children}
    </div>
));

AlertIcon.displayName = 'AlertIcon';

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
    ({ className, ...props }, ref) => (
        <h5
            ref={ref}
            className={cn(
                'mb-1 max-w-full text-sm leading-none font-bold tracking-tight whitespace-pre-wrap',
                'overflow-wrap-anywhere text-pretty break-words',
                className,
            )}
            {...props}
        />
    ),
);
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                'max-w-full text-sm font-medium opacity-80 [&_p]:leading-relaxed',
                'overflow-wrap-anywhere text-pretty break-all',
                className,
            )}
            {...props}
        />
    ),
);

AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertIcon, AlertTitle, AlertDescription };
