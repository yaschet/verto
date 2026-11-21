/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import type { Database, Tables } from '@/types/database/database';
import type { SupabaseClient } from '@supabase/supabase-js';

export function getPaginatedCustomersQuery(
    client: SupabaseClient<Database>,
    params: {
        profileId: string;
        page: number;
        pageSize: number;
        pageFilter?: string | null;
        pageSortBy?: keyof Tables<'extended_customer_view'> | null;
        pageSortOrder: 'asc' | 'desc';
    },
) {
    let query = client
        .from('extended_customer_view')
        .select('*')
        .range(params.page * params.pageSize, (params.page + 1) * params.pageSize - 1)
        .eq('profile_id', params.profileId);

    if (params.pageFilter && params.pageFilter.trim() !== '') {
        const filter = encodeURIComponent(params.pageFilter.trim());
        query = query.or(`display_name.ilike.%${filter}%,email.ilike.%${filter}%,phone.ilike.%${filter}%`);
    }

    if (params.pageSortBy && params.pageSortOrder) {
        query = query.order(params.pageSortBy, { ascending: params.pageSortOrder === 'asc' });
    } else {
        query = query.order('created_at', { ascending: false });
    }

    return query;
}

export function getCustomersCountQuery(client: SupabaseClient<Database>, profileId: string) {
    return client.from('extended_customer_view').select('id', { count: 'exact' }).eq('profile_id', profileId);
}
