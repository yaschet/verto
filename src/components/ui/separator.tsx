/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import * as SeparatorPrimitive from '@radix-ui/react-separator';
import * as React from 'react';
import { cn } from '@library/utils';

const Separator = React.forwardRef<
    React.ComponentRef<typeof SeparatorPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> & {
        className?: string;
        orientation?: 'horizontal' | 'vertical';
        decorative?: boolean;
    }
>(({ className, decorative = true, orientation = 'horizontal', ...props }, ref) => (
    <SeparatorPrimitive.Root
        ref={ref}
        className={cn(
            'bg-border shrink-0',
            orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
            className,
        )}
        decorative={decorative}
        orientation={orientation}
        {...props}
    />
));
Separator.displayName = SeparatorPrimitive.Root.displayName;

export { Separator };
