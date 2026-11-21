/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import type { Tables } from '@/types/database/database';

export type UserRole = 'USER' | 'ADMIN';

export type Profile = Tables<'profiles'>;

export const ADMIN_ROLE: UserRole = 'ADMIN';
export const USER_ROLE: UserRole = 'USER';

export const ROLES = {
    ADMIN: ADMIN_ROLE,
    USER: USER_ROLE,
};
