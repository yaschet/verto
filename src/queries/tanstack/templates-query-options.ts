/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { queryOptions } from '@tanstack/react-query';
import { getAllTemplates } from '@actions/services/templates/get-all-templates';
import type { Tables } from '@/types/database/database';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';
import type { UndefinedInitialDataOptions } from '@tanstack/react-query';

export const templatesQueryOptions = (
    otherOptions?: Partial<
        UndefinedInitialDataOptions<
            ApiResponseOrError<{
                templates: Tables<'templates'>[];
                templates_collections: Tables<'templates_collections'>[];
            }>,
            ApiErrorType,
            { templates: Tables<'templates'>[]; templates_collections: Tables<'templates_collections'>[] },
            ['templates']
        >
    >,
) =>
    queryOptions<
        ApiResponseOrError<{
            templates: Tables<'templates'>[];
            templates_collections: Tables<'templates_collections'>[];
        }>,
        ApiErrorType,
        { templates: Tables<'templates'>[]; templates_collections: Tables<'templates_collections'>[] },
        ['templates']
    >({
        queryFn: async () => {
            const response = await getAllTemplates();

            if (response?.error || !response) {
                console.error(response?.error || !response);
                throw response;
            }

            return response;
        },
        queryKey: ['templates'],
        refetchInterval: 60 * 60 * 1000 * 24 * 7,
        refetchIntervalInBackground: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
        retry: 3,
        retryDelay: (attempt) => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000),
        select: (information) =>
            information.data ?? { templates: [], templates_collections: [] } /** 1 week. */,
        staleTime: 60 * 60 * 1000 * 24 * 7 /** 1 week. */,
        ...otherOptions,
    });
