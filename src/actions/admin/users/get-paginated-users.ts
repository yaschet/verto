/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import type { SupabaseClient } from '@supabase/supabase-js';
type AuthDatabase = {
    auth: {
        Tables: {
            mfa_factors: {
                Row: { user_id: string; status: string };
                Insert: { user_id: string; status: string };
                Update: { user_id?: string; status?: string };
                Relationships: [];
            };
        };
        Views: Record<string, never>;
        Functions: Record<string, never>;
    };
};
import { validateUser } from '@/helpers/validate-user';
import { isApiError, standardizeError } from '@/src/errors/api-errors';
import { getPaginatedUsersQuery, getUsersCountQuery } from '@/src/queries/database/admin-users';
import { AdminUsersQueryParamsSchema } from '@/src/schemas/admin-user-schemas';
import { createServerClient } from '@/src/utils/supabase/server';
import { getLogger } from '@services/logger';
import type { AdminUserRow } from '@/src/schemas/admin-user-schemas';
import type { UserRole } from '@/types/auth/user';
import type { PaginatedQueryParams } from '@/types/rest/common';
import type { PaginatedResponse } from '@/types/rest/common';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';

export async function getPaginatedUsers({
    page = 0,
    pageFilter = null,
    pageRole = null,
    pageStatus = null,
    pageSize = 10,
    pageSortBy = null,
    pageSortOrder = 'desc',
}: PaginatedQueryParams<keyof AdminUserRow> & {
    pageRole?: string | null;
    pageStatus?: string | null;
}): Promise<ApiResponseOrError<PaginatedResponse<AdminUserRow>>> {
    const logger = getLogger('ACTIONS:ADMIN:USERS:GET_PAGINATED');
    const supabase = await createServerClient(); // Renamed from 'client' to 'supabase' to match existing code

    try {
        // Check if the user is authenticated and has admin role:
        await validateUser({ requiredRole: 'ADMIN' });

        // Handle Role Filtering
        let userIdsByRole: string[] | null = null;
        if (pageRole && pageRole !== 'all') {
            const { data: roleData, error: roleError } = await supabase
                .from('user_roles')
                .select('user_id')
                .eq('role', pageRole);

            if (roleError) throw standardizeError(roleError);
            userIdsByRole = roleData.map((r) => r.user_id);

            // If no users found with this role, return empty immediately
            if (userIdsByRole.length === 0) {
                return {
                    data: {
                        pagination: {
                            nextPage: null,
                            pageIndex: page,
                            pageSize: pageSize,
                            pagesCount: 0,
                            prevPage: null,
                        },
                        results: [],
                        total: 0,
                    },
                    description: 'No users found with the specified role.',
                    message: 'Users retrieved successfully.',
                    status: 200,
                    success: true,
                    title: 'Users Retrieved',
                };
            }
        }

        // Validate the passed parameters against the Zod schema:
        const validatedParamsResult = await AdminUsersQueryParamsSchema.safeParseAsync({
            page,
            pageFilter,
            pageSize,
            pageSortBy,
            pageSortOrder,
            pageRole, // Added pageRole to validation
            pageStatus, // Added pageStatus to validation
        });

        if (!validatedParamsResult.success) {
            const formattedErrors = validatedParamsResult.error.issues
                .map((issue) => `${issue.message}`)
                .join(' ');

            const errorDescription = `There were issues with the provided query parameters: ${formattedErrors}`;

            const errorResponse = standardizeError({
                code: 'INVALID_PARAMETERS',
                description: errorDescription,
                message: 'Invalid parameters provided. Please review the errors below:',
                status: 400,
                title: 'Invalid Parameters',
            });

            logger.error([
                'The service failed to fetch user data due to the following error:',
                errorResponse,
            ]);

            return errorResponse;
        }

        const validatedParams = validatedParamsResult.data;

        // Use the separated query function
        const query = getPaginatedUsersQuery(supabase, {
            page: validatedParams.page,
            pageFilter: validatedParams.pageFilter,
            pageSize: validatedParams.pageSize,
            pageSortBy: validatedParams.pageSortBy,
            pageSortOrder: validatedParams.pageSortOrder,
            pageStatus: validatedParams.pageStatus,
            userIds: userIdsByRole,
        });

        // Execute the query:
        const { data: users, error } = await query;

        if (error) {
            const errorResponse = standardizeError(error);
            logger.error([
                'The service has failed to fetch the users data, due to the following error:',
                errorResponse,
            ]);
            return errorResponse;
        }

        // Ensure users is not undefined:
        const profilesData = users ?? [];

        // Fetch roles and MFA status for these users
        let usersData: AdminUserRow[] = [];
        if (profilesData.length > 0) {
            const userIds = profilesData.map((u) => u.id);

            // 1. Fetch Roles
            const { data: rolesData, error: rolesError } = await supabase
                .from('user_roles')
                .select('user_id, role')
                .in('user_id', userIds);

            if (rolesError) {
                logger.error(['Failed to fetch user roles:', rolesError]);
            }

            // 2. Fetch MFA Factors (Auth Schema) & Last Heartbeat (Public Schema)
            const mfaUserIds = new Set<string>();
            const lastHeartbeatMap = new Map<string, string>();

            try {
                // Fetch latest heartbeats from user_activity
                // We fetch a batch of recent heartbeats for these users.
                // Limit to 1000 to avoid performance issues, hoping to catch recent activity.
                const { data: activityData } = await supabase
                    .from('user_activity')
                    .select('profile_id, created_at')
                    .in('profile_id', userIds)
                    .eq('type', 'heartbeat')
                    .order('created_at', { ascending: false })
                    .limit(1000);

                if (activityData) {
                    activityData.forEach((row) => {
                        // Since it's ordered desc, the first time we see a profile_id, it's the latest
                        if (row.profile_id && !lastHeartbeatMap.has(row.profile_id)) {
                            lastHeartbeatMap.set(row.profile_id, row.created_at);
                        }
                    });
                }

                // The auth schema is managed by Supabase and is separate from the public application schema.

                const { data: mfaData, error: mfaError } = await (
                    supabase as unknown as SupabaseClient<AuthDatabase, 'auth'>
                )
                    .schema('auth')
                    .from('mfa_factors')
                    .select('user_id')
                    .in('user_id', userIds)
                    .eq('status', 'verified');

                if (!mfaError && mfaData) {
                    mfaData.forEach((f: { user_id: string }) => mfaUserIds.add(f.user_id));
                }
            } catch {
                logger.warn('Failed to fetch auxiliary user data');
            }

            const rolesMap = new Map<string, UserRole>();
            if (rolesData) {
                rolesData.forEach((r) => {
                    if (r.role) rolesMap.set(r.user_id, r.role as UserRole);
                });
            }

            usersData = profilesData.map((profile) => {
                // Determine best last_active source:
                // 1. active_users (Real-time/Recent, effectively "Online Now")
                // 2. user_activity (Heartbeat history)
                // 3. Fallback to null
                const realTimeActive = profile.active_users?.last_active;
                const persistentActive = lastHeartbeatMap.get(profile.id);

                let lastActive = realTimeActive;

                // If real-time is missing (logged out), use persistent heartbeat
                if (!lastActive && persistentActive) {
                    lastActive = persistentActive;
                } else if (lastActive && persistentActive) {
                    // Use the most recent
                    if (new Date(persistentActive) > new Date(lastActive)) {
                        lastActive = persistentActive;
                    }
                }

                return {
                    ...profile,
                    role: rolesMap.get(profile.id) ?? null,
                    credits: profile.credits?.amount ?? 0,
                    last_active_at: lastActive ?? null,
                    mfa_enabled: mfaUserIds.has(profile.id),
                };
            });
        }

        // Get the total count for pagination purposes:
        const { count, error: countError } = await getUsersCountQuery(supabase);

        if (countError) {
            const errorResponse = standardizeError(countError);
            logger.error([
                'The service has failed to fetch the users count, due to the following error:',
                errorResponse,
            ]);
            return errorResponse;
        }

        const totalCount: number = count ?? 0;

        const responseObject: PaginatedResponse<AdminUserRow> = {
            pagination: {
                nextPage:
                    (validatedParams.page + 1) * validatedParams.pageSize < totalCount
                        ? validatedParams.page + 1
                        : null,
                pageIndex: validatedParams.page,
                pageSize: validatedParams.pageSize,
                pagesCount: Math.ceil(totalCount / validatedParams.pageSize),
                prevPage: validatedParams.page > 0 ? validatedParams.page - 1 : null,
            },
            results: usersData,
            total: totalCount,
        };

        return {
            data: responseObject,
            description: 'User data has been successfully retrieved.',
            message: 'Users retrieved successfully.',
            status: 200,
            success: true,
            title: 'Users Retrieved',
        };
    } catch (error) {
        const errorResponse: ApiErrorType = isApiError(error)
            ? (error as ApiErrorType)
            : standardizeError(error);
        logger.error([
            'The service has failed to fetch the users data, due to the following error:',
            errorResponse,
        ]);
        return errorResponse;
    }
}
