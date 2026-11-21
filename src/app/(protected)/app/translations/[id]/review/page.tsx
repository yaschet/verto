/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import TranslationReviewRsc from '@/app/(protected)/app/translations/[id]/review/translation-review-rsc';
import TranslationReviewSkeleton from '@/app/(protected)/app/translations/[id]/review/translation-review-skeleton';
import { createServerClient } from '@/src/utils/supabase/server';

export default async function TranslationReviewPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const supabase = await createServerClient();

    // Auth check (fast operation - keep for security)
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/auth/signin');
    }

    return (
        <Suspense fallback={<TranslationReviewSkeleton />}>
            <TranslationReviewRsc translationId={params.id} />
        </Suspense>
    );
}
