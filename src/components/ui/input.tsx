/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { cva } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@library/utils';
import type { VariantProps } from 'class-variance-authority';

const inputVariants = cva(
    [
        'focus:none dark:focus:none block w-full',
        // Base background - unified surface-100 light, surface-900 dark (solid, aligned with design system)
        'bg-surface-100 dark:bg-surface-900',
        'text-foreground placeholder:text-muted-foreground dark:text-foreground dark:placeholder:text-muted-foreground text-sm',
        // Hover state - subtle highlight effect (lighter shade for interactive feedback)
        'hover:bg-surface-50 dark:hover:bg-surface-800',
        // Focus state - white light, surface-800 dark + 2px outline
        'dark:focus-visible:bg-surface-800 focus-visible:bg-white',
        'border border-surface-200 dark:border-surface-800',
        // A11y-first focus - 2px outline (WCAG 2.4.7 compliant, zero layout shift)
        'outline outline-2 outline-transparent outline-offset-0',
        'focus-visible:outline-primary-500 dark:focus-visible:outline-primary-500',
        'transition-colors duration-200 ease-out',
        // Disabled state - surface-200/25 light, surface-800/25 dark
        'disabled:bg-surface-200/25 disabled:hover:bg-surface-200/25 disabled:cursor-not-allowed',
        'dark:disabled:bg-surface-800/25 dark:disabled:hover:bg-surface-800/25',
        // Read-only state - surface-200 light, surface-800 dark
        'read-only:bg-surface-200 read-only:hover:bg-surface-200 read-only:cursor-default',
        'dark:read-only:bg-surface-800 dark:read-only:hover:bg-surface-800',
        // Enhanced autofill state - comprehensive override for all browsers and password managers
        'autofill:bg-surface-100 autofill:hover:bg-surface-200 autofill:focus:bg-white',
        'autofill:text-foreground autofill:-webkit-text-fill-color-foreground',
        'dark:autofill:bg-surface-900 dark:autofill:hover:bg-surface-800 dark:autofill:focus:bg-surface-800',

        '[&:-webkit-autofill]:shadow-[0_0_0_1000px_rgb(var(--surface-100))_inset] dark:[&:-webkit-autofill]:shadow-[0_0_0_1000px_rgb(var(--surface-900))_inset]',
        '[&:-webkit-autofill:hover]:shadow-[0_0_0_1000px_rgb(var(--surface-200))_inset] dark:[&:-webkit-autofill:hover]:shadow-[0_0_0_1000px_rgb(var(--surface-800))_inset]',
        '[&:-webkit-autofill:focus]:shadow-[0_0_0_1000px_white_inset] dark:[&:-webkit-autofill:focus]:shadow-[0_0_0_1000px_rgb(var(--surface-800))_inset]',
        '[&:-webkit-autofill]:-webkit-text-fill-color:var(--foreground)',
        '[&:-webkit-autofill]:transition-[background-color,box-shadow] [&:-webkit-autofill]:duration-[5000000s]',
        // Additional autofill overrides for password managers (1Password, etc.)
        '[&:-webkit-autofill]:!bg-surface-100 [&:-webkit-autofill]:!text-foreground',
        'dark:[&:-webkit-autofill]:!bg-surface-900 dark:[&:-webkit-autofill]:!text-foreground',
        '[&:-webkit-autofill:hover]:!bg-surface-200 dark:[&:-webkit-autofill:hover]:!bg-surface-800',
        'dark:[&:-webkit-autofill:focus]:!bg-surface-800 [&:-webkit-autofill:focus]:!bg-white',
        // Force text color for autofilled content
        '[&:-webkit-autofill]:!-webkit-text-fill-color:var(--foreground)',
        'dark:[&:-webkit-autofill]:!-webkit-text-fill-color:var(--foreground)',
        // 1Password specific overrides
        '[&[data-com-onepassword-filled]]:!bg-surface-100 [&[data-com-onepassword-filled]]:!text-foreground',
        'dark:[&[data-com-onepassword-filled]]:!bg-surface-900 dark:[&[data-com-onepassword-filled]]:!text-foreground',
        '[&[data-com-onepassword-filled]]:!-webkit-text-fill-color:var(--foreground)',
        'dark:[&[data-com-onepassword-filled]]:!-webkit-text-fill-color:var(--foreground)',
        '[&[data-com-onepassword-filled]]:shadow-[0_0_0_1000px_rgb(var(--surface-100))_inset]',
        'dark:[&[data-com-onepassword-filled]]:shadow-[0_0_0_1000px_rgb(var(--surface-900))_inset]',
        // Bitwarden specific overrides
        '[&[data-bwfilled]]:!bg-surface-100 [&[data-bwfilled]]:!text-foreground',
        'dark:[&[data-bwfilled]]:!bg-surface-900 dark:[&[data-bwfilled]]:!text-foreground',
        '[&[data-bwfilled]]:!-webkit-text-fill-color:var(--foreground)',
        'dark:[&[data-bwfilled]]:!-webkit-text-fill-color:var(--foreground)',
        '[&[data-bwfilled]]:shadow-[0_0_0_1000px_rgb(var(--surface-100))_inset]',
        'dark:[&[data-bwfilled]]:shadow-[0_0_0_1000px_rgb(var(--surface-900))_inset]',
        // LastPass specific overrides
        '[&[data-lastpass-icon-root]]:!bg-surface-100 [&[data-lastpass-icon-root]]:!text-foreground',
        'dark:[&[data-lastpass-icon-root]]:!bg-surface-900 dark:[&[data-lastpass-icon-root]]:!text-foreground',
        '[&[data-lastpass-icon-root]]:!-webkit-text-fill-color:var(--foreground)',
        'dark:[&[data-lastpass-icon-root]]:!-webkit-text-fill-color:var(--foreground)',
        '[&[data-lastpass-icon-root]]:shadow-[0_0_0_1000px_rgb(var(--surface-100))_inset]',
        'dark:[&[data-lastpass-icon-root]]:shadow-[0_0_0_1000px_rgb(var(--surface-900))_inset]',
        // Dashlane specific overrides
        '[&[data-dashlane-fill]]:!bg-surface-100 [&[data-dashlane-fill]]:!text-foreground',
        'dark:[&[data-dashlane-fill]]:!bg-surface-900 dark:[&[data-dashlane-fill]]:!text-foreground',
        '[&[data-dashlane-fill]]:!-webkit-text-fill-color:var(--foreground)',
        'dark:[&[data-dashlane-fill]]:!-webkit-text-fill-color:var(--foreground)',
        '[&[data-dashlane-fill]]:shadow-[0_0_0_1000px_rgb(var(--surface-100))_inset]',
        'dark:[&[data-dashlane-fill]]:shadow-[0_0_0_1000px_rgb(var(--surface-900))_inset]',
        // Generic password manager overrides
        '[&[data-1p-ignore]]:!bg-surface-100 [&[data-1p-ignore]]:!text-foreground',
        'dark:[&[data-1p-ignore]]:!bg-surface-900 dark:[&[data-1p-ignore]]:!text-foreground',
        '[&[data-1p-ignore]]:!-webkit-text-fill-color:var(--foreground)',
        'dark:[&[data-1p-ignore]]:!-webkit-text-fill-color:var(--foreground)',
        '[&[data-1p-ignore]]:shadow-[0_0_0_1000px_rgb(var(--surface-100))_inset]',
        'dark:[&[data-1p-ignore]]:shadow-[0_0_0_1000px_rgb(var(--surface-900))_inset]',
        'transition-all duration-150',
    ],
    {
        defaultVariants: {
            error: false,
            shape: 'rounded',
            size: 'md',
        },
        variants: {
            error: {
                false: '',
                true: 'bg-destructive-100 dark:bg-destructive-950 border-destructive dark:border-destructive focus-visible:outline-destructive dark:focus-visible:outline-destructive',
            },
            shape: {
                pill: 'rounded-full',
                rounded: 'rounded-xl',
                'rounded-lg': 'rounded-3xl',
                'rounded-sm': 'rounded-lg',
                square: 'rounded-none',
            },
            size: {
                // Height-based sizing aligned with button system for visual harmony
                xs: 'h-8 px-3 py-0 text-xs', // 32px - Dense UIs (matches button xs)
                sm: 'h-9 px-4 py-0 text-xs', // 36px - Compact (matches button sm)
                md: 'h-10 px-5 py-0 text-sm', // 40px - Default (matches button md)
                lg: 'h-12 px-6 py-0 text-base', // 48px - Mobile-friendly ✅ WCAG AAA (matches button lg)
                xl: 'h-14 px-8 py-0 text-lg', // 56px - Emphasized (matches button xl)
                onboarding: 'h-16 px-10 py-0 text-lg font-semibold tracking-tight', // 64px - Optimal for conversion (matches button onboarding)
            },
        },
    },
);

export type InputProps = {
    placeholder?: React.InputHTMLAttributes<HTMLInputElement>['placeholder'];
    id?: React.InputHTMLAttributes<HTMLInputElement>['id'];
    type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url' | 'date';
    name?: React.InputHTMLAttributes<HTMLInputElement>['name'];
    value?: React.InputHTMLAttributes<HTMLInputElement>['value'];
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    disabled?: boolean;
    required?: boolean;
    autoFocus?: boolean;
    autoComplete?: string;
    maxLength?: number;
    minLength?: number;
    pattern?: string;
    readOnly?: boolean;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'onboarding';
    shape?: 'rounded' | 'rounded-lg' | 'rounded-sm' | 'pill' | 'square';
    hasError?: boolean;
    ref?: React.ForwardedRef<HTMLInputElement>;
    className?: string;
} & VariantProps<typeof inputVariants>;

const Input = React.forwardRef<
    HTMLInputElement,
    InputProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'shape' | 'ref'>
>(({ className, hasError = false, shape = 'rounded', size = 'md', type = 'text', ...props }, ref) => {
    const [shouldShowPassword, setShowPassword] = React.useState(false);
    const reactId = React.useId();
    const inputId = props.id || `input-${reactId}`;
    const toggleId = `${inputId}-toggle`;

    const handleTogglePassword = () => {
        setShowPassword(!shouldShowPassword);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleTogglePassword();
        }
    };

    return (
        <div className={cn('relative flex w-full flex-row', size, shape)}>
            <input
                ref={ref}
                aria-describedby={hasError ? `${inputId}-error` : undefined}
                aria-invalid={hasError}
                className={cn('w-full', inputVariants({ error: hasError, shape, size }), className)}
                id={inputId}
                type={type === 'password' && shouldShowPassword ? 'text' : type}
                {...props}
            />
            {type === 'password' && (
                <button
                    aria-controls={inputId}
                    aria-label={shouldShowPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={shouldShowPassword}
                    className={cn(
                        'text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground focus-visible:text-primary dark:focus-visible:text-primary absolute top-0 right-0 h-full outline-none',
                        // Size-responsive padding
                        size === 'xs' && 'px-3',
                        size === 'sm' && 'px-4',
                        size === 'md' && 'px-5',
                        size === 'lg' && 'px-6',
                        size === 'xl' && 'px-8',
                        size === 'onboarding' && 'px-10',
                    )}
                    id={toggleId}
                    title={shouldShowPassword ? 'Hide password' : 'Show password'}
                    type="button"
                    onClick={handleTogglePassword}
                    onKeyDown={handleKeyDown}
                >
                    {shouldShowPassword ? (
                        <svg
                            className={cn(
                                'text-current transition-colors',
                                // Size-responsive icon sizing
                                size === 'xs' && 'size-3.5',
                                size === 'sm' && 'size-4',
                                (size === 'md' || !size) && 'size-4',
                                size === 'lg' && 'size-5',
                                size === 'xl' && 'size-6',
                                size === 'onboarding' && 'size-6',
                            )}
                            fill="none"
                            height="24"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            width="24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" x2="23" y1="1" y2="23" />
                        </svg>
                    ) : (
                        <svg
                            className={cn(
                                'text-current transition-colors',
                                // Size-responsive icon sizing
                                size === 'xs' && 'size-3.5',
                                size === 'sm' && 'size-4',
                                (size === 'md' || !size) && 'size-4',
                                size === 'lg' && 'size-5',
                                size === 'xl' && 'size-6',
                                size === 'onboarding' && 'size-6',
                            )}
                            fill="none"
                            height="24"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            width="24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                        </svg>
                    )}
                </button>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export { Input };
