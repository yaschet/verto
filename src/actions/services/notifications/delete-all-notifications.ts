/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { standardizeError } from '@errors/api-errors';
import { getLogger } from '@services/logger';
import { createServerClient } from '@utils/supabase/server';
import type { ApiResponseOrError } from '@/types/rest/response';

const logger = getLogger('ACTIONS:NOTIFICATIONS:DELETE_ALL');

/**
 * Delete all notifications for the current user
 * More efficient than deleting one by one
 */
export async function deleteAllNotifications(): Promise<ApiResponseOrError<{ deleted: number }>> {
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

        // Delete all notifications for this user (RLS ensures security)
        const { count, error } = await supabase
            .from('notifications')
            .delete({ count: 'exact' })
            .eq('profile_id', user.id);

        if (error) {
            const errorResponse = standardizeError(error);
            logger.error(['Error deleting all notifications:', errorResponse]);
            return errorResponse;
        }

        logger.info([`Deleted ${count ?? 0} notifications for user ${user.id}`]);

        return {
            success: true,
            code: 'NOTIFICATIONS_DELETED',
            title: 'Notifications Deleted',
            message: `${count ?? 0} notifications have been deleted.`,
            data: {
                deleted: count ?? 0,
            },
        };
    } catch (error) {
        const errorResponse = standardizeError(error);
        logger.error(['Unexpected error deleting all notifications:', errorResponse]);
        return errorResponse;
    }
}
