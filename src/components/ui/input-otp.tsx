/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { DashIcon } from '@radix-ui/react-icons';
import { OTPInput, OTPInputContext } from 'input-otp';
import * as React from 'react';
import { cn } from '@library/utils';

const InputOTP = React.forwardRef<
    React.ComponentRef<typeof OTPInput>,
    React.ComponentPropsWithoutRef<typeof OTPInput> & { className?: string; containerClassName?: string }
>(({ className, containerClassName, ...props }, ref) => (
    <OTPInput
        ref={ref}
        className={cn('w-full disabled:cursor-not-allowed', className)}
        containerClassName={cn(
            'flex w-full items-center gap-2 has-[:disabled]:opacity-50',
            containerClassName,
        )}
        {...props}
    />
));
InputOTP.displayName = 'InputOTP';

const InputOTPGroup = React.forwardRef<
    React.ComponentRef<'div'>,
    React.ComponentPropsWithoutRef<'div'> & { className?: string }
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex w-full items-center', className)} {...props} />
));
InputOTPGroup.displayName = 'InputOTPGroup';

const InputOTPSlot = React.forwardRef<
    React.ComponentRef<'div'>,
    React.ComponentPropsWithoutRef<'div'> & { index: number; className?: string }
>(({ className, index, ...props }, ref) => {
    const inputOTPContext = React.useContext(OTPInputContext);
    const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index];

    return (
        <div
            ref={ref}
            className={cn(
                'flex-basis-0 shadow-smallall border-input bg-surface-50 dark:bg-surface-900 relative flex aspect-square h-auto w-auto flex-grow items-center justify-center border-y border-r text-sm font-bold transition-all first:rounded-l-md first:border-l last:rounded-r-md md:text-base lg:text-lg xl:text-xl',
                isActive && 'border-muted z-10 border',
                className,
            )}
            {...props}
        >
            <span className={cn('pointer-events-none absolute inset-0 flex items-center justify-center')}>
                {char}
            </span>
            {hasFakeCaret && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="animate-caret-blink bg-muted h-4 w-px duration-1000" />
                </div>
            )}
        </div>
    );
});
InputOTPSlot.displayName = 'InputOTPSlot';

const InputOTPSeparator = React.forwardRef<React.ComponentRef<'div'>, React.ComponentPropsWithoutRef<'div'>>(
    ({ ...props }, ref) => (
        <div ref={ref} role="separator" {...props}>
            <DashIcon />
        </div>
    ),
);
InputOTPSeparator.displayName = 'InputOTPSeparator';

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
