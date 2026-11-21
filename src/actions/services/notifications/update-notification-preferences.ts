/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { standardizeError } from '@errors/api-errors';
import { getLogger } from '@services/logger';
import { createServerClient } from '@utils/supabase/server';
import type { ApiResponseOrError } from '@/types/rest/response';

const logger = getLogger('ACTIONS:NOTIFICATIONS:UPDATE-PREFERENCES');

export type NotificationPreferences = {
    notification_email_enabled: boolean;
    notification_translation_complete: boolean;
    notification_translation_failed: boolean;
    notification_translation_review: boolean;
    notification_credit_low: boolean;
    notification_marketing: boolean;
    notification_product_updates: boolean;
};

/**
 * Update user's notification preferences
 */
export async function updateNotificationPreferences(
    preferences: Partial<NotificationPreferences>,
): Promise<ApiResponseOrError<{ preferences: NotificationPreferences }>> {
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

        // Update notification preferences
        const { data, error } = await supabase
            .from('profiles')
            .update(preferences)
            .eq('id', user.id)
            .select(
                `
                notification_email_enabled,
                notification_translation_complete,
                notification_translation_failed,
                notification_translation_review,
                notification_credit_low,
                notification_marketing,
                notification_product_updates
            `,
            )
            .single();

        if (error) {
            const errorResponse = standardizeError(error);
            logger.error(['Error updating notification preferences:', errorResponse]);
            return errorResponse;
        }

        logger.info(['Notification preferences updated successfully for user:', user.id]);

        return {
            success: true,
            code: 'NOTIFICATION_PREFERENCES_UPDATED',
            title: 'Preferences Updated',
            message: 'Your notification preferences have been saved.',
            description: 'Changes will take effect immediately.',
            data: {
                preferences: data as NotificationPreferences,
            },
        };
    } catch (error) {
        const errorResponse = standardizeError(error);
        logger.error(['Unexpected error updating notification preferences:', errorResponse]);
        return errorResponse;
    }
}
