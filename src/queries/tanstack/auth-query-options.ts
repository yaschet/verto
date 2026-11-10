/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { listMfaFactors } from '@/src/actions/auth/multi-factor-authentication';
import { getUser } from '@actions/auth/get-user';

import type { Profile } from '@/types/auth/user';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';
import type { UserResponse } from '@actions/auth/get-user';
import type { Factor, User } from '@supabase/supabase-js';
import type { DefinedInitialDataOptions } from '@tanstack/react-query';

export const userDataQueryOptions = (
    userId?: string | undefined,
    options?: Partial<
        DefinedInitialDataOptions<
            UserResponse,
            ApiErrorType<UserResponse>,
            UserResponse,
            ['user-profile-query', string | undefined]
        >
    >,
) =>
    queryOptions<
        UserResponse,
        ApiErrorType<UserResponse>,
        UserResponse,
        ['user-profile-query', string | undefined]
    >({
        gcTime: 30 * 60 * 1000, // 30 minutes.
        placeholderData: keepPreviousData,
        queryFn: async () => {
            const response: ApiResponseOrError<UserResponse> = await getUser();

            if (!response || response.error) {
                throw {
                    error: {
                        message: response.message || 'Unknown error',
                        code: response.code,
                        status: response.status,
                    },
                } as unknown as ApiErrorType<UserResponse>;
            }

            return {
                profile: response.data?.profile ?? null,
                user: response.data?.user ?? null,
            } as UserResponse;
        },
        queryKey: ['user-profile-query', userId],
        select: (data) =>
            ({ user: data.user ?? null, profile: data.profile ?? null }) as {
                user: User | null;
                profile: Profile | null;
            },
        staleTime: 5 * 60 * 1000, // 5 minutes.
        enabled: !!userId,
        ...options,
    });

export const listMfaFactorsQueryOptions = (userId?: string | undefined) =>
    queryOptions<
        ApiResponseOrError<{ factors: Factor[] }>,
        ApiResponseOrError<{ factors: Factor[] }>,
        ApiResponseOrError<{ factors: Factor[] }>,
        ['mfa-factors', string | undefined]
    >({
        gcTime: 30 * 60 * 1000,
        placeholderData: keepPreviousData,
        queryFn: async () => {
            const response = await listMfaFactors();

            if (response?.error || !response) {
                throw {
                    error: {
                        message: response.message || 'Unknown error',
                        code: response.code,
                    },
                };
            }

            return response;
        },
        queryKey: ['mfa-factors', userId],
        staleTime: 5 * 60 * 1000,
        enabled: !!userId,
    });
