/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { standardizeError } from '@errors/api-errors';
import { getLogger } from '@services/logger';
import { createServerClient } from '@utils/supabase/server';
import type { Notification, NotificationFilters, NotificationPagination } from '@/types/notifications';
import type { ApiResponseOrError } from '@/types/rest/response';

const logger = getLogger('ACTIONS:NOTIFICATIONS:GET-NOTIFICATIONS');

type GetNotificationsResponse = {
    notifications: Notification[];
    hasMore: boolean;
    total: number;
};

/**
 * Get user's notifications with optional filters and pagination
 */
export async function getNotifications(
    filters?: NotificationFilters,
    pagination?: NotificationPagination,
): Promise<ApiResponseOrError<GetNotificationsResponse>> {
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

        // Build query with filters
        // Industry standard: Unread first (sorted newest), then read (sorted newest)
        let query = supabase
            .from('notifications')
            .select('*', { count: 'exact' })
            .eq('profile_id', user.id)
            .order('read', { ascending: true }) // Unread (false) first
            .order('created_at', { ascending: false }); // Then newest first within each group

        // Apply filters
        if (filters?.read !== undefined) {
            query = query.eq('read', filters.read);
        }

        if (filters?.type) {
            query = query.eq('type', filters.type);
        }

        if (filters?.search) {
            // Search in title or message
            query = query.or(`title.ilike.%${filters.search}%,message.ilike.%${filters.search}%`);
        }

        // Apply pagination
        const limit = pagination?.limit ?? 20;
        const offset = pagination?.offset ?? 0;

        query = query.range(offset, offset + limit - 1);

        // Execute query
        const { count, data, error } = await query;

        if (error) {
            const errorResponse = standardizeError(error);
            logger.error(['Error fetching notifications:', errorResponse]);
            return errorResponse;
        }

        const total = count ?? 0;
        const hasMore = offset + limit < total;

        logger.info([
            `Fetched ${data?.length ?? 0} notifications for user ${user.id} (${offset}-${offset + limit} of ${total})`,
        ]);

        return {
            success: true,
            code: 'NOTIFICATIONS_FETCHED',
            title: 'Notifications Retrieved',
            message: `Retrieved ${data?.length ?? 0} notifications.`,
            data: {
                notifications: (data as Notification[]) ?? [],
                hasMore,
                total,
            },
        };
    } catch (error) {
        const errorResponse = standardizeError(error);
        logger.error(['Unexpected error fetching notifications:', errorResponse]);
        return errorResponse;
    }
}
