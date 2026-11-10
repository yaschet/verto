/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { CheckIcon, ExclamationMarkIcon, InfoIcon, WarningDiamondIcon } from '@phosphor-icons/react';
import { useTheme } from 'next-themes';
import { Toaster as Sonner } from 'sonner';
import Spinner from '@/src/components/ui/spinner';
import { cn } from '@library/utils';
import type { ComponentProps } from 'react';

type ToasterProps = ComponentProps<typeof Sonner>;

function Toaster({ ...props }: ToasterProps) {
    const { theme = 'system' } = useTheme();

    return (
        <Sonner
            className={cn('toaster group')}
            icons={{
                error: (
                    <WarningDiamondIcon
                        className="text-destructive size-5"
                        color="currentColor"
                        weight="duotone"
                    />
                ),
                info: <InfoIcon className="text-info size-5" color="currentColor" weight="duotone" />,
                loading: <Spinner size="xs" />,
                success: <CheckIcon className="text-success size-5" color="currentColor" weight="duotone" />,
                warning: (
                    <ExclamationMarkIcon
                        className="text-warning size-5"
                        color="currentColor"
                        weight="duotone"
                    />
                ),
            }}
            theme={theme as ToasterProps['theme']}
            toastOptions={{
                className: cn('rounded-xl shadow-2xl bg-surface-2'),
                classNames: {
                    closeButton: cn(
                        'text-surface-600 dark:text-surface-400 hover:text-foreground dark:hover:text-foreground',
                        'bg-surface-2 hover:bg-surface-3 dark:hover:bg-surface-3',
                        'border-surface-3 dark:border-surface-3 hover:border-surface-3 dark:hover:border-surface-3',
                        'rounded-full',
                    ),
                },
                duration: 3000,
            }}
            {...props}
        />
    );
}

export { Toaster };
