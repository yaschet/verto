/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { CoinVerticalIcon, InvoiceIcon, ShoppingCartIcon, WarningIcon } from '@phosphor-icons/react';
import Link from 'next/link';
import React, { useEffect } from 'react';
import { toast } from 'sonner';
import { formatCreditsBalance } from '@/constants/credits';
import { Button } from '@components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from '@components/ui/dropdown-menu';
import { useBalanceData } from '@hooks/queries/auth/use-balance-data';
import { cn } from '@library/utils';
import type { ButtonProps } from '@components/ui/button';

function BalanceDisplay({
    className,
    color,
    size,
    tooltipContent,
    variant,
    ...props
}: React.HTMLAttributes<HTMLDivElement> & Omit<ButtonProps, 'children'>): React.ReactElement<
    React.HTMLAttributes<HTMLButtonElement>,
    'div'
> {
    const { data: creditsBalance, error, isError, isLoading, refetch } = useBalanceData();

    useEffect(() => {
        if (isError) {
            toast.error(error?.title ?? error?.message ?? 'Unable to fetch credits balance.', {
                description: error?.description ?? 'Please try again, or contact support.',
                id: 'credits-balance-error',
            });
        }
    }, [error, isError]);

    if (isError) {
        return (
            <Button
                aria-label="View balance and manage credits"
                className={cn('flex h-auto items-center justify-center gap-1', className)}
                color="destructive"
                size={size ?? 'md'}
                tooltipContent="Unable to fetch credits balance, click to retry."
                variant={variant ?? 'solid'}
                onClick={() => refetch()}
                {...props}
            >
                <WarningIcon className="size-5" color="currentColor" weight="duotone" />
                <span className="text-sm font-bold lining-nums">Retry</span>
            </Button>
        );
    }

    if (isLoading) {
        return (
            <Button
                disabled
                aria-label="View balance and manage credits."
                className={cn('flex h-auto items-center justify-center gap-1', className)}
                color={color ?? 'default'}
                size={size ?? 'md'}
                tooltipContent="Fetching credits balance..."
                variant={variant ?? 'solid'}
                {...props}
            >
                <CoinVerticalIcon className="size-5" color="currentColor" weight="duotone" />
                <span
                    aria-busy="true"
                    className={cn(
                        'relative',
                        'overflow-hidden',
                        'animate-none',
                        'rounded-xl',
                        'bg-muted dark:bg-muted',
                        'opacity-100',
                        'will-change-transform',
                        'h-5 w-12',
                    )}
                >
                    <span
                        className={cn(
                            'skeleton-inner',
                            'absolute inset-0',
                            'animate-[shimmer_2s_infinite]',
                            'rounded-xl',
                            'bg-linear-to-r',
                            'via-surface-800 dark:via-surface-200 from-transparent to-transparent',
                        )}
                        style={{ width: '200%' }}
                    />
                </span>
                <span className="text-surface-600 dark:text-surface-400 text-xs font-semibold">VTC</span>
            </Button>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    aria-label="View balance and manage credits."
                    className={cn('flex h-auto items-center justify-center gap-1', className)}
                    color={color ?? 'default'}
                    size={size ?? 'md'}
                    tooltipContent={tooltipContent ?? 'View balance and manage credits.'}
                    variant={variant ?? 'solid'}
                    {...props}
                >
                    <CoinVerticalIcon className="size-5" color="currentColor" weight="duotone" />
                    <span className="text-sm font-bold lining-nums">
                        {formatCreditsBalance(creditsBalance ?? 0)}{' '}
                        <span className="text-surface-400 dark:text-surface-600 text-xs font-semibold">
                            VTC
                        </span>
                        <span className="sr-only">Verto Credits</span>
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-auto">
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col gap-1">
                        <p className="text-base leading-none font-medium">
                            <span className="sr-only">Balance:</span>
                            <span className="font-semibold lining-nums">
                                {formatCreditsBalance(creditsBalance ?? 0)}
                            </span>{' '}
                            <span className="text-accent text-sm font-semibold">VTC</span>
                        </p>
                        <p className="text-muted text-xs leading-none">
                            <span className="not-sr-only">Verto Credits</span>
                        </p>
                        <p className="text-foreground mt-2 text-xs leading-normal">
                            Use your credits to pay for translations.
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <Link passHref href="/account/credits/top-up">
                        <DropdownMenuItem inset={false}>
                            <ShoppingCartIcon
                                className="size-5 min-w-5"
                                color="currentColor"
                                weight="duotone"
                            />
                            <span>Top Up Credits</span>
                            <DropdownMenuShortcut>⇧⌘C</DropdownMenuShortcut>
                        </DropdownMenuItem>
                    </Link>
                    <Link passHref href="/account/billing">
                        <DropdownMenuItem inset={false}>
                            <InvoiceIcon className="size-5 min-w-5" color="currentColor" weight="duotone" />
                            <span>Billing</span>
                            <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
                        </DropdownMenuItem>
                    </Link>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default BalanceDisplay;
