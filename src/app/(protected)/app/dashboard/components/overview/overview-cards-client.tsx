/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { ArrowCounterClockwiseIcon, CloudWarningIcon, HouseSimpleIcon } from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import { titleCase } from 'title-case';
import { DefaultCard } from '@/components/ui/card';
import { SectionTitle } from '@/src/app/(protected)/app/components/common';
import { Button } from '@/src/components/ui/button';
import OverviewCardsSuspense from '@app/(protected)/app/dashboard/components/overview/overview-cards-suspense';
import { useUserData } from '@hooks/queries/auth/use-user-data';
import { overviewInsightsQueryOptions } from '@queries/tanstack/analytics-query-options';
import {
    OverviewCard,
    getIcon,
} from 'src/app/(protected)/app/dashboard/components/overview/partials/overview-card';

export default function OverviewCardsClient() {
    const { data: userData } = useUserData();
    const { user } = userData ?? {};
    const userId = user?.id ?? '';

    const { data, error, isError, isLoading, refetch } = useQuery(overviewInsightsQueryOptions(userId));

    if (isLoading) {
        return <OverviewCardsSuspense />;
    }

    if (isError) {
        return (
            <div className="flex w-full max-w-full flex-col items-start justify-start gap-3">
                <SectionTitle icon={HouseSimpleIcon} title="Overview" />
                <DefaultCard className="flex w-full max-w-full flex-col items-center justify-center gap-0">
                    <div className="mb-5 flex w-full flex-col items-center justify-center gap-3">
                        <div className="bg-primary-100 dark:bg-primary-900 mb-3 flex size-16 items-center justify-center rounded-full">
                            <CloudWarningIcon
                                className="text-destructive-500 dark:text-destructive-400 size-8"
                                weight="duotone"
                            />
                        </div>
                        <h3 className="text-surface-900 text-center text-xl leading-tight font-bold tracking-tight md:text-2xl dark:text-white">
                            {titleCase(
                                error?.title ??
                                    error?.message.replace(/\.$/, '') ??
                                    'Failed to Load Overview',
                            )}
                        </h3>
                        <p className="text-surface-600 dark:text-surface-400 text-center text-sm font-medium md:text-base">
                            {error?.description ??
                                'We could not load the overview statistics, please try again.'}
                        </p>
                    </div>
                    <div className="mb-5 flex w-auto flex-col items-center justify-center gap-5">
                        <Button
                            className="w-full"
                            color="primary"
                            shape="rounded"
                            size="lg"
                            type="button"
                            variant="soft"
                            onClick={() => {
                                refetch().then((r) => r);
                            }}
                        >
                            <ArrowCounterClockwiseIcon
                                className="size-5"
                                color="currentColor"
                                weight="duotone"
                            />
                            <span>Try Again</span>
                        </Button>
                    </div>
                </DefaultCard>
            </div>
        );
    }

    return (
        data &&
        data.length > 0 && (
            <div className="flex w-full max-w-full flex-col items-start justify-start gap-3">
                <SectionTitle icon={HouseSimpleIcon} title="Overview" />
                <div className="relative flex h-auto w-full max-w-full flex-row items-center justify-start gap-4">
                    <div className="grid w-full grid-flow-row-dense grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {data.map((card, index) => (
                            <OverviewCard
                                key={card.id}
                                data={card.data}
                                icon={getIcon(card.id)}
                                id={card.id}
                                index={index}
                                label={card.label}
                                trend={card.trend}
                                trendLabel={card.trendLabel}
                                value={card.value?.toString() ?? 'N/A'}
                            />
                        ))}
                    </div>
                </div>
            </div>
        )
    );
}
