/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import TranslationReviewClient from '@/app/(protected)/app/translations/[id]/review/translation-review-client';
import { getQueryClient } from '@queries/tanstack/query-client';
import { translationReviewQueryOptions } from '@queries/tanstack/translations-query-options';

type Props = {
    translationId: string;
};

export default async function TranslationReviewRsc({ translationId }: Props) {
    const queryClient = getQueryClient();

    await queryClient.prefetchQuery(translationReviewQueryOptions(translationId));

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <TranslationReviewClient translationId={translationId} />
        </HydrationBoundary>
    );
}
