/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@utils/supabase/client';

/**
 * Hook to subscribe to realtime notification updates for a user.
 * Invalidates notification queries when changes occur to ensure UI stays consistent.
 *
 * @param userId - ID of the user to subscribe notifications for
 */
export function useRealtimeNotifications(userId: string | undefined) {
    const queryClient = useQueryClient();
    const [supabase] = useState(() => createBrowserClient());

    useEffect(() => {
        if (!userId) return;

        console.log('[useRealtimeNotifications] Setting up subscription for user:', userId);

        const channel = supabase
            .channel(`notifications:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'notifications',
                    filter: `profile_id=eq.${userId}`,
                },
                (payload) => {
                    console.log('[useRealtimeNotifications] Received event:', payload.eventType);

                    // Invalidate all notification-related queries to trigger a refetch
                    // This ensures unread counts and lists are always up-to-date
                    queryClient.invalidateQueries({ queryKey: ['notifications'] });
                    queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
                    queryClient.invalidateQueries({ queryKey: ['notifications-infinite'] });
                },
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log(
                        `[useRealtimeNotifications] Subscribed to notifications for ${userId.slice(0, 8)}`,
                    );
                }
            });

        return () => {
            supabase.removeChannel(channel).then(() => {
                console.log(
                    `[useRealtimeNotifications] Unsubscribed from notifications for ${userId.slice(0, 8)}`,
                );
            });
        };
    }, [userId, supabase, queryClient]);
}
