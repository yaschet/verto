/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { Fragment } from 'react';
import { getServerUserId } from '@/helpers/user';
import { getQueryClient } from '@/src/queries/tanstack/query-client';
import { RecentTranslationsTable } from '@app/(protected)/app/dashboard/components/recent-translations/recent-translations-table';
import { RecentTranslationsTitle } from '@app/(protected)/app/dashboard/components/recent-translations/recent-translations-title';
import { DefaultCard } from '@components/ui/card';
import { ScrollArea, ScrollBar } from '@components/ui/scroll-area';
import { recentTranslationsQueryOptions } from '@queries/tanstack/translations-query-options';

export default async function RecentTranslations() {
    // ANCHOR: API URL: /api/core/user/translations
    const queryClient = getQueryClient();
    const userId = await getServerUserId();

    // ANCHOR: Prefetch the data for the page
    await queryClient.prefetchQuery(
        recentTranslationsQueryOptions(userId, {
            queryPageSize: 5,
        }),
    );

    return (
        <Fragment>
            {/* Section for Recent Translations, displaying a data table with a limit of 5 rows. */}
            <div className="flex w-full max-w-full flex-col items-start justify-start gap-3">
                {/* Title of the Section */}
                <RecentTranslationsTitle />
                {/* Cards */}
                <div className="relative flex h-auto w-full max-w-full flex-row items-center justify-start gap-4">
                    <DefaultCard>
                        <ScrollArea className="flex w-full flex-col gap-2">
                            <HydrationBoundary state={dehydrate(queryClient)}>
                                <RecentTranslationsTable />
                            </HydrationBoundary>
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                    </DefaultCard>
                </div>
            </div>
        </Fragment>
    );
}
