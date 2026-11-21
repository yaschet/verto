/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { standardizeError } from '@errors/api-errors';
import { getLogger } from '@services/logger';
import { createAdminClient } from '@utils/supabase/server';
import type { Enums } from '@/types/database/database';

export type ActivityType = Enums<'user_activity_type'>;

export async function logUserActivity(
    profileId: string,
    type: ActivityType,
    details?: Record<string, unknown>,
) {
    const logger = getLogger('HELPERS:ACTIVITY_LOGGER');
    try {
        const supabase = await createAdminClient();

        const { error } = await supabase.from('user_activity').insert({
            profile_id: profileId,
            type,
            details,
        });

        if (error) {
            logger.error([`Failed to log activity of type "${type}" for user ${profileId}:`, error]);
        }

        return { error };
    } catch (error) {
        const standardizedError = standardizeError(error);
        logger.error(['Failed to log user activity:', error]);
        return standardizedError;
    }
}
