/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { validateUser } from '@/helpers/validate-user';
import { createAdminClient } from '@utils/supabase/server';
import type { Enums } from '@/types/database/database';
import type { ApiResponseOrError } from '@/types/rest/response';

export type UserActivityType = Enums<'user_activity_type'>;

export type UserActivityReport = {
    type: Enums<'user_activity_type'>;
    timestamp: string;
};

export async function getUserActivityReports(filters?: {
    startDate?: Date;
    endDate?: Date;
}): Promise<ApiResponseOrError<UserActivityReport[]>> {
    // Validate the user and ensure they have the required role:
    await validateUser({
        requiredRole: 'ADMIN',
    });

    // Fetch the user activity reports data:
    const userActivityReports = await getSupabaseUserActivityReports(filters);

    return {
        data: userActivityReports,
        description: `${userActivityReports.length} user activity reports retrieved.`,
        message: 'User activity reports successfully retrieved.',
        title: 'User Activity Reports Retrieved',
        status: 200,
        success: true,
    };
}

/**
 * Retrieves the User Activity Reports for the specified date range.
 *
 * - If both `startDate` and `endDate` filters are provided, retrieves the user activity reports within that range.
 * - If only `endDate` is provided, retrieves the user activity reports up to that date.
 * - If no filters are provided, retrieves all available user activity reports.
 *
 * @param {Object} filters - Optional filters for date ranges.
 * @param {Date} filters.startDate - The start date for filtering user activity reports (optional).
 * @param {Date} filters.endDate - The end date for filtering user activity reports (optional).
 * @returns {Promise<UserActivityReport[]>} - A promise that resolves to the user activity reports data.
 */
async function getSupabaseUserActivityReports(filters?: {
    startDate?: Date;
    endDate?: Date;
}): Promise<UserActivityReport[]> {
    const supabase = await createAdminClient();
    let query = supabase
        .from('user_activity')
        .select('type,created_at')
        // — We specify the types of user activities that we want to retrieve.
        .in('type', [
            'sign_in',
            'sign_out',
            'heartbeat',
            'enabled_mfa',
            'disabled_mfa',
            'changed_email',
            'changed_password',
            'closed_account',
            'updated_profile',
            'created_customer',
            'updated_customer',
            'deleted_customer',
            'created_translation',
            'deleted_translation',
            'assigned_customer_to_translation',
            'initiated_checkout',
            'completed_checkout',
            'failed_checkout',
            'opened_billing_portal',
            'customer_deleted',
            'accessed_signed_url',
        ])
        .order('created_at', {
            ascending: true,
        });

    if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
    }

    if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
    }

    // Increase the limit to fetch more data points (e.g., 50,000)
    // and sort by most recent first to ensure we get current data.
    const { data, error } = await query.order('created_at', { ascending: false }).range(0, 49999);

    if (error) {
        throw error;
    }

    const preparedData = data.map((item) => ({
        type: item.type,
        timestamp: item.created_at,
    }));

    return (preparedData as UserActivityReport[]) ?? [];
}
