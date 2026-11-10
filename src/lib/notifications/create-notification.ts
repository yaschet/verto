/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { createAdminClient } from '@/src/utils/supabase/server';
import { getLogger } from '@services/logger';
import type { NotificationType } from '@/types/notifications';

const logger = getLogger('LIB:NOTIFICATIONS:CREATE');

export type CreateNotificationParams = {
    profileId: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string | null;
    metadata?: Record<string, unknown>;
};

/**
 * Create a notification for a user
 *
 * This utility can be called from Trigger.dev tasks, API routes, or server actions
 * Uses service role client to bypass RLS and insert notifications
 *
 * @example
 * ```typescript
 * await createNotification({
 *   profileId: userId,
 *   type: 'translation_complete',
 *   title: 'Translation Complete',
 *   message: 'Your translation "document.pdf" is ready for review',
 *   link: `/app/translations/${translationId}`,
 *   metadata: { translationId, filename: 'document.pdf' }
 * });
 * ```
 */
export async function createNotification({
    link = null,
    message,
    metadata = {},
    profileId,
    title,
    type,
}: CreateNotificationParams): Promise<{ success: boolean; notificationId?: string; error?: string }> {
    try {
        const supabase = await createAdminClient();

        // Insert notification
        const { data, error } = await supabase
            .from('notifications')
            .insert({
                profile_id: profileId,
                type,
                title,
                message,
                link,
                metadata,
                read: false,
            })
            .select('id')
            .single();

        if (error) {
            logger.error(['Error creating notification:', error]);
            return {
                success: false,
                error: error.message,
            };
        }

        logger.info([
            `Created ${type} notification for user ${profileId}:`,
            { notificationId: data.id, title },
        ]);

        return {
            success: true,
            notificationId: data.id,
        };
    } catch (error) {
        logger.error(['Unexpected error creating notification:', error]);
        return {
            success: false,
            error: error instanceof Error ? (error as Error).message : 'Unknown error',
        };
    }
}

/**
 * Create multiple notifications in batch
 */
export async function createNotificationBatch(
    notifications: CreateNotificationParams[],
): Promise<{ success: boolean; created: number; errors: string[] }> {
    const results = await Promise.allSettled(
        notifications.map((notification) => createNotification(notification)),
    );

    const created = results.filter((r) => r.status === 'fulfilled' && r.value.success).length;
    const errors = results
        .filter((r) => r.status === 'fulfilled' && !r.value.success)
        .map(
            (r) =>
                (r as PromiseFulfilledResult<Awaited<ReturnType<typeof createNotification>>>).value.error ||
                'Unknown error',
        );

    logger.info([`Created ${created}/${notifications.length} notifications in batch`]);

    return {
        success: errors.length === 0,
        created,
        errors,
    };
}
