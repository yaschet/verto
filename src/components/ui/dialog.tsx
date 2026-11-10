/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { XIcon } from '@phosphor-icons/react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import React from 'react';
import { cn } from '@library/utils';

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;

const DialogPortal = DialogPrimitive.Portal;

const DialogOverlay = React.forwardRef<
    React.ComponentRef<typeof DialogPrimitive.Overlay>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> & { className?: string }
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Overlay
        ref={ref}
        className={cn(
            'bg-surface-950/20 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 dark:bg-surface-950/50 fixed inset-0 z-50 grid place-items-center overflow-y-auto backdrop-blur-sm',
            className,
        )}
        {...props}
    />
));

DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
    React.ComponentRef<typeof DialogPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { className?: string }
>(({ children, className, ...props }, ref) => {
    return (
        <DialogPortal>
            <DialogOverlay className="py-8 sm:py-12 md:py-16 lg:py-20 xl:py-24">
                <DialogPrimitive.Content
                    ref={ref}
                    className={cn(
                        'border-border bg-popover shadow-surface-400 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-bottom-[2rem] data-[state=open]:slide-in-from-bottom-[2rem] dark:shadow-surface-950/40 pointer-events-auto relative z-50 grid w-full max-w-lg gap-4 rounded-3xl border p-6 shadow-2xl duration-200',
                        className,
                    )}
                    {...props}
                >
                    {children}
                </DialogPrimitive.Content>
            </DialogOverlay>
        </DialogPortal>
    );
});

DialogContent.displayName = DialogPrimitive.Content.displayName;

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn('flex flex-col space-y-3 text-center sm:text-left', className)} {...props} />;
}

DialogHeader.displayName = 'DialogHeader';

function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
            {...props}
        />
    );
}

DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
    React.ComponentRef<typeof DialogPrimitive.Title>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title> & { className?: string }
>(({ children, className, ...props }, ref) => (
    <DialogPrimitive.Title
        ref={ref}
        className={cn(
            'flex flex-row items-center justify-between text-lg leading-none font-semibold tracking-tight',
            className,
        )}
        {...props}
    >
        <span>{children}</span>
        <DialogPrimitive.Close className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none">
            <XIcon className="size-5" color="currentColor" weight="duotone" />
            <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
    </DialogPrimitive.Title>
));

DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
    React.ComponentRef<typeof DialogPrimitive.Description>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description> & { className?: string }
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Description
        ref={ref}
        className={cn('text-muted w-full text-sm', className)}
        {...props}
    />
));

DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
    Dialog,
    DialogPortal,
    DialogOverlay,
    DialogTrigger,
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
};
