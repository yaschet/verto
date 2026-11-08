/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import TranslationDetailsRsc from '@/app/(protected)/app/translations/[id]/translation-details-rsc';
import TranslationDetailsSkeleton from '@/app/(protected)/app/translations/[id]/translation-details-skeleton';
import { createServerClient } from '@/src/utils/supabase/server';

export default async function TranslationDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const supabase = await createServerClient();

    // Auth check (keep this for security - fast operation)
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/auth/signin');
    }

    return (
        <Suspense fallback={<TranslationDetailsSkeleton />}>
            <TranslationDetailsRsc translationId={params.id} />
        </Suspense>
    );
}
