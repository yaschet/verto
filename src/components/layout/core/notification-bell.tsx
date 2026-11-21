/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { BellIcon, ChecksIcon, CircleNotchIcon, TrashIcon } from '@phosphor-icons/react';
import { motion } from 'motion/react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import useSound from 'use-sound';
import { useRouter } from 'next/navigation';
import { useRef, useState, useEffect } from 'react';
import { deleteAllNotifications } from '@/src/actions/services/notifications/delete-all-notifications';
import { NotificationList } from '@/components/layout/core/notification-list';
import {
    useNotifications,
    useUnreadCount,
    useMarkNotificationsRead,
} from '@/hooks/queries/notifications/use-notifications';
import { useRealtimeNotifications } from '@/src/hooks/queries/notifications/use-realtime-notifications';
import { Button, type ButtonProps } from '@components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@components/ui/dropdown-menu';
import { IconContainer } from '@components/ui/icon-container';

import { Skeleton } from '@components/ui/skeleton';
import { useUserData } from '@hooks/queries/auth/use-user-data';
import { cn } from '@library/utils';
import type { ApiErrorType } from '@/types/rest/errors';
import type { Notification } from '@/types/notifications';

export type NotificationBellProps = {
    className?: string;
    // Optional props for Storybook/Testing/Overrides
    notifications?: Notification[];
    unreadCount?: number;
    isLoading?: boolean;
    isError?: boolean;
    userId?: string;
    onMarkAllAsRead?: () => void;
    onArchiveAll?: () => void;
    onArchiveItem?: (id: string) => void;
    size?: ButtonProps['size'];
};

export function NotificationBell({
    className,
    isError: isErrorProp,
    isLoading: isLoadingProp,
    notifications: notificationsProp,
    onArchiveAll: onArchiveAllProp,
    onArchiveItem: onArchiveItemProp,
    onMarkAllAsRead: onMarkAllAsReadProp,
    unreadCount: unreadCountProp,
    userId: userIdProp,
    size = 'icon',
}: NotificationBellProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);

    const { data: userData } = useUserData();
    const userId = userIdProp ?? userData?.user?.id;

    // Fetch unread count for badge
    const { data: unreadCountData } = useUnreadCount();
    const unreadCount = unreadCountProp ?? unreadCountData?.count ?? 0;

    // Fetch recent notifications for dropdown (all notifications, limit 10)
    // Show both read and unread so users can see notification history
    const { data: notificationsData, isError, isLoading } = useNotifications({}, 10, 0);

    // Enable Realtime Updates
    useRealtimeNotifications(userId);

    const notifications = notificationsProp ?? notificationsData?.notifications ?? [];
    const hasNotifications = notifications.length > 0;
    const actualIsLoading = isLoadingProp ?? isLoading;
    const actualIsError = isErrorProp ?? (isError && !notificationsProp); // Error only if not providing mock data

    // Mutation to mark notifications as read
    const {
        isPending: isMarkingAllRead,
        mutate: markAsRead,
        reset: resetMarkAllMutation,
    } = useMarkNotificationsRead();
    const {
        isPending: isArchivingAll,
        mutate: archiveAllNotifications,
        reset: resetArchiveAllMutation,
    } = useMutation<void, ApiErrorType>({
        mutationKey: ['notifications', 'archive-all'],
        mutationFn: async () => {
            // Batch delete all notifications in one request (faster, no chunk-by-chunk)
            const result = await deleteAllNotifications();
            if (result.error) throw result;
        },
        onSuccess: () => {
            // Refetch after successful batch delete
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-infinite'] });
        },
    });

    const handleNotificationClick = (notification: (typeof notifications)[0]) => {
        if (notification.link) {
            router.push(notification.link);
        }
        setIsOpen(false);
    };

    const handleMarkAllAsRead = () => {
        if (onMarkAllAsReadProp) {
            onMarkAllAsReadProp();
            return;
        }
        if (unreadCount > 0 && !isMarkingAllRead) {
            markAsRead('all');
        }
    };

    const canArchiveAll = notifications.length > 0;

    const handleArchiveAll = () => {
        if (onArchiveAllProp) {
            onArchiveAllProp();
            return;
        }
        if (!canArchiveAll || isArchivingAll) {
            return;
        }
        archiveAllNotifications();
    };

    useEffect(() => {
        if (!isOpen) {
            resetArchiveAllMutation();
            resetMarkAllMutation();
        }
    }, [isOpen, resetArchiveAllMutation, resetMarkAllMutation]);

    useEffect(() => {
        if (!canArchiveAll) {
            resetArchiveAllMutation();
        }
    }, [canArchiveAll, resetArchiveAllMutation]);

    const [playNotificationSound] = useSound('/sounds/notification.wav', { volume: 0.5 });
    const previousUnreadCountRef = useRef<number | null>(null);
    const [isShaking, setIsShaking] = useState(false);

    useEffect(() => {
        // Skip sound on initial client-side load or if data is just loading in
        if (previousUnreadCountRef.current === null) {
            previousUnreadCountRef.current = unreadCount;
            return;
        }

        // Only play if the count actually increased (realtime event)
        // and ignore decreases (marking as read)
        if (unreadCount > (previousUnreadCountRef.current ?? 0)) {
            playNotificationSound();
            setIsShaking(true);
            const timer = setTimeout(() => setIsShaking(false), 600);
            return () => clearTimeout(timer);
        }

        previousUnreadCountRef.current = unreadCount;
    }, [unreadCount, playNotificationSound]);

    if (!userId) {
        return null;
    }

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                    className={cn('relative', className)}
                    color="default"
                    size={size}
                    variant="soft"
                >
                    <motion.div
                        animate={
                            isShaking
                                ? {
                                      rotate: [0, -20, 20, -20, 20, -10, 10, 0],
                                  }
                                : { rotate: 0 }
                        }
                        transition={{
                            duration: 0.6,
                            ease: 'easeInOut',
                        }}
                    >
                        <BellIcon
                            className="size-5"
                            color="currentColor"
                            weight={unreadCount > 0 ? 'duotone' : 'duotone'}
                        />
                    </motion.div>
                    {unreadCount > 0 && (
                        <div
                            className={cn(
                                'bg-info-600 dark:bg-info-500 absolute top-0 right-0 -mt-1.5 -mr-1.5 flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold text-white',
                            )}
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </div>
                    )}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent allowOverflow align="end" className="w-[400px] p-2">
                <div className="flex items-center justify-between px-2 pt-1.5 pb-2">
                    <span className="text-sm font-semibold">Notifications</span>
                    <div className="flex items-center gap-1">
                        {unreadCount > 0 && (
                            <Button
                                aria-busy={isMarkingAllRead}
                                aria-label="Mark all as read"
                                aria-live="polite"
                                className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
                                color="default"
                                disabled={isMarkingAllRead || isLoading}
                                size="icon"
                                tooltipContent="Mark all as read"
                                variant="plain"
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleMarkAllAsRead();
                                }}
                            >
                                {isMarkingAllRead ? (
                                    <CircleNotchIcon className="size-3.5 animate-spin" />
                                ) : (
                                    <ChecksIcon className="size-3.5" />
                                )}
                            </Button>
                        )}
                        {hasNotifications && (
                            <Button
                                aria-busy={isArchivingAll}
                                aria-label="Archive all notifications"
                                aria-live="polite"
                                className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                                color="destructive"
                                disabled={isArchivingAll || isLoading}
                                size="icon"
                                tooltipContent="Archive all"
                                variant="plain"
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleArchiveAll();
                                }}
                            >
                                {isArchivingAll ? (
                                    <CircleNotchIcon className="size-3.5 animate-spin" />
                                ) : (
                                    <TrashIcon className="size-3.5" />
                                )}
                            </Button>
                        )}
                    </div>
                </div>

                <DropdownMenuSeparator className="-mx-2 mb-2 mt-0" />

                {!userId ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <IconContainer
                            className="mb-3"
                            color="default"
                            shape="rounded"
                            size="xl"
                            variant="soft"
                        >
                            <BellIcon className="size-6" weight="thin" />
                        </IconContainer>
                        <p className="text-foreground text-sm font-medium">Not logged in</p>
                        <p className="text-muted-foreground text-xs">Sign in to view notifications</p>
                    </div>
                ) : actualIsError ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <IconContainer
                            className="mb-3"
                            color="destructive"
                            shape="rounded"
                            size="xl"
                            variant="soft"
                        >
                            <BellIcon className="size-6" weight="thin" />
                        </IconContainer>
                        <p className="text-foreground text-sm font-medium">Failed to load notifications</p>
                        <p className="text-muted-foreground text-xs">Please try again later</p>
                    </div>
                ) : actualIsLoading ? (
                    <NotificationSkeleton count={3} />
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <IconContainer
                            className="mb-3"
                            color="default"
                            shape="rounded"
                            size="xl"
                            variant="soft"
                        >
                            <BellIcon className="size-6" weight="thin" />
                        </IconContainer>
                        <p className="text-foreground text-sm font-medium">No new notifications</p>
                        <p className="text-muted-foreground text-xs">You're all caught up!</p>
                    </div>
                ) : (
                    <NotificationList
                        className="h-[350px]"
                        notifications={notifications}
                        onArchiveItem={onArchiveItemProp}
                        onNotificationClick={handleNotificationClick}
                    />
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

/**
 * Loading skeleton for notification items
 */
function NotificationSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-3 p-3">
            {[...Array(count)].map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                    <Skeleton className="size-5 shrink-0 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-16" />
                    </div>
                </div>
            ))}
        </div>
    );
}
