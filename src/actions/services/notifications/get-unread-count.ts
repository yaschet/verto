/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { standardizeError } from '@errors/api-errors';
import { getLogger } from '@services/logger';
import { createServerClient } from '@utils/supabase/server';
import type { ApiResponseOrError } from '@/types/rest/response';

const logger = getLogger('ACTIONS:NOTIFICATIONS:GET-UNREAD-COUNT');

/**
 * Get count of unread notifications for the current user
 */
export async function getUnreadCount(): Promise<ApiResponseOrError<{ count: number }>> {
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

        // Get count of unread notifications
        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('profile_id', user.id)
            .eq('read', false);

        if (error) {
            const errorResponse = standardizeError(error);
            logger.error(['Error fetching unread count:', errorResponse]);
            return errorResponse;
        }

        const unreadCount = count ?? 0;

        logger.info([`User ${user.id} has ${unreadCount} unread notifications`]);

        return {
            success: true,
            code: 'UNREAD_COUNT_FETCHED',
            title: 'Unread Count Retrieved',
            message: `You have ${unreadCount} unread notifications.`,
            data: {
                count: unreadCount,
            },
        };
    } catch (error) {
        const errorResponse = standardizeError(error);
        logger.error(['Unexpected error fetching unread count:', errorResponse]);
        return errorResponse;
    }
}
