/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import * as React from 'react';
import { cn } from '@library/utils';

/**
 * A customized ScrollArea component designed for virtualization.
 * It forwards the ref to the Viewport element instead of the Root,
 * allowing virtualization libraries (like @tanstack/react-virtual)
 * to measure the scrollable container correctly.
 */
const VirtualizedScrollArea = React.forwardRef<
    React.ComponentRef<typeof ScrollAreaPrimitive.Viewport>,
    React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> & {
        className?: string;
        orientation?: 'vertical' | 'horizontal' | 'both';
    }
>(({ children, className, orientation = 'vertical', ...props }, ref) => (
    <ScrollAreaPrimitive.Root className={cn('relative overflow-hidden', className)} {...props}>
        <ScrollAreaPrimitive.Viewport ref={ref} className="size-full rounded-[inherit]">
            {children}
        </ScrollAreaPrimitive.Viewport>
        {orientation !== 'horizontal' && <ScrollBar orientation="vertical" />}
        {orientation !== 'vertical' && <ScrollBar orientation="horizontal" />}
        <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
));
VirtualizedScrollArea.displayName = 'VirtualizedScrollArea';

const ScrollBar = React.forwardRef<
    React.ComponentRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
    React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar> & {
        className?: string;
        orientation?: 'vertical' | 'horizontal';
    }
>(({ className, orientation = 'vertical', ...props }, ref) => (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
        ref={ref}
        className={cn(
            'flex touch-none transition-colors select-none',
            orientation === 'vertical' && 'h-full w-2.5 border-l border-l-transparent p-[1px]',
            orientation === 'horizontal' && 'h-2.5 flex-col border-t border-t-transparent p-[1px]',
            className,
        )}
        orientation={orientation}
        {...props}
    >
        <ScrollAreaPrimitive.ScrollAreaThumb className="bg-border relative flex-1 rounded-full" />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export { VirtualizedScrollArea, ScrollBar };
