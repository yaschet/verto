/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import {
    ArchiveIcon,
    BellIcon,
    CheckCircleIcon,
    CircleNotchIcon,
    CoinVerticalIcon,
    CreditCardIcon,
    EyeIcon,
    GiftIcon,
    WarningIcon,
    XCircleIcon,
} from '@phosphor-icons/react';
import { formatDistanceToNow } from 'date-fns';
import { type MouseEvent, useEffect } from 'react';
import { Button } from '@components/ui/button';
import { DropdownMenuItem } from '@components/ui/dropdown-menu';
import { IconContainer, type IconContainerProps } from '@components/ui/icon-container';
import { useDeleteNotification } from '@hooks/queries/notifications/use-notifications';
import { cn } from '@library/utils';
import type { Notification, NotificationType } from '@/types/notifications';
import type { ApiErrorType } from '@/types/rest/errors';

type NotificationItemProps = {
    notification: Notification;
    onClick?: () => void;
    onArchive?: (id: string) => void;
    isArchiving?: boolean;
    className?: string;
};

/**
 * Get icon component and color for notification type
 */
function getNotificationIcon(type: NotificationType): {
    icon: React.ReactNode;
    color: IconContainerProps['color'];
} {
    const iconProps = { className: 'size-4', weight: 'duotone' as const };

    switch (type) {
        // High frequency (routine operations) - Blue/Info
        case 'translation_complete':
            return { icon: <CheckCircleIcon {...iconProps} />, color: 'info' }; // Blue for frequent routine completions
        case 'translation_review':
            return { icon: <EyeIcon {...iconProps} />, color: 'info' };

        // Failures - Red/Destructive
        case 'translation_failed':
            return { icon: <XCircleIcon {...iconProps} />, color: 'destructive' };
        case 'payment_failed':
            return { icon: <CreditCardIcon {...iconProps} />, color: 'destructive' };

        // Warnings - Amber/Warning
        case 'credit_low':
            return { icon: <WarningIcon {...iconProps} />, color: 'warning' };

        // Achievements (low frequency) - Green/Success
        case 'credit_added':
            return { icon: <CoinVerticalIcon {...iconProps} />, color: 'success' };
        case 'payment_success':
            return { icon: <CreditCardIcon {...iconProps} />, color: 'success' };

        // Special events - Accent/Violet
        case 'product_update':
            return { icon: <GiftIcon {...iconProps} />, color: 'accent' };

        // Default - Neutral
        case 'system_alert':
        default:
            return { icon: <BellIcon {...iconProps} />, color: 'default' };
    }
}

/**
 * Individual notification item component (Vercel-style dropdown)
 * Compact layout with muted icons, inline delete button, right-aligned blue dot
 */
export function NotificationItem({
    className,
    isArchiving: isArchivingProp,
    notification,
    onArchive: onArchiveProp,
    onClick,
}: NotificationItemProps) {
    const isUnread = !notification.read;
    const {
        error: archiveError,
        isError: isArchiveError,
        isPending: isArchivingHook,
        mutate: archiveNotification,
        reset: resetArchiveMutation,
    } = useDeleteNotification({ suppressToast: true });

    const isArchiving = isArchivingProp ?? isArchivingHook;

    useEffect(() => {
        resetArchiveMutation();
    }, [notification.id, resetArchiveMutation]);

    const archiveErrorMessage =
        (archiveError as ApiErrorType | undefined)?.message ?? 'Unable to archive notification.';

    const handleArchive = (e: MouseEvent) => {
        e.stopPropagation();
        if (onArchiveProp) {
            onArchiveProp(notification.id);
            return;
        }
        archiveNotification(notification.id);
    };

    const handleRetryArchive = (e: MouseEvent) => {
        e.stopPropagation();
        resetArchiveMutation();
        archiveNotification(notification.id);
    };

    const handleClick = () => {
        onClick?.();
    };

    const { color, icon } = getNotificationIcon(notification.type);

    return (
        <DropdownMenuItem
            className={cn(
                'group relative mx-0 flex w-full max-w-full cursor-pointer items-start gap-3 rounded-xl px-3 py-3 transition-colors',
                'whitespace-normal', // Override default whitespace-nowrap
                'hover:bg-surface-100 dark:hover:bg-surface-900',
                className,
            )}
            role="button"
            tabIndex={0}
            onClick={handleClick}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleClick();
                }
            }}
        >
            {/* Icon container */}
            <div className="mt-0.5 shrink-0">
                <IconContainer color={color} shape="rounded" size="sm" variant="soft">
                    {icon}
                </IconContainer>
            </div>

            {/* Content & actions */}
            <div className="flex flex-1 items-start gap-3 min-w-0">
                <div
                    className={cn(
                        'flex flex-1 flex-col gap-1 min-w-0 transition-[padding] duration-200 ease-out',
                        isArchiving ? 'pr-0' : 'pr-8 group-hover:pr-0',
                    )}
                >
                    <p
                        className={cn(
                            'text-sm leading-tight break-all',
                            isUnread ? 'text-foreground font-bold' : 'text-foreground font-medium',
                        )}
                    >
                        {notification.title}
                    </p>

                    <p className="text-muted-foreground line-clamp-2 text-xs break-all">
                        {notification.message}
                    </p>

                    <span className="text-muted-foreground text-xs">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </span>

                    {isArchiveError && (
                        <p className="text-destructive text-[11px]" role="status">
                            {archiveErrorMessage}{' '}
                            <button
                                className="hover:text-destructive/80 underline underline-offset-2"
                                type="button"
                                onClick={handleRetryArchive}
                            >
                                Retry
                            </button>
                        </p>
                    )}
                </div>

                <div className="ml-auto flex items-center gap-0.5 pl-1">
                    {isUnread && (
                        <div
                            aria-label="Unread"
                            className={cn(
                                'bg-foreground size-2 shrink-0 rounded-full transition-transform duration-200 ease-out',
                                'group-hover:-translate-x-2',
                            )}
                        />
                    )}

                    <div
                        className={cn(
                            'overflow-hidden transition-[width] duration-200 ease-out',
                            isArchiving ? 'w-8' : 'w-0 group-hover:w-8',
                        )}
                    >
                        <Button
                            aria-busy={isArchiving}
                            aria-label="Archive notification"
                            aria-live="polite"
                            className={cn(
                                'min-w-0 transition-all duration-200 ease-out',
                                isUnread ? 'translate-x-2 group-hover:translate-x-0' : 'translate-x-0',
                                isArchiving
                                    ? 'opacity-100'
                                    : 'pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100',
                            )}
                            color="default"
                            disabled={isArchiving}
                            shape="pill"
                            size="icon-sm"
                            variant="plain"
                            onClick={handleArchive}
                        >
                            {isArchiving ? (
                                <CircleNotchIcon className="size-4 animate-spin" />
                            ) : (
                                <ArchiveIcon className="size-4" />
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </DropdownMenuItem>
    );
}
