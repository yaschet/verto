/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { getServerUserId } from '@/helpers/user';
import { SectionTitle } from '@app/(protected)/app/components/common';
import CreateTranslationForm, {
    AppTranslateIcon,
} from '@app/(protected)/app/translations/new/components/create-translation-form';
import { DefaultCard } from '@components/ui/card';
import { getQueryClient } from '@queries/tanstack/query-client';
import { templatesQueryOptions } from '@queries/tanstack/templates-query-options';
import { assignableCustomersQueryOptions } from '@queries/tanstack/translations-query-options';

export default async function TranslatePage() {
    const queryClient = getQueryClient();
    const userId = await getServerUserId();

    await queryClient.prefetchQuery(assignableCustomersQueryOptions(userId));
    await queryClient.prefetchQuery(templatesQueryOptions());

    return (
        <div className="container mx-auto flex h-full w-full max-w-2xl flex-col items-start justify-start gap-6">
            <div className="flex w-full max-w-full flex-col items-start justify-start gap-3">
                <SectionTitle icon={AppTranslateIcon} title="Translate Your Scanned Document"></SectionTitle>
            </div>
            <DefaultCard className="relative flex h-auto w-full flex-col items-start justify-start gap-4">
                <p className="text-muted text-sm">
                    Easily translate your scanned diplomas, transcripts, and legal documents. Fill out the
                    form below to get started.
                </p>
                <CreateTranslationForm />
            </DefaultCard>
        </div>
    );
}
