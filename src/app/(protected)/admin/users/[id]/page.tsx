/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import UserProfileClient from './user-profile-client';
import UserProfileSkeleton from './user-profile-skeleton';
import { getServerUserId, getUserRole } from '@/helpers/user';
import { userQueryOptions } from '@/src/queries/tanstack/admin/users-query-options';
import { getQueryClient } from '@/src/queries/tanstack/query-client';

export default async function AdminUserProfilePage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const queryClient = getQueryClient();
    const sessionUserId = await getServerUserId();

    const userRole = await getUserRole(sessionUserId);
    if (userRole !== 'ADMIN') {
        redirect('/app');
    }

    await queryClient.prefetchQuery(userQueryOptions(params.id));

    return (
        <Suspense fallback={<UserProfileSkeleton />}>
            <HydrationBoundary state={dehydrate(queryClient)}>
                <UserProfileClient userId={params.id} />
            </HydrationBoundary>
        </Suspense>
    );
}
