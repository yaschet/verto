/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import 'server-only';
import { type CookieOptions, createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { type SupabaseClient, createClient as createSupabaseJSClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { env } from '@/env';
import type { ExtendedDatabase } from '@/types/database/database.extended';

/**
 * Creates a Supabase client for server-side use, with cookie handling.
 * This is wrapped in React.cache() to ensure a single client instance per request/render pass.
 *
 * @returns - The Supabase client instance.
 */
export const createServerClient = cache(async (): Promise<SupabaseClient<ExtendedDatabase>> => {
    const cookieStore = await cookies();

    return createSupabaseServerClient<ExtendedDatabase>(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(
                            ({
                                name,
                                options,
                                value,
                            }: {
                                name: string;
                                value: string;
                                options: CookieOptions;
                            }) => cookieStore.set(name, value, options),
                        );
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing user sessions.
                    }
                },
            },
        },
    );
});

/**
 * Creates a Supabase client with admin privileges.
 * Also wrapped in React.cache() for request-scoped singleton.
 *
 * @returns {Promise<ReturnType<typeof createSupabaseJSClient<ExtendedDatabase>>>} - The Supabase client instance with admin privileges.
 */
export const createAdminClient = cache(
    async (): Promise<ReturnType<typeof createSupabaseJSClient<ExtendedDatabase>>> => {
        return createSupabaseJSClient<ExtendedDatabase>(
            env.NEXT_PUBLIC_SUPABASE_URL,
            env.SUPABASE_SERVICE_ROLE_KEY,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            },
        );
    },
);
