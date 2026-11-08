/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { ArrowLeftIcon, ArrowsClockwiseIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DefaultCard } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/animated-tabs';
import { userQueryOptions } from '@/src/queries/tanstack/admin/users-query-options';
import { UserBillingSection } from './components/user-billing-section';
import { UserProfileDetails } from './components/user-profile-details';
import { UserProfileHeader } from './components/user-profile-header';
import UserProfileSkeleton from './user-profile-skeleton';

type UserProfileClientProps = {
    userId: string;
};

export default function UserProfileClient({ userId }: UserProfileClientProps) {
    useRouter();
    const { data: user, error, isError, isLoading, refetch } = useQuery(userQueryOptions(userId));

    if (isLoading) {
        return <UserProfileSkeleton />;
    }

    if (isError || !user) {
        return (
            <div className="flex w-full max-w-full flex-col gap-5">
                <div className="flex items-center justify-between gap-4">
                    <Link href="/admin/users">
                        <Button className="gap-2" color="secondary" variant="soft">
                            <ArrowLeftIcon className="size-4" />
                            Back
                        </Button>
                    </Link>
                </div>

                <DefaultCard className="flex flex-col items-center justify-center gap-4 p-12">
                    <WarningCircleIcon className="text-destructive size-12" weight="duotone" />
                    <div className="text-center">
                        <h3 className="text-surface-900 dark:text-surface-100 text-lg font-semibold">
                            Failed to Load User
                        </h3>
                        <p className="text-surface-500 mt-1 text-sm">
                            {(error as Error)?.message || 'An unexpected error occurred'}
                        </p>
                    </div>
                    <Button color="secondary" variant="soft" onClick={() => refetch()}>
                        <ArrowsClockwiseIcon className="mr-2 size-4" />
                        Try Again
                    </Button>
                </DefaultCard>
            </div>
        );
    }

    return (
        <div className="flex w-full max-w-full flex-col gap-5">
            {/* Header with Back Button */}
            <div className="flex items-center justify-between gap-4">
                <Link href="/admin/users">
                    <Button className="gap-2" color="secondary" variant="soft">
                        <ArrowLeftIcon className="size-4" />
                        Back to Users
                    </Button>
                </Link>
            </div>

            {/* User Profile Header */}
            <UserProfileHeader user={user} />

            {/* Tabs for Details and Billing */}
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="billing">Billing & Credits</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <UserProfileDetails user={user} />
                </TabsContent>

                <TabsContent value="billing">
                    <UserBillingSection userId={userId} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
