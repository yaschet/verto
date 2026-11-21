/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import type { PostgrestSingleResponse } from '@supabase/supabase-js';

/**
 * Standardized error handling for Supabase single-row queries.
 *
 * This utility handles the common PGRST116 error ("JSON object requested, multiple (or no) rows returned")
 * by converting it to a null data result instead of an error, which is often the desired behavior
 * when using .single() for optional data.
 *
 * @param response - The raw response from a Supabase .single() query
 * @returns A normalized response object where PGRST116 results in { data: null, error: null }
 *
 * @example
 * ```typescript
 * const result = await safeSingle(
 *   supabase.from('profiles').select('*').eq('id', userId).single()
 * );
 *
 * if (result.error) {
 *   // Handle real errors
 * }
 *
 * const profile = result.data; // profile or null
 * ```
 */
export async function safeSingle<T>(
    response: PostgrestSingleResponse<T>,
): Promise<{ data: T | null; error: typeof response.error }> {
    const { data, error } = response;

    if (error && error.code === 'PGRST116') {
        return { data: null, error: null };
    }

    return { data, error };
}
