/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import type { Database, Tables } from '@/types/database/database';
import type { SupabaseClient } from '@supabase/supabase-js';

export function getPaginatedUsersQuery(
    client: SupabaseClient<Database>,
    params: {
        page: number;
        pageSize: number;
        pageFilter?: string | null;
        pageRole?: string | null;
        pageStatus?: string | null;
        pageSortBy?: keyof Tables<'profiles'> | null;
        pageSortOrder: 'asc' | 'desc';
        userIds?: string[] | null;
    },
) {
    let query = client
        .from('profiles')
        .select('*, credits(amount), active_users(last_active)')
        .range(params.page * params.pageSize, (params.page + 1) * params.pageSize - 1);

    if (params.pageStatus && params.pageStatus !== 'all') {
        query = query.eq('status', params.pageStatus);
    }

    if (params.userIds && params.userIds.length > 0) {
        query = query.in('id', params.userIds);
    }

    if (params.pageFilter) {
        query = query.or(`full_name.ilike.%${params.pageFilter}%,email.ilike.%${params.pageFilter}%`);
    }

    if (params.pageSortBy && params.pageSortOrder) {
        query = query.order(params.pageSortBy, { ascending: params.pageSortOrder === 'asc' });
    } else {
        query = query.order('created_at', { ascending: false });
    }

    return query;
}

export function getUsersCountQuery(client: SupabaseClient<Database>) {
    return client.from('profiles').select('id', { count: 'exact' });
}
