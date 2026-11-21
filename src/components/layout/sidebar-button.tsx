/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import Link from 'next/link';
import * as React from 'react';
import { cn } from '@library/utils';

type SidebarButtonProps = {
    icon: React.ReactNode;
    label?: string | null | undefined | React.ReactNode;
    active?: boolean;
    isCollapsed?: boolean;
    href?: string;
    onClick?: () => void;
    variant?: 'solid' | 'plain';
    color?: 'primary' | 'secondary' | 'accent';
    className?: string;
};

function SidebarButtonComponent({
    active = false,
    className,
    color = 'primary',
    href,
    icon,
    isCollapsed = false,
    label,
    onClick,
    variant = 'solid',
}: SidebarButtonProps) {
    const baseClasses = cn(
        'relative flex h-11 items-center rounded-full font-bold px-4',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ring-0 ring-transparent',
        'active:scale-[0.95]',
        'transition-colors duration-150 ease-in-out',
        'transition-transform duration-75 ease-in-out',
        'transition-[width] duration-[280ms] ease-[cubic-bezier(0.22,0.08,0.25,1)]',
        isCollapsed ? 'w-11 justify-center gap-0' : 'w-full justify-start gap-3',
    );

    const variantClasses = {
        solid: {
            primary: active
                ? 'bg-primary-950 text-primary-50 hover:bg-primary-800 active:bg-primary-900 dark:bg-primary-50 dark:text-primary-950 dark:hover:bg-primary-200 dark:active:bg-primary-100'
                : 'bg-transparent text-primary-950 hover:bg-primary-100 hover:text-primary-800 active:bg-primary-100 active:text-primary-900 dark:text-primary-50 dark:hover:bg-primary-900 dark:hover:text-primary-100 dark:active:bg-primary-950 dark:active:text-primary-200',
            secondary: active
                ? 'bg-surface-950 text-surface-50 hover:bg-surface-900 active:bg-surface-900 dark:bg-surface-50 dark:text-surface-950 dark:hover:bg-surface-200 dark:active:bg-surface-100'
                : 'bg-transparent text-surface-700 hover:bg-surface-100 hover:text-surface-900 active:bg-surface-200 active:text-surface-950 dark:text-surface-300 dark:hover:bg-surface-900 dark:hover:text-surface-100 dark:active:bg-surface-800',
            accent: 'bg-accent-surface text-accent-foreground hover:bg-accent-surface-2 active:bg-accent-surface-1 active:text-accent-foreground-1',
        },
        plain: {
            primary: active
                ? 'bg-primary-950 text-primary-50 hover:bg-primary-800 active:bg-primary-900 dark:bg-primary-50 dark:text-primary-950 dark:hover:bg-primary-200 dark:active:bg-primary-100'
                : 'bg-transparent text-primary-950 hover:bg-primary-100 hover:text-primary-800 active:bg-primary-100 active:text-primary-900 dark:text-primary-50 dark:hover:bg-primary-900 dark:hover:text-primary-100 dark:active:bg-primary-950 dark:active:text-primary-200',
            secondary: active
                ? 'bg-surface-950 text-surface-50 hover:bg-surface-900 active:bg-surface-900 dark:bg-surface-50 dark:text-surface-950 dark:hover:bg-surface-200 dark:active:bg-surface-100'
                : 'bg-transparent text-surface-700 hover:bg-surface-100 hover:text-surface-900 active:bg-surface-200 active:text-surface-950 dark:text-surface-300 dark:hover:bg-surface-900 dark:hover:text-surface-100 dark:active:bg-surface-800',
            accent: active
                ? 'bg-accent-surface text-accent-foreground hover:bg-accent-surface-2 active:bg-accent-surface-1 active:text-accent-foreground-1'
                : 'bg-transparent text-accent-500 hover:bg-accent-100 hover:text-accent-600 active:bg-accent-200 active:text-accent-700 dark:text-accent-500 dark:hover:bg-accent-950 dark:hover:text-accent-400 dark:active:bg-accent-900 dark:active:text-accent-300',
        },
    };

    const buttonClasses = cn(baseClasses, variantClasses[variant][color], className);

    const content = (
        <>
            <span className="flex size-5 shrink-0 items-center justify-center">{icon}</span>
            {label && (
                <span
                    aria-hidden={isCollapsed}
                    className={cn(
                        'overflow-hidden text-sm font-bold whitespace-nowrap',
                        'transition-all duration-150 ease-in-out',
                        isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[10rem] opacity-100',
                    )}
                >
                    {label}
                </span>
            )}
        </>
    );

    if (href) {
        return (
            <Link className={buttonClasses} href={href} scroll={false} shallow={false}>
                {content}
            </Link>
        );
    }

    return (
        <button className={buttonClasses} type="button" onClick={onClick}>
            {content}
        </button>
    );
}

export const SidebarButton = React.memo(SidebarButtonComponent);
