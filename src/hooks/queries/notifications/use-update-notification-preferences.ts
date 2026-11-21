/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { updateNotificationPreferences } from '@/src/actions/services/notifications/update-notification-preferences';
import type { NotificationPreferences } from '@/src/actions/services/notifications/update-notification-preferences';
import type { ApiErrorType } from '@/types/rest/errors';

export const useUpdateNotificationPreferences = () => {
    const queryClient = useQueryClient();
    const pendingBatchRef = useRef<Partial<NotificationPreferences>>({});
    const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Mutation for updating preferences
    const mutation = useMutation<
        { preferences: NotificationPreferences },
        ApiErrorType,
        Partial<NotificationPreferences>,
        { previousProfile?: unknown }
    >({
        mutationKey: ['updateNotificationPreferences'], // Tag related mutations

        mutationFn: async (preferences) => {
            const result = await updateNotificationPreferences(preferences);
            if (result.error === true) {
                throw result;
            }
            return result.data!;
        },

        onMutate: async (newPreferences) => {
            // 1. Cancel in-flight queries to prevent window of inconsistency
            await queryClient.cancelQueries({ queryKey: ['user-profile-query'] });

            // 2. Snapshot current state for rollback
            const previousProfile = queryClient.getQueryData(['user-profile-query']);

            // 3. Optimistically update cache (single source of truth)
            queryClient.setQueryData(
                ['user-profile-query'],
                (cached: { profile?: Partial<NotificationPreferences> } | undefined) => {
                    if (!cached?.profile) return cached;
                    return {
                        ...cached,
                        profile: {
                            ...cached.profile,
                            ...newPreferences,
                        },
                    };
                },
            );

            return { previousProfile };
        },

        onError: (err, variables, context: { previousProfile?: unknown } | undefined) => {
            // Rollback on error
            if (context?.previousProfile) {
                queryClient.setQueryData(['user-profile-query'], context.previousProfile);
            }

            // Show error toast with retry button
            toast.error('Failed to save preferences', {
                description: err?.message || 'Your changes could not be saved. Please try again.',
                action: {
                    label: 'Retry',
                    onClick: () => mutation.mutate(variables),
                },
            });
        },

        onSettled: () => {
            // Only refetch if this is the LAST mutation
            // Prevents intermediate mutations from triggering refetches that overwrite later optimistic updates
            const mutatingCount = queryClient.isMutating({ mutationKey: ['updateNotificationPreferences'] });
            if (mutatingCount === 1) {
                queryClient.invalidateQueries({ queryKey: ['user-profile-query'] });
            }
        },

        retry: 1, // Retry once on network failure
    });

    // Batching logic: Accumulate rapid changes into single request
    const schedulePreferenceUpdate = useCallback(
        (changes: Partial<NotificationPreferences>) => {
            // Merge changes into batch
            pendingBatchRef.current = { ...pendingBatchRef.current, ...changes };

            // Clear existing timer
            if (batchTimeoutRef.current) {
                clearTimeout(batchTimeoutRef.current);
            }

            // Schedule batch save after 600ms of inactivity
            batchTimeoutRef.current = setTimeout(() => {
                const batch = { ...pendingBatchRef.current };
                if (Object.keys(batch).length > 0) {
                    mutation.mutate(batch);
                    pendingBatchRef.current = {}; // Clear batch after sending
                }
            }, 600);
        },
        [mutation],
    );

    return {
        schedulePreferenceUpdate,
        isPending: mutation.isPending,
        isError: mutation.isError,
    };
};
