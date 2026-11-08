/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/src/queries/tanstack/query-client';
import TemplatesDisplay from '@app/(protected)/app/templates/components/templates-display';
import { templatesQueryOptions } from '@queries/tanstack/templates-query-options';

export default async function TemplatesPage() {
    // ANCHOR: API URL: /api/core/user/templates
    const queryClient = getQueryClient();

    await queryClient.prefetchQuery(templatesQueryOptions());

    return (
        <div className="flex w-full max-w-full flex-col gap-7">
            <HydrationBoundary state={dehydrate(queryClient)}>
                <TemplatesDisplay />
            </HydrationBoundary>
        </div>
    );
}
