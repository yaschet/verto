/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import * as React from 'react';
import { cn } from '@library/utils';

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                'bg-card text-card-foreground border-border flex w-full flex-col rounded-3xl border shadow-md',
                className,
            )}
            {...props}
        />
    ),
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn('flex w-full flex-col gap-2 p-6', className)} {...props} />
    ),
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
    ({ className, ...props }, ref) => (
        <h3
            ref={ref}
            className={cn('w-full text-xl leading-none font-bold tracking-tight', className)}
            {...props}
        />
    ),
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
    ({ className, ...props }, ref) => (
        <p ref={ref} className={cn('text-muted w-full text-base font-normal', className)} {...props} />
    ),
);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }
>(({ asChild = false, children, className, ...props }, ref) => {
    if (asChild) {
        return React.cloneElement(
            React.Children.only(children) as React.ReactElement<
                React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }
            >,
            {
                ...props,
                ref,
                className: cn('w-full p-6 pt-0', className),
            },
        );
    }
    return (
        <div ref={ref} className={cn('w-full p-6 pt-0', className)} {...props}>
            {children}
        </div>
    );
});

CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn('flex w-full items-center p-6 pt-0', className)} {...props} />
    ),
);

CardFooter.displayName = 'CardFooter';

const DefaultCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    // The Default Card has no specific layout, it's just a card with a border and a background, and a flex layout.
    // It's meant to be used as a container for other components.
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                'bg-card text-card-foreground border-border w-full rounded-3xl border p-4 shadow-md md:p-6',
                className,
            )}
            {...props}
        />
    ),
);

DefaultCard.displayName = 'DefaultCard';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, DefaultCard };
