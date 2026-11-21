/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { standardizeError } from '@errors/api-errors';
import { getLogger } from '@services/logger';
import { createServerClient } from '@utils/supabase/server';
import type { ApiResponseOrError } from '@/types/rest/response';

const logger = getLogger('ACTIONS:NOTIFICATIONS:MARK-READ');

/**
 * Mark notifications as read
 * @param notificationIds - Array of notification IDs or 'all' to mark all unread as read
 */
export async function markNotificationsRead(
    notificationIds: string[] | 'all',
): Promise<ApiResponseOrError<{ updated: number }>> {
    try {
        const supabase = await createServerClient();

        // Get authenticated user
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            const errorResponse = standardizeError(userError || new Error('Not authenticated'));
            logger.error(['User not authenticated:', errorResponse]);
            return errorResponse;
        }

        // Build update query
        let query = supabase
            .from('notifications')
            .update({
                read: true,
                read_at: new Date().toISOString(),
            })
            .eq('profile_id', user.id) // Security: Only update user's own notifications
            .eq('read', false); // Only update unread notifications

        // Apply notification ID filter if not 'all'
        if (notificationIds !== 'all') {
            if (notificationIds.length === 0) {
                return {
                    success: true,
                    code: 'NO_NOTIFICATIONS_TO_UPDATE',
                    title: 'No Updates',
                    message: 'No notifications to mark as read.',
                    data: { updated: 0 },
                };
            }
            query = query.in('id', notificationIds);
        }

        // Execute update
        const { count, error } = await query.select();

        if (error) {
            const errorResponse = standardizeError(error);
            logger.error(['Error marking notifications as read:', errorResponse]);
            return errorResponse;
        }

        const updated = count ?? 0;

        logger.info([
            `Marked ${updated} notifications as read for user ${user.id}`,
            notificationIds === 'all' ? '(all unread)' : `(IDs: ${notificationIds.join(', ')})`,
        ]);

        return {
            success: true,
            code: 'NOTIFICATIONS_MARKED_READ',
            title: 'Notifications Updated',
            message: `Marked ${updated} notification${updated === 1 ? '' : 's'} as read.`,
            data: {
                updated,
            },
        };
    } catch (error) {
        const errorResponse = standardizeError(error);
        logger.error(['Unexpected error marking notifications as read:', errorResponse]);
        return errorResponse;
    }
}
