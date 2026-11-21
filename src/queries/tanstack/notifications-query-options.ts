/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import { keepPreviousData } from '@tanstack/react-query';
import { getNotifications } from '@/src/actions/services/notifications/get-notifications';
import { getUnreadCount } from '@/src/actions/services/notifications/get-unread-count';
import type { NotificationFilters } from '@/types/notifications';

/**
 * Query options for fetching notifications with filters and pagination
 * Uses balance-display pattern: aggressive refetch strategies instead of realtime
 */
export const notificationsQueryOptions = (
    userId?: string,
    filters?: NotificationFilters,
    limit = 20,
    offset = 0,
) =>
    queryOptions({
        queryKey: ['notifications', userId, filters, limit, offset] as const,
        queryFn: async () => {
            const response = await getNotifications(filters, { limit, offset });
            if (!response || response.error) throw response;
            return response.data!;
        },
        staleTime: 0, // Always refetch (like balance-display)
        gcTime: 5 * 60 * 1000, // 5 minutes
        enabled: !!userId,
        placeholderData: keepPreviousData, // Smooth transitions, no UI flicker
        refetchOnMount: 'always', // Always fresh when dropdown opens
        refetchOnWindowFocus: true, // Refresh when user returns to tab
        refetchOnReconnect: 'always', // Refresh when network reconnects
    });

/**
 * Infinite query options for paginated notifications (for full page)
 */
export const infiniteNotificationsQueryOptions = (
    userId?: string,
    filters?: NotificationFilters,
    pageSize = 20,
) =>
    infiniteQueryOptions({
        queryKey: ['notifications-infinite', userId, filters] as const,
        queryFn: async ({ pageParam = 0 }) => {
            const response = await getNotifications(filters, {
                limit: pageSize,
                offset: pageParam,
            });
            if (!response || response.error) throw response;
            return response.data!;
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            if (!lastPage.hasMore) return undefined;
            return allPages.length * pageSize;
        },
        staleTime: 1 * 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000, // 5 minutes
        enabled: !!userId,
    });

/**
 * Query options for fetching unread notification count
 * Uses balance-display pattern: refetch on mount/focus instead of polling
 */
export const unreadCountQueryOptions = (userId?: string) =>
    queryOptions({
        queryKey: ['notifications-unread-count', userId] as const,
        queryFn: async () => {
            const response = await getUnreadCount();
            if (!response || response.error) throw response;
            return response.data!;
        },
        staleTime: 0, // Always refetch (like balance-display)
        gcTime: 5 * 60 * 1000, // 5 minutes
        enabled: !!userId,
        placeholderData: keepPreviousData, // Smooth transitions
        refetchOnMount: 'always', // Always fresh count
        refetchOnWindowFocus: true, // Update when user returns to tab
        refetchOnReconnect: 'always', // Update when network reconnects
    });
