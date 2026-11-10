/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { cache } from 'react';

import { createAdminClient, createServerClient } from '@utils/supabase/server';
import { safeSingle } from '@utils/supabase/safe-single';
import type { Profile, UserRole } from '@/types/auth/user';
import type { User, UserResponse } from '@supabase/supabase-js';

/**
 * Get the current user's role
 *
 * @returns {Promise<UserRole | null>}
 */
export const getUserRole: (userId: string | null | undefined) => Promise<UserRole | null> = cache(
    async (userId: string | null | undefined): Promise<UserRole | null> => {
        const supabase = await createAdminClient();

        if (!userId) {
            return null;
        }

        // Fetch role from the 'user_roles' table
        const { data: userRoleData, error: roleError } = await safeSingle(
            await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', userId ?? 'undefined')
                .single(),
        );

        if (roleError) {
            return null;
        }

        return (userRoleData?.role as UserRole) || null;
    },
);

/**
 * Get the current user's profile status
 *
 * @param {string | null | undefined} userId
 * @returns {Promise<string | null>}
 */
export const getUserStatus: (userId: string | null | undefined) => Promise<string | null> = cache(
    async (userId: string | null | undefined): Promise<string | null> => {
        const supabase = await createAdminClient();

        if (!userId) {
            return null;
        }

        // Fetch status from the 'profiles' table
        const { data: profileData, error: profileError } = await safeSingle(
            await supabase.from('profiles').select('account_status').eq('id', userId).single(),
        );

        if (profileError) {
            return null;
        }

        return profileData?.account_status || null;
    },
);

/**
 * Retrieves the current server session.
 *
 * @returns {Promise<Session | null>} - The current session or null if no session is found.
 */

/**
 * Retrieves the user ID from the current server session.
 *
 * @returns {Promise<string | null>} - The user ID or null if no session or user is found.
 */
export const getServerUserId = cache(async (): Promise<string | null> => {
    const userResponse: User | null = await getServerUser();
    return userResponse?.id ?? null;
});

/**
 * Retrieves the user object from the current server session.
 *
 * @returns {Promise<User | null>} - The user object or null if no user is found.
 */
export const getServerUser = cache(async (): Promise<User | null> => {
    const userResponse: User | null = await (
        await createServerClient()
    ).auth
        .getUser()
        ?.then((response: UserResponse) => response?.data?.user ?? null)
        .catch(() => null);

    return userResponse ?? null;
});

/**
 * Retrieves the user's profile from the database.
 * This is wrapped in React.cache() to ensure only one profile fetch per request.
 *
 * @returns {Promise<Profile | null>} - The user's profile or null if not found.
 */
export const getServerProfile = cache(async (): Promise<Profile | null> => {
    const user = await getServerUser();
    if (!user) return null;

    const supabase = await createServerClient();
    const { data: profile, error } = await safeSingle(
        await supabase.from('profiles').select('*').eq('id', user.id).single(),
    );

    if (error || !profile) return null;
    return profile as Profile;
});
