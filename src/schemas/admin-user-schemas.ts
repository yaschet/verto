/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { z } from 'zod';
import type { Tables } from '@/types/database/database';

import type { UserRole } from '@/types/auth/user';

// Define the AdminUserRow type based on the profiles table, extended with role and joined data
export type AdminUserRow = Tables<'profiles'> & {
    role: UserRole | null;
    credits: number | null;
    last_active_at: string | null;
    mfa_enabled: boolean;
};

// Extract the keys of 'profiles' dynamically:
export type AdminUserColumn = keyof Tables<'profiles'>;

// Convert the object to a Zod Enum compatible array:
// Note: We need to cast this because Object.keys returns string[]
export const AdminUserColumnsArray = ['full_name', 'email', 'status', 'created_at'] as const;

export type AdminUserPublicColumn = (typeof AdminUserColumnsArray)[number];

// Create the enum dynamically from the AdminUserColumn type
// We use a subset of columns that are relevant for sorting/displaying in the table
export const AdminUserPublicColumnsArray: [AdminUserPublicColumn, ...AdminUserPublicColumn[]] = [
    'full_name',
    'email',
    'status',
    'created_at',
];

// Define the Zod schema for the admin user query parameters
export const AdminUserColumnSchema = z.enum(AdminUserPublicColumnsArray, {
    error: `The page sort by field is invalid, and must be one of the following: ${AdminUserPublicColumnsArray.join(', ')}.`,
});

export const AdminUsersQueryParamsSchema = z.object({
    page: z
        .number({
            error: 'The page index must be a positive integer.',
        })
        .int({
            message: 'The page index must be an integer.',
        })
        .nonnegative({
            message: 'The page index must be a non-negative integer.',
        })
        .default(0),
    pageFilter: z
        .string({
            error: 'The page filter must be a string.',
        })
        .nullable()
        .optional(),
    pageRole: z.string().nullable().optional(),
    pageStatus: z.string().nullable().optional(),
    pageSize: z
        .number({
            error: 'The page size must be a positive integer.',
        })
        .int({
            message: 'The page size must be an integer.',
        })
        .positive({
            message: 'The page size must be a positive integer.',
        })
        .default(10),
    pageSortBy: AdminUserColumnSchema.nullable().optional(),
    pageSortOrder: z.enum(['asc', 'desc']).default('desc'),
});
