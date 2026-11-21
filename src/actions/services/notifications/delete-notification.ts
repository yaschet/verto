/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { standardizeError } from '@errors/api-errors';
import { getLogger } from '@services/logger';
import { createServerClient } from '@utils/supabase/server';
import type { ApiResponseOrError } from '@/types/rest/response';

const logger = getLogger('ACTIONS:NOTIFICATIONS:DELETE');

/**
 * Delete a notification
 * @param notificationId - ID of the notification to delete
 */
export async function deleteNotification(
    notificationId: string,
): Promise<ApiResponseOrError<{ success: boolean }>> {
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

        // Delete notification (RLS ensures user can only delete their own)
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId)
            .eq('profile_id', user.id); // Security: Only delete user's own notifications

        if (error) {
            const errorResponse = standardizeError(error);
            logger.error(['Error deleting notification:', errorResponse]);
            return errorResponse;
        }

        logger.info([`Deleted notification ${notificationId} for user ${user.id}`]);

        return {
            success: true,
            code: 'NOTIFICATION_DELETED',
            title: 'Notification Deleted',
            message: 'Notification has been deleted.',
            data: {
                success: true,
            },
        };
    } catch (error) {
        const errorResponse = standardizeError(error);
        logger.error(['Unexpected error deleting notification:', errorResponse]);
        return errorResponse;
    }
}
