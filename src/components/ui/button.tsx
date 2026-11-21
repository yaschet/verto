/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { Slot } from '@radix-ui/react-slot';
import { type VariantProps, cva } from 'class-variance-authority';
import * as React from 'react';
import { Fragment } from 'react';
import Spinner from '@components/ui/spinner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@components/ui/tooltip';
import { cn } from '@library/utils';

const buttonVariants = cva(
    [
        'group relative inline-flex size-auto items-center justify-center gap-2 px-4 py-2 text-sm font-bold whitespace-nowrap select-none',
        'transition-all duration-200 ease-out',
        'disabled:cursor-not-allowed disabled:select-none',
        'transform-gpu cursor-pointer',
        'hover:cursor-pointer',
        'active:duration-75',
        'font-bold',
        // Overflow handling for gradient backgrounds (overflow-visible allows badges to extend outside)
        'isolate overflow-visible',
        // Gradient background layer using after pseudo-element (rounded-[inherit] ensures it matches button's border-radius)
        "after:pointer-events-none after:absolute after:inset-0 after:-z-10 after:rounded-[inherit] after:transition-opacity after:duration-200 after:ease-out after:content-['']",
        // A11y-first focus - Ring based (WCAG 2.4.7 compliant)
        'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'transition-[color,background-color,border-color,ring-color,ring-offset-color,text-decoration-color,fill,stroke,--tw-gradient-from,--tw-gradient-to,--tw-gradient-stops] duration-200 ease-out',
        'focus-visible:after:opacity-75',
        // Compound state combinations
        'disabled:focus-visible:ring-transparent',
    ],
    {
        compoundVariants: [
            // * Plain Variant - subtle gradient backgrounds on hover
            {
                className: [
                    'text-foreground dark:text-foreground',
                    // Override defaults to prevent flicker
                    'bg-transparent hover:bg-transparent focus-visible:bg-transparent active:bg-transparent dark:bg-transparent dark:hover:bg-transparent dark:focus-visible:bg-transparent dark:active:bg-transparent',
                    // Gradient setup with transition
                    'bg-gradient-to-br from-transparent to-transparent transition-[color,background-color,border-color,ring-color,ring-offset-color,--tw-gradient-from,--tw-gradient-to,--tw-gradient-stops]',
                    'hover:from-surface-2 hover:to-surface-3 focus-visible:from-surface-2 focus-visible:to-surface-3 active:from-surface-3 active:to-surface-4 focus-visible:active:from-surface-3 focus-visible:active:to-surface-4',
                    'dark:hover:from-surface-2 dark:hover:to-surface-3 dark:focus-visible:from-surface-2 dark:focus-visible:to-surface-3 dark:active:from-surface-3 dark:active:to-surface-4 dark:focus-visible:active:from-surface-3 dark:focus-visible:active:to-surface-4',
                    'focus-visible:ring-primary-500 dark:focus-visible:ring-primary-500',
                    'after:hidden',
                ],
                color: 'default',
                variant: 'plain',
            },
            {
                className: [
                    'text-primary-950 dark:text-primary-50',
                    // Override defaults
                    'bg-transparent hover:bg-transparent focus-visible:bg-transparent active:bg-transparent dark:bg-transparent dark:hover:bg-transparent dark:focus-visible:bg-transparent dark:active:bg-transparent',
                    // Gradient setup
                    'bg-gradient-to-br from-transparent to-transparent transition-[color,background-color,border-color,ring-color,ring-offset-color,--tw-gradient-from,--tw-gradient-to,--tw-gradient-stops]',
                    'hover:from-primary-100 hover:to-primary-200 focus-visible:from-primary-100 focus-visible:to-primary-200 active:from-primary-200 active:to-primary-300 focus-visible:active:from-primary-200 focus-visible:active:to-primary-300',
                    'dark:hover:from-primary-900 dark:hover:to-primary-800 dark:focus-visible:from-primary-900 dark:focus-visible:to-primary-800 dark:active:from-primary-950 dark:active:to-primary-900 dark:focus-visible:active:from-primary-950 dark:focus-visible:active:to-primary-900',
                    'hover:text-primary-800 focus-visible:text-primary-800 active:text-primary-900 focus-visible:active:text-primary-900 dark:hover:text-primary-100 dark:focus-visible:text-primary-100 dark:active:text-primary-200 dark:focus-visible:active:text-primary-200',
                    'focus-visible:ring-primary-500 dark:focus-visible:ring-primary-500',
                    'after:hidden',
                ],
                color: 'primary',
                variant: 'plain',
            },
            {
                className: [
                    'text-secondary-500 dark:text-secondary-500',
                    // Override defaults
                    'bg-transparent hover:bg-transparent focus-visible:bg-transparent active:bg-transparent dark:bg-transparent dark:hover:bg-transparent dark:focus-visible:bg-transparent dark:active:bg-transparent',
                    // Gradient setup
                    'bg-gradient-to-br from-transparent to-transparent transition-[color,background-color,border-color,ring-color,ring-offset-color,--tw-gradient-from,--tw-gradient-to,--tw-gradient-stops]',
                    'hover:from-secondary-100 hover:to-secondary-200 focus-visible:from-secondary-100 focus-visible:to-secondary-200 active:from-secondary-200 active:to-secondary-300 focus-visible:active:from-secondary-200 focus-visible:active:to-secondary-300',
                    'dark:hover:from-secondary-950 dark:hover:to-secondary-900 dark:focus-visible:from-secondary-950 dark:focus-visible:to-secondary-900 dark:active:from-secondary-900 dark:active:to-secondary-800 dark:focus-visible:active:from-secondary-900 dark:focus-visible:active:to-secondary-800',
                    'hover:text-secondary-600 focus-visible:text-secondary-600 active:text-secondary-700 focus-visible:active:text-secondary-700 dark:hover:text-secondary-400 dark:focus-visible:text-secondary-400 dark:active:text-secondary-300 dark:focus-visible:active:text-secondary-300',
                    'focus-visible:ring-secondary-500 dark:focus-visible:ring-secondary-500',
                    'after:hidden',
                ],
                color: 'secondary',
                variant: 'plain',
            },
            {
                className: [
                    'text-accent-500 dark:text-accent-500',
                    // Override defaults
                    'bg-transparent hover:bg-transparent focus-visible:bg-transparent active:bg-transparent dark:bg-transparent dark:hover:bg-transparent dark:focus-visible:bg-transparent dark:active:bg-transparent',
                    // Gradient setup
                    'bg-gradient-to-br from-transparent to-transparent transition-[color,background-color,border-color,ring-color,ring-offset-color,--tw-gradient-from,--tw-gradient-to,--tw-gradient-stops]',
                    'hover:from-accent-100 hover:to-accent-200 focus-visible:from-accent-100 focus-visible:to-accent-200 active:from-accent-200 active:to-accent-300 focus-visible:active:from-accent-200 focus-visible:active:to-accent-300',
                    'dark:hover:from-accent-950 dark:hover:to-accent-900 dark:focus-visible:from-accent-950 dark:focus-visible:to-accent-900 dark:active:from-accent-900 dark:active:to-accent-800 dark:focus-visible:active:from-accent-900 dark:focus-visible:active:to-accent-800',
                    'hover:text-accent-600 focus-visible:text-accent-600 active:text-accent-700 focus-visible:active:text-accent-700 dark:hover:text-accent-400 dark:focus-visible:text-accent-400 dark:active:text-accent-300 dark:focus-visible:active:text-accent-300',
                    'focus-visible:ring-accent-500 dark:focus-visible:ring-accent-500',
                    'after:hidden',
                ],
                color: 'accent',
                variant: 'plain',
            },
            {
                className: [
                    'text-success-500 dark:text-success-500',
                    // Override defaults
                    'bg-transparent hover:bg-transparent focus-visible:bg-transparent active:bg-transparent dark:bg-transparent dark:hover:bg-transparent dark:focus-visible:bg-transparent dark:active:bg-transparent',
                    // Gradient setup
                    'bg-gradient-to-br from-transparent to-transparent transition-[color,background-color,border-color,ring-color,ring-offset-color,--tw-gradient-from,--tw-gradient-to,--tw-gradient-stops]',
                    'hover:from-success-100 hover:to-success-200 focus-visible:from-success-100 focus-visible:to-success-200 active:from-success-200 active:to-success-300 focus-visible:active:from-success-200 focus-visible:active:to-success-300',
                    'dark:hover:from-success-950 dark:hover:to-success-900 dark:focus-visible:from-success-950 dark:focus-visible:to-success-900 dark:active:from-success-900 dark:active:to-success-800 dark:focus-visible:active:from-success-900 dark:focus-visible:active:to-success-800',
                    'hover:text-success-600 focus-visible:text-success-600 active:text-success-700 focus-visible:active:text-success-700 dark:hover:text-success-400 dark:focus-visible:text-success-400 dark:active:text-success-300 dark:focus-visible:active:text-success-300',
                    'focus-visible:ring-success-500 dark:focus-visible:ring-success-500',
                    'after:hidden',
                ],
                color: 'success',
                variant: 'plain',
            },
            {
                className: [
                    'text-warning-500 dark:text-warning-500',
                    // Override defaults
                    'bg-transparent hover:bg-transparent focus-visible:bg-transparent active:bg-transparent dark:bg-transparent dark:hover:bg-transparent dark:focus-visible:bg-transparent dark:active:bg-transparent',
                    // Gradient setup
                    'bg-gradient-to-br from-transparent to-transparent transition-[color,background-color,border-color,ring-color,ring-offset-color,--tw-gradient-from,--tw-gradient-to,--tw-gradient-stops]',
                    'hover:from-warning-100 hover:to-warning-200 focus-visible:from-warning-100 focus-visible:to-warning-200 active:from-warning-200 active:to-warning-300 focus-visible:active:from-warning-200 focus-visible:active:to-warning-300',
                    'dark:hover:from-warning-950 dark:hover:to-warning-900 dark:focus-visible:from-warning-950 dark:focus-visible:to-warning-900 dark:active:from-warning-900 dark:active:to-warning-800 dark:focus-visible:active:from-warning-900 dark:focus-visible:active:to-warning-800',
                    'hover:text-warning-600 focus-visible:text-warning-600 active:text-warning-700 focus-visible:active:text-warning-700 dark:hover:text-warning-400 dark:focus-visible:text-warning-400 dark:active:text-warning-300 dark:focus-visible:active:text-warning-300',
                    'focus-visible:ring-warning-500 dark:focus-visible:ring-warning-500',
                    'after:hidden',
                ],
                color: 'warning',
                variant: 'plain',
            },
            {
                className: [
                    'text-info-500 dark:text-info-500',
                    // Override defaults
                    'bg-transparent hover:bg-transparent focus-visible:bg-transparent active:bg-transparent dark:bg-transparent dark:hover:bg-transparent dark:focus-visible:bg-transparent dark:active:bg-transparent',
                    // Gradient setup
                    'bg-gradient-to-br from-transparent to-transparent transition-[color,background-color,border-color,ring-color,ring-offset-color,--tw-gradient-from,--tw-gradient-to,--tw-gradient-stops]',
                    'hover:from-info-100 hover:to-info-200 focus-visible:from-info-100 focus-visible:to-info-200 active:from-info-200 active:to-info-300 focus-visible:active:from-info-200 focus-visible:active:to-info-300',
                    'dark:hover:from-info-950 dark:hover:to-info-900 dark:focus-visible:from-info-950 dark:focus-visible:to-info-900 dark:active:from-info-900 dark:active:to-info-800 dark:focus-visible:active:from-info-900 dark:focus-visible:active:to-info-800',
                    'hover:text-info-600 focus-visible:text-info-600 active:text-info-700 focus-visible:active:text-info-700 dark:hover:text-info-400 dark:focus-visible:text-info-400 dark:active:text-info-300 dark:focus-visible:active:text-info-300',
                    'focus-visible:ring-info-500 dark:focus-visible:ring-info-500',
                    'after:hidden',
                ],
                color: 'info',
                variant: 'plain',
            },
            {
                className: [
                    'text-destructive-500 dark:text-destructive-500',
                    // Override defaults
                    'bg-transparent hover:bg-transparent focus-visible:bg-transparent active:bg-transparent dark:bg-transparent dark:hover:bg-transparent dark:focus-visible:bg-transparent dark:active:bg-transparent',
                    // Gradient setup
                    'bg-gradient-to-br from-transparent to-transparent transition-[color,background-color,border-color,ring-color,ring-offset-color,--tw-gradient-from,--tw-gradient-to,--tw-gradient-stops]',
                    'hover:from-destructive-50 hover:to-destructive-100 focus-visible:from-destructive-50 focus-visible:to-destructive-100 active:from-destructive-200 active:to-destructive-300 focus-visible:active:from-destructive-200 focus-visible:active:to-destructive-300',
                    'dark:hover:from-destructive-950 dark:hover:to-destructive-900 dark:focus-visible:from-destructive-950 dark:focus-visible:to-destructive-900 dark:active:from-destructive-900 dark:active:to-destructive-800 dark:focus-visible:active:from-destructive-900 dark:focus-visible:active:to-destructive-800',
                    'hover:text-destructive-600 focus-visible:text-destructive-600 active:text-destructive-700 focus-visible:active:text-destructive-700 dark:hover:text-destructive-400 dark:focus-visible:text-destructive-400 dark:active:text-destructive-300 dark:focus-visible:active:text-destructive-300',
                    'focus-visible:ring-destructive-500 dark:focus-visible:ring-destructive-500',
                    'after:hidden',
                ],
                color: 'destructive',
                variant: 'plain',
            },
            // * Outlined Variant - gradient borders and backgrounds
            {
                className: [
                    'border-surface-200 from-surface-50 to-surface-100 text-surface-950 hover:from-surface-100 hover:to-surface-200 focus-visible:from-surface-100 focus-visible:to-surface-200 hover:text-surface-900 focus-visible:text-surface-900 active:from-surface-200 active:to-surface-300 active:text-surface-950 focus-visible:active:from-surface-200 focus-visible:active:to-surface-300 focus-visible:active:text-surface-950 dark:border-surface-800 dark:from-surface-950 dark:to-surface-900 dark:text-surface-50 dark:hover:from-surface-900 dark:hover:to-surface-800 dark:focus-visible:from-surface-900 dark:focus-visible:to-surface-800 dark:hover:text-surface-100 dark:focus-visible:text-surface-100 dark:active:from-surface-800 dark:active:to-surface-700 dark:active:text-surface-50 dark:focus-visible:active:from-surface-800 dark:focus-visible:active:to-surface-700 dark:focus-visible:active:text-surface-50 border bg-gradient-to-br hover:bg-gradient-to-br focus-visible:bg-gradient-to-br active:bg-gradient-to-br dark:bg-gradient-to-br dark:hover:bg-gradient-to-br dark:focus-visible:bg-gradient-to-br dark:active:bg-gradient-to-br',
                    'focus-visible:ring-2 focus-visible:ring-primary-500 dark:focus-visible:ring-primary-500',
                    'after:hidden',
                ],
                color: 'default',
                variant: 'outlined',
            },
            {
                className: [
                    'border-primary-200 from-primary-50 to-primary-100 text-primary-950 hover:from-primary-100 hover:to-primary-200 focus-visible:from-primary-100 focus-visible:to-primary-200 hover:text-primary-800 focus-visible:text-primary-800 active:from-primary-200 active:to-primary-300 active:text-primary-900 focus-visible:active:from-primary-200 focus-visible:active:to-primary-300 focus-visible:active:text-primary-900 dark:border-primary-800 dark:from-primary-950 dark:to-primary-900 dark:text-primary-50 dark:hover:from-primary-900 dark:hover:to-primary-800 dark:focus-visible:from-primary-900 dark:focus-visible:to-primary-800 dark:hover:text-primary-100 dark:focus-visible:text-primary-100 dark:active:from-primary-800 dark:active:to-primary-700 dark:active:text-primary-200 dark:focus-visible:active:from-primary-800 dark:focus-visible:active:to-primary-700 dark:focus-visible:active:text-primary-200 border bg-gradient-to-br hover:bg-gradient-to-br focus-visible:bg-gradient-to-br active:bg-gradient-to-br dark:bg-gradient-to-br dark:hover:bg-gradient-to-br dark:focus-visible:bg-gradient-to-br dark:active:bg-gradient-to-br',
                    'focus-visible:ring-2 focus-visible:ring-primary-500 dark:focus-visible:ring-primary-500',
                    'after:hidden',
                ],
                color: 'primary',
                variant: 'outlined',
            },
            {
                className: [
                    'border-secondary-200 from-secondary-50 to-secondary-100 text-secondary-500 hover:from-secondary-100 hover:to-secondary-200 focus-visible:from-secondary-100 focus-visible:to-secondary-200 hover:text-secondary-600 focus-visible:text-secondary-600 active:from-secondary-200 active:to-secondary-300 active:text-secondary-600 focus-visible:active:from-secondary-200 focus-visible:active:to-secondary-300 focus-visible:active:text-secondary-600 dark:border-secondary-800 dark:from-secondary-950 dark:to-secondary-900 dark:text-secondary-500 dark:hover:from-secondary-900 dark:hover:to-secondary-800 dark:focus-visible:from-secondary-900 dark:focus-visible:to-secondary-800 dark:hover:text-secondary-400 dark:focus-visible:text-secondary-400 dark:active:from-secondary-800 dark:active:to-secondary-700 dark:active:text-secondary-300 dark:focus-visible:active:from-secondary-800 dark:focus-visible:active:to-secondary-700 dark:focus-visible:active:text-secondary-300 border bg-gradient-to-br hover:bg-gradient-to-br focus-visible:bg-gradient-to-br active:bg-gradient-to-br dark:bg-gradient-to-br dark:hover:bg-gradient-to-br dark:focus-visible:bg-gradient-to-br dark:active:bg-gradient-to-br',
                    'focus-visible:ring-2 focus-visible:ring-secondary-500 dark:focus-visible:ring-secondary-500',
                    'after:hidden',
                ],
                color: 'secondary',
                variant: 'outlined',
            },
            {
                className: [
                    'border-accent-200 from-accent-50 to-accent-100 text-accent-500 hover:from-accent-100 hover:to-accent-200 focus-visible:from-accent-100 focus-visible:to-accent-200 hover:text-accent-600 focus-visible:text-accent-600 active:from-accent-200 active:to-accent-300 active:text-accent-600 focus-visible:active:from-accent-200 focus-visible:active:to-accent-300 focus-visible:active:text-accent-600 dark:border-accent-800 dark:from-accent-950 dark:to-accent-900 dark:text-accent-500 dark:hover:from-accent-900 dark:hover:to-accent-800 dark:focus-visible:from-accent-900 dark:focus-visible:to-accent-800 dark:hover:text-accent-400 dark:focus-visible:text-accent-400 dark:active:from-accent-800 dark:active:to-accent-700 dark:active:text-accent-300 dark:focus-visible:active:from-accent-800 dark:focus-visible:active:to-accent-700 dark:focus-visible:active:text-accent-300 border bg-gradient-to-br hover:bg-gradient-to-br focus-visible:bg-gradient-to-br active:bg-gradient-to-br dark:bg-gradient-to-br dark:hover:bg-gradient-to-br dark:focus-visible:bg-gradient-to-br dark:active:bg-gradient-to-br',
                    'focus-visible:ring-2 focus-visible:ring-accent-500 dark:focus-visible:ring-accent-500',
                    'after:hidden',
                ],
                color: 'accent',
                variant: 'outlined',
            },
            {
                className: [
                    'border-success-200 from-success-50 to-success-100 text-success-500 hover:from-success-100 hover:to-success-200 focus-visible:from-success-100 focus-visible:to-success-200 hover:text-success-600 focus-visible:text-success-600 active:from-success-200 active:to-success-300 active:text-success-600 focus-visible:active:from-success-200 focus-visible:active:to-success-300 focus-visible:active:text-success-600 dark:border-success-800 dark:from-success-950 dark:to-success-900 dark:text-success-500 dark:hover:from-success-900 dark:hover:to-success-800 dark:focus-visible:from-success-900 dark:focus-visible:to-success-800 dark:hover:text-success-400 dark:focus-visible:text-success-400 dark:active:from-success-800 dark:active:to-success-700 dark:active:text-success-300 dark:focus-visible:active:from-success-800 dark:focus-visible:active:to-success-700 dark:focus-visible:active:text-success-300 border bg-gradient-to-br hover:bg-gradient-to-br focus-visible:bg-gradient-to-br active:bg-gradient-to-br dark:bg-gradient-to-br dark:hover:bg-gradient-to-br dark:focus-visible:bg-gradient-to-br dark:active:bg-gradient-to-br',
                    'focus-visible:ring-2 focus-visible:ring-success-500 dark:focus-visible:ring-success-500',
                    'after:hidden',
                ],
                color: 'success',
                variant: 'outlined',
            },
            {
                className: [
                    'border-warning-200 from-warning-50 to-warning-100 text-warning-500 hover:from-warning-100 hover:to-warning-200 focus-visible:from-warning-100 focus-visible:to-warning-200 hover:text-warning-600 focus-visible:text-warning-600 active:from-warning-200 active:to-warning-300 active:text-warning-600 focus-visible:active:from-warning-200 focus-visible:active:to-warning-300 focus-visible:active:text-warning-600 dark:border-warning-800 dark:from-warning-950 dark:to-warning-900 dark:text-warning-500 dark:hover:from-warning-900 dark:hover:to-warning-800 dark:focus-visible:from-warning-900 dark:focus-visible:to-warning-800 dark:hover:text-warning-400 dark:focus-visible:text-warning-400 dark:active:from-warning-800 dark:active:to-warning-700 dark:active:text-warning-300 dark:focus-visible:active:from-warning-800 dark:focus-visible:active:to-warning-700 dark:focus-visible:active:text-warning-300 border bg-gradient-to-br hover:bg-gradient-to-br focus-visible:bg-gradient-to-br active:bg-gradient-to-br dark:bg-gradient-to-br dark:hover:bg-gradient-to-br dark:focus-visible:bg-gradient-to-br dark:active:bg-gradient-to-br',
                    'focus-visible:ring-2 focus-visible:ring-warning-500 dark:focus-visible:ring-warning-500',
                    'after:hidden',
                ],
                color: 'warning',
                variant: 'outlined',
            },
            {
                className: [
                    'border-info-200 from-info-50 to-info-100 text-info-500 hover:from-info-100 hover:to-info-200 focus-visible:from-info-100 focus-visible:to-info-200 hover:text-info-600 focus-visible:text-info-600 active:from-info-200 active:to-info-300 active:text-info-600 focus-visible:active:from-info-200 focus-visible:active:to-info-300 focus-visible:active:text-info-600 dark:border-info-800 dark:from-info-950 dark:to-info-900 dark:text-info-500 dark:hover:from-info-900 dark:hover:to-info-800 dark:focus-visible:from-info-900 dark:focus-visible:to-info-800 dark:hover:text-info-400 dark:focus-visible:text-info-400 dark:active:from-info-800 dark:active:to-info-700 dark:active:text-info-300 dark:focus-visible:active:from-info-800 dark:focus-visible:active:to-info-700 dark:focus-visible:active:text-info-300 border bg-gradient-to-br hover:bg-gradient-to-br focus-visible:bg-gradient-to-br active:bg-gradient-to-br dark:bg-gradient-to-br dark:hover:bg-gradient-to-br dark:focus-visible:bg-gradient-to-br dark:active:bg-gradient-to-br',
                    'focus-visible:ring-2 focus-visible:ring-info-500 dark:focus-visible:ring-info-500',
                    'after:hidden',
                ],
                color: 'info',
                variant: 'outlined',
            },
            {
                className: [
                    'border-destructive-200 from-destructive-50 to-destructive-100 text-destructive-500 hover:from-destructive-100 hover:to-destructive-200 focus-visible:from-destructive-100 focus-visible:to-destructive-200 hover:text-destructive-600 focus-visible:text-destructive-600 active:from-destructive-200 active:to-destructive-300 active:text-destructive-600 focus-visible:active:from-destructive-200 focus-visible:active:to-destructive-300 focus-visible:active:text-destructive-600 dark:border-destructive-800 dark:from-destructive-950 dark:to-destructive-900 dark:text-destructive-500 dark:hover:from-destructive-900 dark:hover:to-destructive-800 dark:focus-visible:from-destructive-900 dark:focus-visible:to-destructive-800 dark:hover:text-destructive-400 dark:focus-visible:text-destructive-400 dark:active:from-destructive-800 dark:active:to-destructive-700 dark:active:text-destructive-300 dark:focus-visible:active:from-destructive-800 dark:focus-visible:active:to-destructive-700 dark:focus-visible:active:text-destructive-300 border bg-gradient-to-br hover:bg-gradient-to-br focus-visible:bg-gradient-to-br active:bg-gradient-to-br dark:bg-gradient-to-br dark:hover:bg-gradient-to-br dark:focus-visible:bg-gradient-to-br dark:active:bg-gradient-to-br',
                    'focus-visible:ring-2 focus-visible:ring-destructive-500 dark:focus-visible:ring-destructive-500',
                    'after:hidden',
                ],
                color: 'destructive',
                variant: 'outlined',
            },
            // * Soft Variant - NO borders, gradients visible at rest
            {
                className: [
                    'bg-surface-100 text-foreground hover:bg-surface-200 focus-visible:bg-surface-200 active:bg-surface-300 focus-visible:active:bg-surface-300 dark:bg-surface-900 dark:text-foreground dark:hover:bg-surface-800 dark:focus-visible:bg-surface-800 dark:active:bg-surface-700 dark:focus-visible:active:bg-surface-700',
                    'focus-visible:ring-primary-500 dark:focus-visible:ring-primary-500',
                    'after:from-surface-100/50 after:to-surface-200/30 after:bg-gradient-to-br',
                    'after:opacity-60 hover:after:opacity-85 focus-visible:after:opacity-85 active:after:opacity-70 focus-visible:active:after:opacity-70',
                ],
                color: 'default',
                variant: 'soft',
            },
            {
                className: [
                    'bg-primary-100 text-primary-950 hover:bg-primary-200 focus-visible:bg-primary-200 active:bg-primary-300 focus-visible:active:bg-primary-300 dark:bg-primary-900 dark:text-primary-50 dark:hover:bg-primary-800 dark:focus-visible:bg-primary-800 dark:active:bg-primary-900 dark:focus-visible:active:bg-primary-900',
                    'focus-visible:ring-primary-500 dark:focus-visible:ring-primary-500',
                    'after:from-primary-200/40 after:to-primary-300/20 after:bg-gradient-to-br',
                    'after:opacity-60 hover:after:opacity-85 focus-visible:after:opacity-85 active:after:opacity-70 focus-visible:active:after:opacity-70',
                ],
                color: 'primary',
                variant: 'soft',
            },
            {
                className: [
                    'bg-accent-100 text-accent-500 hover:bg-accent-200 hover:text-accent-600 focus-visible:bg-accent-200 focus-visible:text-accent-600 active:bg-accent-300 active:text-accent-700 focus-visible:active:bg-accent-300 focus-visible:active:text-accent-700 dark:bg-accent-950/50 dark:text-accent-500 dark:hover:bg-accent-950 dark:hover:text-accent-400 dark:focus-visible:bg-accent-950 dark:focus-visible:text-accent-400 dark:active:bg-accent-900 dark:active:text-accent-300 dark:focus-visible:active:bg-accent-900 dark:focus-visible:active:text-accent-300',
                    'focus-visible:ring-accent-500 dark:focus-visible:ring-accent-500',
                    'after:from-accent-200/40 after:to-accent-300/20 after:bg-gradient-to-br',
                    'after:opacity-60 hover:after:opacity-85 focus-visible:after:opacity-85 active:after:opacity-70 focus-visible:active:after:opacity-70',
                ],
                color: 'accent',
                variant: 'soft',
            },
            {
                className: [
                    'bg-success-100 text-success-500 hover:bg-success-200 hover:text-success-600 focus-visible:bg-success-200 focus-visible:text-success-600 active:bg-success-300 active:text-success-700 focus-visible:active:bg-success-300 focus-visible:active:text-success-700 dark:bg-success-950 dark:text-success-500 dark:hover:bg-success-800 dark:hover:text-success-400 dark:focus-visible:bg-success-800 dark:focus-visible:text-success-400 dark:active:bg-success-700 dark:active:text-success-300 dark:focus-visible:active:bg-success-700 dark:focus-visible:active:text-success-300',
                    'focus-visible:ring-success-500 dark:focus-visible:ring-success-500',
                    'after:from-success-200/40 after:to-success-300/20 after:bg-gradient-to-br',
                    'after:opacity-60 hover:after:opacity-85 focus-visible:after:opacity-85 active:after:opacity-70 focus-visible:active:after:opacity-70',
                ],
                color: 'success',
                variant: 'soft',
            },
            {
                className: [
                    'bg-secondary-100 text-secondary-500 hover:bg-secondary-200 hover:text-secondary-600 focus-visible:bg-secondary-200 focus-visible:text-secondary-600 active:bg-secondary-300 active:text-secondary-700 focus-visible:active:bg-secondary-300 focus-visible:active:text-secondary-700 dark:bg-secondary-950 dark:text-secondary-500 dark:hover:bg-secondary-800 dark:hover:text-secondary-400 dark:focus-visible:bg-secondary-800 dark:focus-visible:text-secondary-400 dark:active:bg-secondary-700 dark:active:text-secondary-300 dark:focus-visible:active:bg-secondary-700 dark:focus-visible:active:text-secondary-300',
                    'focus-visible:ring-secondary-500 dark:focus-visible:ring-secondary-500',
                    'after:from-secondary-200/40 after:to-secondary-300/20 after:bg-gradient-to-br',
                    'after:opacity-60 hover:after:opacity-85 focus-visible:after:opacity-85 active:after:opacity-70 focus-visible:active:after:opacity-70',
                ],
                color: 'secondary',
                variant: 'soft',
            },
            {
                className: [
                    'bg-warning-100 text-warning-500 hover:bg-warning-200 hover:text-warning-600 focus-visible:bg-warning-200 focus-visible:text-warning-600 active:bg-warning-300 active:text-warning-700 focus-visible:active:bg-warning-300 focus-visible:active:text-warning-700 dark:bg-warning-950 dark:text-warning-500 dark:hover:bg-warning-800 dark:hover:text-warning-400 dark:focus-visible:bg-warning-800 dark:focus-visible:text-warning-400 dark:active:bg-warning-700 dark:active:text-warning-300 dark:focus-visible:active:bg-warning-700 dark:focus-visible:active:text-warning-300',
                    'focus-visible:ring-warning-500 dark:focus-visible:ring-warning-500',
                    'after:from-warning-200/40 after:to-warning-300/20 after:bg-gradient-to-br',
                    'after:opacity-60 hover:after:opacity-85 focus-visible:after:opacity-85 active:after:opacity-70 focus-visible:active:after:opacity-70',
                ],
                color: 'warning',
                variant: 'soft',
            },
            {
                className: [
                    'bg-info-100 text-info-500 hover:bg-info-200 hover:text-info-600 focus-visible:bg-info-200 focus-visible:text-info-600 active:bg-info-300 active:text-info-700 focus-visible:active:bg-info-300 focus-visible:active:text-info-700 dark:bg-info-950 dark:text-info-500 dark:hover:bg-info-800 dark:hover:text-info-400 dark:focus-visible:bg-info-800 dark:focus-visible:text-info-400 dark:active:bg-info-700 dark:active:text-info-300 dark:focus-visible:active:bg-info-700 dark:focus-visible:active:text-info-300',
                    'focus-visible:ring-info-500 dark:focus-visible:ring-info-500',
                    'after:from-info-200/40 after:to-info-300/20 after:bg-gradient-to-br',
                    'after:opacity-60 hover:after:opacity-85 focus-visible:after:opacity-85 active:after:opacity-70 focus-visible:active:after:opacity-70',
                ],
                color: 'info',
                variant: 'soft',
            },
            {
                className: [
                    'bg-destructive-100 text-destructive-500 hover:bg-destructive-200 hover:text-destructive-600 focus-visible:bg-destructive-200 focus-visible:text-destructive-600 active:bg-destructive-300 active:text-destructive-700 focus-visible:active:bg-destructive-300 focus-visible:active:text-destructive-700 dark:bg-destructive-950 dark:text-destructive-500 dark:hover:bg-destructive-900 dark:hover:text-destructive-400 dark:focus-visible:bg-destructive-900 dark:focus-visible:text-destructive-400 dark:active:bg-destructive-800 dark:active:text-destructive-300 dark:focus-visible:active:bg-destructive-800 dark:focus-visible:active:text-destructive-300',
                    'focus-visible:ring-destructive-500 dark:focus-visible:ring-destructive-500',
                    'after:from-destructive-200/40 after:to-destructive-300/20 after:bg-gradient-to-br',
                    'after:opacity-60 hover:after:opacity-85 focus-visible:after:opacity-85 active:after:opacity-70 focus-visible:active:after:opacity-70',
                ],
                color: 'destructive',
                variant: 'soft',
            },
            // * Solid Variant - strong colors, gradients visible at rest
            {
                className: [
                    'bg-surface-950 text-surface-100 hover:bg-surface-900 focus-visible:bg-surface-900 active:bg-surface-900 focus-visible:active:bg-surface-900 dark:bg-surface-50 dark:text-surface-900 dark:hover:bg-surface-200 dark:focus-visible:bg-surface-200 dark:active:bg-surface-100 dark:focus-visible:active:bg-surface-100',
                    'after:bg-gradient-to-br after:from-white/20 after:via-white/10 after:to-transparent',
                    'after:opacity-70 hover:after:opacity-90 focus-visible:after:opacity-90 active:after:opacity-80 focus-visible:active:after:opacity-80',
                    'focus-visible:ring-primary-500 dark:focus-visible:ring-primary-500',
                ],
                color: 'default',
                variant: 'solid',
            },
            {
                className: [
                    'bg-primary-950 text-primary-50 hover:bg-primary-900 focus-visible:bg-primary-900 active:bg-primary-800 focus-visible:active:bg-primary-800 dark:bg-primary-50 dark:text-primary-950 dark:hover:bg-primary-200 dark:focus-visible:bg-primary-200 dark:active:bg-primary-100 dark:focus-visible:active:bg-primary-100',
                    'after:from-primary-300/40 after:via-primary-400/20 after:bg-gradient-to-br after:to-transparent',
                    'after:opacity-75 hover:after:opacity-95 focus-visible:after:opacity-95 active:after:opacity-85 focus-visible:active:after:opacity-85',
                    'focus-visible:ring-primary-500 dark:focus-visible:ring-primary-500',
                ],
                color: 'primary',
                variant: 'solid',
            },
            {
                className: [
                    'bg-secondary-500 text-secondary-50 hover:bg-secondary-600 focus-visible:bg-secondary-600 active:bg-secondary-700 focus-visible:active:bg-secondary-700 dark:bg-secondary-500 dark:text-secondary-50 dark:hover:bg-secondary-600 dark:focus-visible:bg-secondary-600 dark:active:bg-secondary-700 dark:focus-visible:active:bg-secondary-700',
                    'after:from-secondary-200/50 after:via-secondary-300/30 after:bg-gradient-to-br after:to-transparent',
                    'after:opacity-75 hover:after:opacity-95 focus-visible:after:opacity-95 active:after:opacity-85 focus-visible:active:after:opacity-85',
                    'focus-visible:ring-secondary-500 dark:focus-visible:ring-secondary-500',
                ],
                color: 'secondary',
                variant: 'solid',
            },
            {
                className: [
                    'bg-accent-surface text-accent-foreground hover:bg-accent-surface-2 focus-visible:bg-accent-surface-2 active:bg-accent-surface-1 active:text-accent-foreground-1 focus-visible:active:bg-accent-surface-1 focus-visible:active:text-accent-foreground-1',
                    'after:from-accent-200/50 after:via-accent-300/30 after:bg-gradient-to-br after:to-transparent',
                    'after:opacity-75 hover:after:opacity-95 focus-visible:after:opacity-95 active:after:opacity-85 focus-visible:active:after:opacity-85',
                    'focus-visible:ring-accent-500 dark:focus-visible:ring-accent-500',
                ],
                color: 'accent',
                variant: 'solid',
            },
            {
                className: [
                    'bg-success-surface text-success-foreground hover:bg-success-surface-2 focus-visible:bg-success-surface-2 dark:hover:bg-success-surface-2 dark:focus-visible:bg-success-surface-2 active:bg-success-surface-1 active:text-success-foreground-1 focus-visible:active:bg-success-surface-1 focus-visible:active:text-success-foreground-1',
                    'after:from-success-200/50 after:via-success-300/30 after:bg-gradient-to-br after:to-transparent',
                    'after:opacity-75 hover:after:opacity-95 focus-visible:after:opacity-95 active:after:opacity-85 focus-visible:active:after:opacity-85',
                    'focus-visible:ring-success-300 dark:focus-visible:ring-success-300',
                ],
                color: 'success',
                variant: 'solid',
            },
            {
                className: [
                    'bg-warning-surface text-warning-foreground hover:bg-warning-surface-2 focus-visible:bg-warning-surface-2 active:bg-warning-surface-1 active:text-warning-foreground-1 focus-visible:active:bg-warning-surface-1 focus-visible:active:text-warning-foreground-1',
                    'after:from-warning-200/50 after:via-warning-300/30 after:bg-gradient-to-br after:to-transparent',
                    'after:opacity-75 hover:after:opacity-95 focus-visible:after:opacity-95 active:after:opacity-85 focus-visible:active:after:opacity-85',
                    'focus-visible:ring-warning-300 dark:focus-visible:ring-warning-300',
                ],
                color: 'warning',
                variant: 'solid',
            },
            {
                className: [
                    'bg-info-surface text-info-foreground hover:bg-info-surface-2 focus-visible:bg-info-surface-2 active:bg-info-surface-1 active:text-info-foreground-1 focus-visible:active:bg-info-surface-1 focus-visible:active:text-info-foreground-1',
                    'after:from-info-200/50 after:via-info-300/30 after:bg-gradient-to-br after:to-transparent',
                    'after:opacity-75 hover:after:opacity-95 focus-visible:after:opacity-95 active:after:opacity-85 focus-visible:active:after:opacity-85',
                    'focus-visible:ring-info-300 dark:focus-visible:ring-info-300',
                ],
                color: 'info',
                variant: 'solid',
            },
            {
                className: [
                    'bg-destructive-surface text-destructive-foreground hover:bg-destructive-surface-2 focus-visible:bg-destructive-surface-2 active:bg-destructive-surface-1 active:text-destructive-foreground-1 focus-visible:active:bg-destructive-surface-1 focus-visible:active:text-destructive-foreground-1',
                    'after:from-destructive-200/50 after:via-destructive-300/30 after:bg-gradient-to-br after:to-transparent',
                    'after:opacity-75 hover:after:opacity-95 focus-visible:after:opacity-95 active:after:opacity-85 focus-visible:active:after:opacity-85',
                    'focus-visible:ring-destructive-300 dark:focus-visible:ring-destructive-300',
                ],
                color: 'destructive',
                variant: 'solid',
            },
        ],
        defaultVariants: {
            color: 'primary',
            shape: 'rounded',
            size: 'md',
            variant: 'solid',
        },
        variants: {
            color: {
                accent: 'bg-accent-500 text-accent-600 hover:bg-accent-600',
                default:
                    'bg-surface-950 text-surface-50 hover:bg-surface-900 active:bg-surface-800 dark:bg-surface-50 dark:text-surface-950 dark:hover:bg-surface-100 dark:active:bg-surface-200',
                destructive: 'bg-destructive-500 text-destructive-50 hover:bg-destructive-600',
                info: 'bg-info-500 text-info-600 hover:bg-info-600',
                primary: 'bg-primary-600 text-primary-600 hover:bg-primary-600',
                secondary: 'bg-secondary-500 text-secondary-600 hover:bg-secondary-600',
                success: 'bg-success-600 text-success-700 hover:bg-success-700',
                warning: 'bg-warning-500 text-warning-600 hover:bg-warning-600',
            },
            shape: {
                pill: 'rounded-full',
                rounded: 'rounded-xl',
                'rounded-lg': 'rounded-3xl',
                'rounded-sm': 'rounded-sm',
                square: 'rounded-none',
            },
            size: {
                icon: 'aspect-square h-auto p-2',
                'icon-lg': 'aspect-square h-auto p-3',
                'icon-md': 'aspect-square h-auto p-2',
                'icon-sm': 'aspect-square h-auto p-1.5',
                'icon-xl': 'aspect-square h-auto p-3',
                'icon-xs': 'aspect-square h-auto p-1',
                lg: 'px-5 py-3 text-sm',
                md: 'px-4 py-2 text-sm',
                sm: 'px-3 py-1.5 text-xs',
                xl: 'px-6 py-3 text-lg',
                xs: cn('px-2.5 py-1 text-xs'),
            },
            variant: {
                outlined: 'border',
                plain: '',
                soft: '',
                solid: '',
            },
        },
    },
);

export type ButtonProps = {
    asChild?: boolean;
    children: React.ReactNode;
    className?: string;
    ref?: React.ForwardedRef<HTMLButtonElement>;
    variant?: 'plain' | 'outlined' | 'soft' | 'solid';
    color?: 'default' | 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'info' | 'destructive';
    size?:
        | 'xs'
        | 'sm'
        | 'md'
        | 'lg'
        | 'xl'
        | 'icon'
        | 'icon-xs'
        | 'icon-sm'
        | 'icon-md'
        | 'icon-lg'
        | 'icon-xl';
    shape?: 'rounded' | 'pill' | 'square' | 'rounded-lg' | 'rounded-sm';
    disabled?: boolean;
    loading?: boolean;

    // ? - Tooltip Props:
    // Provider:
    showTooltip?: boolean;
    tooltipContent?: string;
    tooltipDelayDuration?: number;
    tooltipSkipDelayDuration?: number;

    // Content:
    tooltipSide?: 'top' | 'right' | 'bottom' | 'left';
    tooltipSideOffset?: number;
    tooltipAlign?: 'start' | 'center' | 'end';
    tooltipAlignOffset?: number;
    tooltipAvoidCollisions?: boolean;
    tooltipArrowPadding?: number;
    tooltipSticky?: 'partial' | 'always';
    tooltipHideWhenDetached?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement> &
    VariantProps<typeof buttonVariants>;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            variant,
            color,
            size,
            shape,
            asChild = false,
            disabled = false,
            loading = false,
            children,
            type = 'button',

            tooltipContent,
            showTooltip = !!tooltipContent,
            tooltipDelayDuration = 700,
            tooltipSkipDelayDuration = 300,

            tooltipSide = 'top',
            tooltipSideOffset = 8,
            tooltipAlign = 'center',
            tooltipAlignOffset = 0,
            tooltipAvoidCollisions = true,
            tooltipArrowPadding = 4,
            tooltipSticky = 'partial',
            tooltipHideWhenDetached = false,

            ...props
        },
        ref,
    ) => {
        const Comp = asChild ? Slot : 'button';

        if (showTooltip && typeof tooltipContent === 'string' && tooltipContent.length > 0) {
            return (
                <TooltipProvider
                    delayDuration={tooltipDelayDuration}
                    skipDelayDuration={tooltipSkipDelayDuration}
                >
                    <Tooltip delayDuration={50}>
                        <TooltipTrigger asChild>
                            <Comp
                                ref={ref}
                                aria-label={props['aria-label'] ?? tooltipContent}
                                className={cn(buttonVariants({ className, color, shape, size, variant }))}
                                disabled={loading ? true : disabled}
                                title={undefined}
                                type={type}
                                {...props}
                            >
                                {loading ? (
                                    <Fragment>
                                        <Spinner
                                            aria-hidden="true"
                                            className={cn(
                                                'text-current',
                                                (size === 'xs' || size?.startsWith('icon-xs')) && 'size-4',
                                                (size === 'sm' || size?.startsWith('icon-sm')) && 'size-5',
                                                (size === 'md' || size?.startsWith('icon-md')) && 'size-5',
                                                (size === 'lg' || size?.startsWith('icon-lg')) && 'size-5',
                                                (size === 'xl' || size?.startsWith('icon-xl')) && 'size-6',
                                            )}
                                            focusable="false"
                                            size="sm"
                                        />
                                        {children}
                                    </Fragment>
                                ) : (
                                    children
                                )}
                            </Comp>
                        </TooltipTrigger>
                        <TooltipContent
                            align={tooltipAlign}
                            alignOffset={tooltipAlignOffset}
                            arrowPadding={tooltipArrowPadding}
                            avoidCollisions={tooltipAvoidCollisions}
                            hideWhenDetached={tooltipHideWhenDetached}
                            side={tooltipSide}
                            sideOffset={tooltipSideOffset}
                            sticky={tooltipSticky}
                        >
                            {tooltipContent}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        }

        return (
            <Comp
                ref={ref}
                className={cn(buttonVariants({ className, color, shape, size, variant }))}
                disabled={loading ? true : disabled}
                title={undefined}
                type={type}
                {...props}
            >
                {loading ? (
                    <Fragment>
                        <Spinner
                            aria-hidden="true"
                            className="size-5 text-current"
                            focusable="false"
                            size="sm"
                        />
                        {children}
                    </Fragment>
                ) : (
                    children
                )}
            </Comp>
        );
    },
);

Button.displayName = 'Button';

export { Button, buttonVariants };
