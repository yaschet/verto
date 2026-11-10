/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { PersonIcon, WarningIcon } from '@phosphor-icons/react';
import React, { useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@components/ui/button';
import { useActiveUsers } from '@hooks/queries/auth/admin/use-active-users';
import { cn } from '@library/utils';
import type { ButtonProps } from '@components/ui/button';

function ActiveUsersDisplay({
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
    const { data: activeUsersCount, error, isError, isLoading, refetch } = useActiveUsers();

    useEffect(() => {
        if (isError) {
            toast.error(error?.title ?? error?.message ?? 'Unable to fetch active users.', {
                description: error?.description ?? 'Please try again, or contact support.',
                id: 'active-users-error',
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
                <PersonIcon className="size-5" color="currentColor" weight="duotone" />
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
                <span className="text-surface-600 dark:text-surface-400 text-xs font-semibold">
                    AU
                    <span className="sr-only">Active Users</span>
                </span>
            </Button>
        );
    }

    return (
        <Button
            aria-label="Current active users."
            className={cn(
                'flex h-auto cursor-default items-center justify-center gap-1 hover:cursor-default',
                className,
            )}
            color={color ?? 'default'}
            size={size ?? 'md'}
            tooltipContent={tooltipContent ?? 'Active Users'}
            variant={variant ?? 'solid'}
            {...props}
        >
            <PersonIcon className="text-success size-5" color="currentColor" weight="duotone" />
            <span className="text-sm font-bold lining-nums">
                {activeUsersCount ?? 0}{' '}
                <span className="text-surface-400 dark:text-surface-600 text-xs font-semibold">AU</span>
                <span className="sr-only">
                    <span>Active Users: {activeUsersCount}</span>
                </span>
            </span>
        </Button>
    );
}

export default ActiveUsersDisplay;
