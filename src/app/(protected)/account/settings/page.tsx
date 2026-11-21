/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getServerUserId } from '@/helpers/user';
import { getQueryClient } from '@/src/queries/tanstack/query-client';
import DocumentBrandingPanel from '@app/(protected)/account/settings/components/document-branding-panel';
import NotificationPreferencesPanel from '@app/(protected)/account/settings/components/notification-preferences-panel';
import { userDataQueryOptions } from '@queries/tanstack/auth-query-options';

import { redirect } from 'next/navigation';
import { getUserRole } from '@/helpers/user';

export default async function SettingsPage() {
    const queryClient = getQueryClient();
    const userId = await getServerUserId();
    const userRole = await getUserRole(userId);

    // Admins should not access settings
    if (userRole === 'ADMIN') {
        redirect('/account');
    }

    // Prefetch user data on server for instant render
    await queryClient.prefetchQuery(userDataQueryOptions(userId || ''));

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <div className="flex w-full max-w-screen-lg flex-col gap-6 py-6">
                <ul className="flex w-full flex-col items-start justify-start gap-12">
                    <DocumentBrandingPanel />
                    <NotificationPreferencesPanel />
                </ul>
            </div>
        </HydrationBoundary>
    );
}
