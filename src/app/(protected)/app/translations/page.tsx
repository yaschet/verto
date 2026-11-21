/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getServerUserId } from '@/helpers/user';
import { paginatedTranslationsQueryOptions } from '@/src/queries/tanstack/translations-query-options';
import TranslationsPageContent from '@app/(protected)/app/translations/translations-page';
import { getQueryClient } from '@queries/tanstack/query-client';
import type { SearchParams } from '@/types/rest/common';
import type { TranslationColumn } from '@schemas/translation-schemas';

export default async function TranslationsPage(props: { searchParams: Promise<SearchParams> }) {
    const searchParams = await props.searchParams;
    const queryClient = getQueryClient();
    const userId = await getServerUserId();
    const queryPageIndex: number = searchParams.page ? parseInt(searchParams.page as string) : 1;
    const queryPageSize: number = searchParams.limit ? parseInt(searchParams.limit as string) : 10;
    const queryPageFilter: string | null = searchParams.keyword ? (searchParams.keyword as string) : null;

    // Default sort: Created At (desc) - newest first
    const queryPageSortBy: TranslationColumn | null = searchParams.sortby
        ? (searchParams.sortby as TranslationColumn)
        : 'created_at';
    const queryPageSortDirection: 'asc' | 'desc' = searchParams.sortby
        ? searchParams.direction === 'desc'
            ? 'desc'
            : 'asc'
        : 'desc'; // Default to desc for created_at

    const queryPageCustomer: string | null = searchParams.customer ? (searchParams.customer as string) : null;

    await queryClient.prefetchQuery(
        paginatedTranslationsQueryOptions({
            userId,
            queryPageCustomer,
            queryPageFilter,
            queryPageIndex,
            queryPageSize,
            queryPageSortBy,
            queryPageSortDirection,
        }),
    );

    return (
        <div className="flex w-full max-w-full flex-col gap-7">
            <HydrationBoundary state={dehydrate(queryClient)}>
                <TranslationsPageContent />
            </HydrationBoundary>
        </div>
    );
}
