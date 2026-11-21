/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteNotification } from '@/src/actions/services/notifications/delete-notification';
import { markNotificationsRead } from '@/src/actions/services/notifications/mark-notifications-read';
import { useUserData } from '@hooks/queries/auth/use-user-data';
import {
    infiniteNotificationsQueryOptions,
    notificationsQueryOptions,
    unreadCountQueryOptions,
} from '@queries/tanstack/notifications-query-options';
import type { NotificationFilters, Notification } from '@/types/notifications';
import type { ApiErrorType } from '@/types/rest/errors';

/**
 * Hook to fetch paginated notifications
 */
export const useNotifications = (filters?: NotificationFilters, limit = 20, offset = 0) => {
    const { data: userData } = useUserData();
    const userId = userData?.user?.id;

    return useQuery({
        ...notificationsQueryOptions(userId, filters, limit, offset),
    });
};

/**
 * Hook to fetch infinite scrolling notifications (for full page)
 */
export const useInfiniteNotifications = (filters?: NotificationFilters, pageSize = 20) => {
    const { data: userData } = useUserData();
    const userId = userData?.user?.id;

    return useInfiniteQuery({
        ...infiniteNotificationsQueryOptions(userId, filters, pageSize),
    });
};

/**
 * Hook to fetch unread notification count
 */
export const useUnreadCount = () => {
    const { data: userData } = useUserData();
    const userId = userData?.user?.id;

    return useQuery({
        ...unreadCountQueryOptions(userId),
    });
};

/**
 * Hook to mark notifications as read
 */
export const useMarkNotificationsRead = () => {
    const queryClient = useQueryClient();

    type MarkReadContext = {
        previousNotifications: unknown;
        previousCount: unknown;
    };

    return useMutation<{ updated: number }, ApiErrorType, string[] | 'all', MarkReadContext>({
        mutationKey: ['markNotificationsRead'],

        mutationFn: async (notificationIds) => {
            const result = await markNotificationsRead(notificationIds);
            if (result.error === true) {
                throw result;
            }
            return result.data!;
        },

        onMutate: async (notificationIds) => {
            // Cancel in-flight queries
            await queryClient.cancelQueries({ queryKey: ['notifications'] });
            await queryClient.cancelQueries({ queryKey: ['notifications-unread-count'] });

            // Snapshot for rollback
            const previousNotifications = queryClient.getQueryData(['notifications']);
            const previousCount = queryClient.getQueryData(['notifications-unread-count']);

            // Optimistic update: Mark notifications as read in cache
            if (notificationIds !== 'all') {
                queryClient.setQueriesData(
                    { queryKey: ['notifications'] },
                    (
                        cached:
                            | { notifications: Notification[]; total: number; hasMore: boolean }
                            | undefined,
                    ) => {
                        if (!cached?.notifications) return cached;
                        return {
                            ...cached,
                            notifications: cached.notifications.map((notification) =>
                                notificationIds.includes(notification.id)
                                    ? { ...notification, read: true, read_at: new Date().toISOString() }
                                    : notification,
                            ),
                        };
                    },
                );

                // Decrement unread count
                queryClient.setQueryData(
                    ['notifications-unread-count'],
                    (cached: { count: number } | undefined) => {
                        if (!cached?.count) return cached;
                        return {
                            ...cached,
                            count: Math.max(0, cached.count - notificationIds.length),
                        };
                    },
                );
            } else {
                // Mark all as read
                queryClient.setQueriesData(
                    { queryKey: ['notifications'] },
                    (
                        cached:
                            | { notifications: Notification[]; total: number; hasMore: boolean }
                            | undefined,
                    ) => {
                        if (!cached?.notifications) return cached;
                        return {
                            ...cached,
                            notifications: cached.notifications.map((notification) => ({
                                ...notification,
                                read: true,
                                read_at: new Date().toISOString(),
                            })),
                        };
                    },
                );

                // Set count to 0
                queryClient.setQueryData(['notifications-unread-count'], { count: 0 });
            }

            return { previousNotifications, previousCount };
        },

        onError: (err, variables, context) => {
            // Rollback on error
            if (context?.previousNotifications) {
                queryClient.setQueryData(['notifications'], context.previousNotifications);
            }
            if (context?.previousCount) {
                queryClient.setQueryData(['notifications-unread-count'], context.previousCount);
            }
            console.error('Failed to mark notifications as read', err);
        },

        onSuccess: () => {
            // Only refetch after server confirms success (prevents race condition)
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-infinite'] });
        },
    });
};

type UseDeleteNotificationOptions = {
    suppressToast?: boolean;
};

/**
 * Hook to delete (archive) a notification
 */
export const useDeleteNotification = (options: UseDeleteNotificationOptions = {}) => {
    const queryClient = useQueryClient();

    type DeleteNotificationContext = {
        previousNotificationQueries: [readonly unknown[], unknown][];
        previousUnreadCountQueries: [readonly unknown[], unknown][];
    };

    return useMutation<{ success: boolean }, ApiErrorType, string, DeleteNotificationContext>({
        mutationKey: ['deleteNotification'],

        mutationFn: async (notificationId) => {
            const result = await deleteNotification(notificationId);
            if (result.error === true) {
                throw result;
            }
            return result.data!;
        },

        onMutate: async (notificationId) => {
            // Cancel in-flight queries
            await queryClient.cancelQueries({ queryKey: ['notifications'] });
            await queryClient.cancelQueries({ queryKey: ['notifications-unread-count'] });

            // Snapshot for rollback (capture every matching query)
            const previousNotificationQueries = queryClient.getQueriesData({ queryKey: ['notifications'] });
            const previousUnreadCountQueries = queryClient.getQueriesData({
                queryKey: ['notifications-unread-count'],
            });

            let deletedNotification: Notification | undefined;

            // Optimistic update: Remove notification from cache
            queryClient.setQueriesData(
                { queryKey: ['notifications'] },
                (cached: { notifications: Notification[]; total: number; hasMore: boolean } | undefined) => {
                    if (!cached?.notifications) return cached;
                    if (!deletedNotification) {
                        deletedNotification = cached.notifications.find((n) => n.id === notificationId);
                    }
                    const filtered = cached.notifications.filter((n) => n.id !== notificationId);
                    return {
                        ...cached,
                        notifications: filtered,
                        total:
                            typeof cached.total === 'number'
                                ? Math.max(0, cached.total - 1)
                                : filtered.length,
                    };
                },
            );

            const wasUnread = deletedNotification?.read === false;

            if (wasUnread) {
                queryClient.setQueriesData(
                    { queryKey: ['notifications-unread-count'] },
                    (cached: { count: number } | undefined) => {
                        if (typeof cached?.count !== 'number') return cached;
                        return {
                            ...cached,
                            count: Math.max(0, cached.count - 1),
                        };
                    },
                );
            }

            return { previousNotificationQueries, previousUnreadCountQueries };
        },

        onError: (err, variables, context) => {
            // Rollback on error
            if (context?.previousNotificationQueries) {
                context.previousNotificationQueries.forEach(([queryKey, data]) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
            if (context?.previousUnreadCountQueries) {
                context.previousUnreadCountQueries.forEach(([queryKey, data]) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
            console.error('Failed to delete notification', err);
        },

        onSuccess: () => {
            // Only refetch after server confirms success (prevents race condition)
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-infinite'] });

            if (!options.suppressToast) {
                // No-op placeholder to retain API compatibility
            }
        },
    });
};
