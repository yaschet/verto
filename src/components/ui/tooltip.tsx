/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import * as React from 'react';
import { badgeVariants } from '@components/ui/badge';
import { cn } from '@library/utils';

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
    React.ComponentRef<typeof TooltipPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & {
        className?: string;
        sideOffset?: number;
    }
>(
    (
        {
            className,
            sideOffset = 4,
            ...props
        }: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & {
            className?: string;
            sideOffset?: number;
        },
        ref,
    ) => (
        <TooltipPrimitive.Content
            ref={ref}
            className={cn(
                badgeVariants({ color: 'secondary', size: 'sm', variant: 'soft' }),
                'shadow-large shadow-surface-1 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 overflow-hidden p-3',
                className,
            )}
            sideOffset={sideOffset}
            {...props}
        />
    ),
);
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

const TooltipArrow = TooltipPrimitive.Arrow;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, TooltipArrow };
