/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { redirect } from 'next/navigation';
import { MFaChallengeForm } from '@/app/auth/mfa/challenge/mfa-challenge-page';
import { getLogger } from '@/services/logger';
import { getQueryClient } from '@/src/queries/tanstack/query-client';
import { getAALLevel } from '@actions/auth/multi-factor-authentication';
import { getServerUserId } from '@/helpers/user';
import { listMfaFactorsQueryOptions } from '@queries/tanstack/auth-query-options';
import type { SearchParams } from '@/types/rest/common';

export default async function MFAChallengePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
    const searchParamsResolved = await searchParams;

    // Get the logger utility:
    const logger = getLogger('MFA_CHALLENGE_PAGE');

    // Create a new query client:
    const queryClient = getQueryClient();
    const userId = await getServerUserId();

    await queryClient.prefetchQuery(listMfaFactorsQueryOptions(userId ?? undefined));

    const callbackPathname: string = searchParamsResolved.callback
        ? searchParamsResolved.callback?.toString()?.length > 0
            ? searchParamsResolved.callback?.toString()
            : '/app/dashboard'
        : '/app/dashboard';

    const aalResult = await getAALLevel();

    if (aalResult.error) {
        logger.error({
            error: aalResult,
            message: 'Error fetching AAL level in MFA Challenge page.',
        });

        redirect(callbackPathname);
    }

    if (aalResult.data?.currentLevel === 'aal2') {
        redirect(callbackPathname);
    }

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <MFaChallengeForm callbackPathname={callbackPathname ?? '/app/dashboard'} />
        </HydrationBoundary>
    );
}
