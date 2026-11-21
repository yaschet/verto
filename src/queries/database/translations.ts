/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { getLogger } from '@services/logger';
import type { TranslationColumn } from '@/src/schemas/translation-schemas';
import type { Database } from '@/types/database/database';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Generates a paginated query for fetching translations with customer information.
 *
 * @param {SupabaseClient<Database>} client - The Supabase client instance.
 * @param {Object} params - The parameters for pagination and filtering.
 * @param {number} params.page - The current page number (0-indexed).
 * @param {number} params.pageSize - The number of items per page.
 * @param {string} [params.pageFilter] - The filter string to apply to multiple columns.
 * @param {TranslationColumn} [params.pageSortBy] - The column to sort by.
 * @param {'asc' | 'desc'} params.pageSortOrder - The sort order ('asc' or 'desc').
 * @param {string} [params.customerId] - The customer ID to filter by.
 * @param {string} params.profileId - The profile ID to filter by.
 */
export function getPaginatedTranslationsQuery(
    client: SupabaseClient<Database>,
    params: {
        page: number;
        pageSize: number;
        pageFilter?: string | null;
        pageSortBy?: TranslationColumn | null;
        pageSortOrder: 'asc' | 'desc';
        profileId: string;
        customerId?: string | null;
    },
) {
    const logger = getLogger('QUERIES:TRANSLATIONS');

    let query = client
        .from('extended_translation_view')
        .select('*')
        .eq('profile_id', params.profileId)
        .range(params.page * params.pageSize, (params.page + 1) * params.pageSize - 1);

    if (params.pageFilter && params.pageFilter.trim() !== '') {
        const filter = params.pageFilter.trim();
        query = query.or(
            `display_name.ilike.%${filter}%,description.ilike.%${filter}%,customer_name.ilike.%${filter}%,customer_email.ilike.%${filter}%,status::text.ilike.%${filter}%,source_language.ilike.%${filter}%,target_language.ilike.%${filter}%`,
        );
    }

    // Sort by custom status_order and then by created_at as default
    if (params.pageSortBy && params.pageSortOrder) {
        query = query.order(params.pageSortBy, { ascending: params.pageSortOrder === 'asc' });
    } else {
        query = query
            .order('status_order', { ascending: params.pageSortOrder === 'asc' })
            .order('created_at', { ascending: false })
            .order('completed_at', { ascending: false })
            .order('started_at', { ascending: false })
            .order('updated_at', { ascending: false });
    }

    if (params.customerId) {
        query = query.eq('customer_id', params.customerId);
    }

    logger.info('Paginated Translations Query:', query);

    return query;
}

/**
 * Generates a query for fetching the count of translations with customer information.
 *
 * @param {SupabaseClient<Database>} client - The Supabase client instance.
 * @param {Object} params - The parameters for filtering the count query.
 * @param {string} [params.profileId] - The profile ID to filter by.
 * @param {string} [params.customerId] - The customer ID to filter by.
 */
export function getTranslationsCountQuery(
    client: SupabaseClient<Database>,
    params: {
        profileId: string;
        customerId?: string | null;
    },
) {
    let query = client
        .from('extended_translation_view')
        .select('id', { count: 'exact' })
        .eq('profile_id', params.profileId);

    if (params.customerId !== null && params.customerId !== undefined && params.customerId.length > 0) {
        query = query.eq('customer_id', params.customerId);
    }

    return query;
}

export function getRecentTranslationsQuery(
    client: SupabaseClient<Database>,
    profileId: string,
    limit: number,
) {
    return client
        .from('extended_translation_view')
        .select('*')
        .eq('profile_id', profileId)
        .order('status_order', { ascending: true })
        .order('created_at', { ascending: false })
        .order('completed_at', { ascending: false })
        .order('started_at', { ascending: false })
        .order('updated_at', { ascending: false })
        .limit(limit);
}
