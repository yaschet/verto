/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

// src/actions/admin/analytics/get-active-users.ts
'use server';

import { validateUser } from '@/helpers/validate-user';
import { isApiError, standardizeError } from '@errors/api-errors';
import { getLogger } from '@services/logger';
import { createServerClient } from '@utils/supabase/server';
import type { ApiResponseOrError } from '@/types/rest/response';

export type ActiveUsersResponse = ApiResponseOrError<{
    activeUsersCount: number;
}>;

export default async function getActiveUsersCount(): Promise<ActiveUsersResponse> {
    const logger = getLogger('ACTIONS:ADMIN:ANALYTICS:GET_ACTIVE_USERS_COUNT');

    try {
        // Validate the user and ensure they have the required role:
        await validateUser({
            requiredRole: 'ADMIN',
        });

        const supabase = await createServerClient();

        // Fetch active users count directly without checking profiles.status
        const { count, error } = await supabase.from('active_users').select('profile_id', {
            count: 'exact',
            head: true,
        });

        if (error) {
            const resolvedError = standardizeError(error);
            logger.error(['Error occurred while fetching active users count.', resolvedError]);
            return resolvedError;
        }

        return {
            title: 'Active Users Count',
            data: {
                activeUsersCount: count || 1,
            },
            message: 'Successfully fetched active users count.',
            description: 'The number of active users in the system.',
            code: 'ACTIVE_USERS_COUNT',
            status: 200,
        };
    } catch (error) {
        const errorResponse = isApiError(error) ? error : standardizeError(error);
        logger.error(['Error occurred while fetching active users count.', errorResponse]);
        return error as Awaited<ReturnType<typeof getActiveUsersCount>>;
    }
}
