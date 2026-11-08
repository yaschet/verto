/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import {
    ArrowCounterClockwiseIcon,
    CardsThreeIcon,
    CaretUpDownIcon,
    CloudWarningIcon,
} from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { titleCase } from 'title-case';
import { DefaultCard } from '@/components/ui/card';
import { SectionTitle } from '@/src/app/(protected)/app/components/common';
import { Button } from '@/src/components/ui/button';
import InsightsCardsSuspense from '@app/(protected)/admin/dashboard/components/insights/insights-cards-suspense';
import {
    InsightCard,
    getAdminOverviewIcon,
} from '@app/(protected)/admin/dashboard/components/insights/partials/insight-card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@components/ui/dropdown-menu';
import { useUserData } from '@hooks/queries/auth/use-user-data';
import { getDateRange } from '@library/time';
import { insightsQueryOptions } from '@queries/tanstack/admin/insights-query-options';

export default function InsightsCardsClient() {
    const { data: userData } = useUserData();
    const { profile } = userData ?? {};
    const profileId = profile?.id;

    // Define filter options:
    const filterOptions = [
        {
            label: 'Last 7 Days',
            value: 'last_7_days',
            description: 'Insights of the last 7 days, including today.',
        },
        {
            label: 'Last Month',
            value: 'last_month',
            description: 'Insights of the last month, from the 1st to the last day of the month.',
        },
        {
            label: 'Last 3 Months',
            value: 'last_3_months',
            description: 'Insights of the last 3 months, including the current month.',
        },
        {
            label: 'Last 6 Months',
            value: 'last_6_months',
            description: 'Insights of the last 6 months, including the current month.',
        },
        {
            label: 'All',
            value: 'all',
            description: 'Insights of all time, from the beginning to the current date.',
        },
    ];

    // Initialize `selectedFilter` to a valid option:
    const [selectedFilter, setSelectedFilter] = useState<string>('last_6_months');

    // Compute the startDate and endDate based on the selected filter
    const now = new Date();
    const { endDate, startDate } = getDateRange(selectedFilter, now);

    const { data, error, isError, isLoading, refetch } = useQuery(
        insightsQueryOptions(profileId ?? undefined, {
            startDate,
            endDate,
        }),
    );

    if (isLoading) {
        return <InsightsCardsSuspense />;
    }

    if (isError || !data) {
        return (
            <div className="flex w-full max-w-full flex-col items-start justify-start gap-3">
                <SectionTitle
                    description={
                        filterOptions.find((option) => option.value === selectedFilter)?.description ??
                        'Insights of the last 6 months, including the current month.'
                    }
                    icon={CardsThreeIcon}
                    title="Insights"
                />
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
                                'We could not load the overview insights, please try again.'}
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
        data?.length > 0 && (
            <div className="flex w-full max-w-full flex-col items-start justify-start gap-3">
                <SectionTitle
                    description={
                        filterOptions.find((option) => option.value === selectedFilter)?.description ??
                        'Insights of the last 6 months, including the current month.'
                    }
                    icon={CardsThreeIcon}
                    title="Insights"
                >
                    <div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild={true}>
                                <Button color="default" size="md" variant="soft">
                                    <span>
                                        {filterOptions.find((option) => option.value === selectedFilter)
                                            ?.label || 'Select Range'}
                                    </span>
                                    <CaretUpDownIcon
                                        className="size-4 opacity-50"
                                        color="currentColor"
                                        weight="duotone"
                                    />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuRadioGroup
                                    value={selectedFilter}
                                    onValueChange={setSelectedFilter}
                                >
                                    {filterOptions.map((option) => (
                                        <DropdownMenuRadioItem key={option.value} value={option.value}>
                                            {option.label}
                                        </DropdownMenuRadioItem>
                                    ))}
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </SectionTitle>
                <div className="relative flex h-auto w-full max-w-full flex-row items-center justify-start gap-4">
                    <div className="grid w-full grid-flow-row-dense grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {data?.map((card, index) => (
                            <InsightCard
                                key={card.id}
                                data={card.data}
                                icon={getAdminOverviewIcon(card.id)}
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
