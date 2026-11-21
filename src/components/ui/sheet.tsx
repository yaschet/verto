/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { XIcon } from '@phosphor-icons/react';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { type VariantProps, cva } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/src/library/utils';
import { ScrollArea, ScrollBar } from '@components/ui/scroll-area';

const Sheet = SheetPrimitive.Root;

const SheetTrigger = SheetPrimitive.Trigger;

const SheetClose = SheetPrimitive.Close;

const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = React.forwardRef<
    React.ComponentRef<typeof SheetPrimitive.Overlay>,
    React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay> & { className?: string }
>(({ className, ...props }, ref) => (
    <SheetPrimitive.Overlay
        className={cn(
            'bg-surface-950/20 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 dark:bg-surface-950/50 fixed inset-0 z-50 grid place-items-center overflow-y-auto backdrop-blur-sm',
            className,
        )}
        {...props}
        ref={ref}
    />
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

const sheetVariants = cva(
    'fixed z-50 gap-4 border-border shadow-large bg-background shadow-none transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out',
    {
        defaultVariants: {
            side: 'right',
        },
        variants: {
            side: {
                bottom: 'inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
                left: 'inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm',
                right: 'inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm',
                top: 'inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
            },
        },
    },
);

type SheetContentProps = {} & React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> &
    VariantProps<typeof sheetVariants>;

const SheetContent = React.forwardRef<React.ComponentRef<typeof SheetPrimitive.Content>, SheetContentProps>(
    ({ children, className, side = 'right', ...props }, ref) => (
        <SheetPortal>
            <SheetOverlay />
            <SheetPrimitive.Content ref={ref} className={cn(sheetVariants({ side }), className)} {...props}>
                <ScrollArea className="h-full overflow-y-auto p-6">
                    {children}
                    <ScrollBar />
                </ScrollArea>
            </SheetPrimitive.Content>
        </SheetPortal>
    ),
);
SheetContent.displayName = SheetPrimitive.Content.displayName;

function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                'flex w-full flex-col items-center justify-center gap-3 text-center sm:text-left',
                className,
            )}
            {...props}
        />
    );
}
SheetHeader.displayName = 'SheetHeader';

function SheetFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
            {...props}
        />
    );
}
SheetFooter.displayName = 'SheetFooter';

const SheetTitle = React.forwardRef<
    React.ComponentRef<typeof SheetPrimitive.Title>,
    React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title> & {
        children: React.ReactNode;
        className?: string;
    }
>(({ children, className, ...props }, ref) => (
    <SheetPrimitive.Title
        ref={ref}
        className={cn(
            'flex w-full flex-row items-center justify-between text-lg leading-none font-semibold tracking-tight',
            className,
        )}
        {...props}
    >
        <span>{children}</span>
        <SheetPrimitive.Close className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none">
            <XIcon className="size-5" color="currentColor" weight="duotone" />
            <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
    </SheetPrimitive.Title>
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
    React.ComponentRef<typeof SheetPrimitive.Description>,
    React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description> & { className?: string }
>(({ className, ...props }, ref) => (
    <SheetPrimitive.Description
        ref={ref}
        className={cn('text-muted w-full text-start text-xs', className)}
        {...props}
    />
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

export {
    Sheet,
    SheetPortal,
    SheetOverlay,
    SheetTrigger,
    SheetClose,
    SheetContent,
    SheetHeader,
    SheetFooter,
    SheetTitle,
    SheetDescription,
};
