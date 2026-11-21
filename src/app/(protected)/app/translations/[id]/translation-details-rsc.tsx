/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import TranslationDetailsClient from '@/app/(protected)/app/translations/[id]/translation-details-client';
import { getQueryClient } from '@queries/tanstack/query-client';
import { translationDetailQueryOptions } from '@queries/tanstack/translations-query-options';

type Props = {
    translationId: string;
};

export default async function TranslationDetailsRsc({ translationId }: Props) {
    const queryClient = getQueryClient();

    await queryClient.prefetchQuery(translationDetailQueryOptions(translationId));

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <TranslationDetailsClient translationId={translationId} />
        </HydrationBoundary>
    );
}
