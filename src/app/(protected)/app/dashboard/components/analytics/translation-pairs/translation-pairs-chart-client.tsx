/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import {
    CaretUpDownIcon,
    EmptyIcon,
    SelectionAllIcon,
    ShieldWarningIcon,
    TranslateIcon,
} from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis } from 'recharts';
import { titleCase } from 'title-case';
import { type ChartConfig, ChartContainer } from '@/components/ui/chart';
import TranslationPairsChartSuspense from '@app/(protected)/app/dashboard/components/analytics/translation-pairs/translation-pairs-chart-suspense';
import {
    prepareChartConfig,
    prepareChartData,
} from '@app/(protected)/app/dashboard/components/analytics/translation-pairs/translation-pairs-utils';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@components/ui/dropdown-menu';
import { useUserData } from '@hooks/queries/auth/use-user-data';
import { getDateRange } from '@library/time';
import { analyticsTranslationPairsQueryOptions } from '@queries/tanstack/analytics-query-options';
import type {
    ChartDataType,
    FilterOption,
} from '@app/(protected)/app/dashboard/components/analytics/translation-pairs/translation-pairs-utils';

export default function TranslationPairsChartClient() {
    // Retrieve the authenticated user's ID from the auth store:
    const { data: userData } = useUserData();
    const { user } = userData ?? {};
    const userId = user?.id ?? '';

    // Define filter options:
    const filterOptions: FilterOption[] = [
        { label: 'Last 7 Days', value: 'last_7_days' },
        { label: 'Last Month', value: 'last_month' },
        { label: 'Last 3 Months', value: 'last_3_months' },
        { label: 'Last 6 Months', value: 'last_6_months' },
        { label: 'All', value: 'all' },
    ];

    // Initialize `selectedFilter` to a valid option:
    const [selectedFilter, setSelectedFilter] = useState<string>('last_7_days');

    // Compute the startDate and endDate based on the selected filter:
    const now = useMemo(() => new Date(), []);
    const { endDate, startDate } = getDateRange(selectedFilter, now);

    // Fetch translation pairs data using React Query, passing startDate and endDate:
    const { data, error, isError, isLoading } = useQuery(
        analyticsTranslationPairsQueryOptions(userId, {
            startDate,
            endDate,
        }),
    );

    // Prepare chart data:
    const chartData: ChartDataType[] = useMemo(() => {
        return prepareChartData(data, selectedFilter, startDate, endDate, now);
    }, [data, selectedFilter, startDate, endDate, now]);

    // Get all unique translation pairs for the legend and bars:
    const allPairs = useMemo(() => {
        if (!data || data.length === 0) return [];
        return Array.from(new Set(data.map((item) => `${item.source_language}-${item.target_language}`)));
    }, [data]);

    // Define a color palette for the bars:
    // Use primary color for all bars to match the striped pattern design
    const colors = ['var(--primary)'];

    // Prepare chart configuration:
    const chartConfig: ChartConfig = useMemo(() => {
        return prepareChartConfig(allPairs, colors);
    }, [allPairs, colors]);

    // Handle loading state:
    if (isLoading) {
        return <TranslationPairsChartSuspense />;
    }

    // Handle error state:
    if (isError) {
        return (
            <Card className="flex h-full flex-col">
                <CardHeader className="flex flex-col items-start justify-between sm:flex-row">
                    <div className="flex flex-col items-start justify-start gap-1">
                        <CardTitle
                            style={{
                                maxWidth: 'calc(100% - 1.5rem)',
                            }}
                        >
                            Translation Pairs History
                        </CardTitle>
                        <CardDescription
                            className="text-sm"
                            style={{
                                maxWidth: 'calc(100% - 1.5rem)',
                            }}
                        >
                            Failed to load translation pairs history.
                        </CardDescription>
                    </div>
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
                </CardHeader>
                <CardContent className="flex flex-1 flex-col items-center justify-center py-12">
                    <div className="mb-5 flex size-full flex-col items-center justify-center gap-3">
                        <div className="bg-primary-100 dark:bg-primary-900 mb-3 flex items-center justify-center rounded-full p-4">
                            <ShieldWarningIcon
                                className="text-destructive-500 dark:text-destructive-400 size-8"
                                weight="duotone"
                            />
                        </div>
                        <h3 className="text-surface-900 text-center text-xl leading-tight font-bold tracking-tight md:text-2xl dark:text-white">
                            {titleCase((error as Error)?.message ?? 'Oops, something went wrong!')}
                        </h3>
                        <p className="text-surface-600 dark:text-surface-400 text-center text-sm font-medium md:text-base">
                            We're unable to load the data at the moment. Please try again.
                        </p>
                        <Button
                            className="flex items-center justify-center font-bold"
                            color="destructive"
                            shape="pill"
                            size="lg"
                            variant="solid"
                            onClick={() => window.location.reload()}
                        >
                            <TranslateIcon className="size-5" color="currentColor" weight="duotone" />
                            <span>Reload</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Handle no data case:
    if (data?.length === 0) {
        return (
            <Card className="flex h-full flex-col">
                <CardHeader className="flex flex-col items-start justify-between sm:flex-row">
                    <div className="flex flex-col items-start justify-start gap-1">
                        <CardTitle
                            style={{
                                maxWidth: 'calc(100% - 1.5rem)',
                            }}
                        >
                            Translation Pairs History
                        </CardTitle>
                        <CardDescription
                            className="text-sm"
                            style={{
                                maxWidth: 'calc(100% - 1.5rem)',
                            }}
                        >
                            An overview of your translation pairs over the selected period.
                        </CardDescription>
                    </div>
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
                </CardHeader>
                <CardContent className="flex flex-1 flex-col items-center justify-center py-12">
                    <div className="mb-5 flex flex-col items-center justify-center gap-3">
                        <div className="bg-primary-100 dark:bg-primary-900 mb-3 flex items-center justify-center rounded-full p-4">
                            <EmptyIcon
                                className="text-primary-500 dark:text-primary-400 size-8"
                                weight="duotone"
                            />
                        </div>
                        <h1 className="text-surface-900 dark:text-surface-100 text-2xl font-black tracking-tighter sm:text-2xl">
                            No Translation Data Found
                        </h1>
                        <p className="text-muted text-center text-sm">
                            {`It looks like you haven’t made any translations during${
                                selectedFilter === 'all' ? ' your entire history.' : ` the selected period.`
                            }`}
                        </p>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                        {/* Button to start translating */}
                        {selectedFilter === 'all' && (
                            <Button
                                asChild
                                className="flex items-center justify-center font-bold"
                                color="primary"
                                shape="pill"
                                size="lg"
                                variant="solid"
                            >
                                <Link href="/app/translations/new">
                                    <TranslateIcon className="size-5" color="currentColor" weight="duotone" />
                                    <span>Start Translating</span>
                                </Link>
                            </Button>
                        )}
                        {selectedFilter !== 'all' && (
                            <Button
                                className="flex items-center justify-center font-bold"
                                color="primary"
                                shape="pill"
                                size="lg"
                                variant="solid"
                                onClick={() => setSelectedFilter('all')}
                            >
                                <SelectionAllIcon className="size-5" color="currentColor" weight="duotone" />
                                <span>View All Time</span>
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="flex h-full flex-col">
            <CardHeader className="flex flex-col items-start justify-between sm:flex-row">
                <div className="flex flex-col items-start justify-start gap-1">
                    <CardTitle
                        style={{
                            maxWidth: 'calc(100% - 1.5rem)',
                        }}
                    >
                        Translation Pairs History
                    </CardTitle>
                    <CardDescription
                        className="text-sm"
                        style={{
                            maxWidth: 'calc(100% - 1.5rem)',
                        }}
                    >
                        An overview of your translation pairs over the selected period.
                    </CardDescription>
                </div>
                <div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild={true}>
                            <Button color="default" size="md" variant="soft">
                                <span>
                                    {filterOptions.find((option) => option.value === selectedFilter)?.label ||
                                        'Select Range'}
                                </span>
                                <CaretUpDownIcon
                                    className="size-4 opacity-50"
                                    color="currentColor"
                                    weight="duotone"
                                />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuRadioGroup value={selectedFilter} onValueChange={setSelectedFilter}>
                                {filterOptions.map((option) => (
                                    <DropdownMenuRadioItem key={option.value} value={option.value}>
                                        {option.label}
                                    </DropdownMenuRadioItem>
                                ))}
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>

            <CardContent className="flex flex-1 flex-col items-center justify-center py-12">
                <style>
                    {`
                        :root {
                            --stripe-color-1: var(--surface-950);
                            --stripe-color-2: var(--surface-800);
                        }
                        .dark,
                        [data-theme="dark"] {
                            --stripe-color-1: var(--surface-50);
                            --stripe-color-2: var(--surface-200);
                        }
                    `}
                </style>
                <ChartContainer className="aspect-auto h-96 w-full" config={chartConfig}>
                    <BarChart
                        accessibilityLayer
                        data={chartData}
                        margin={{
                            top: 20,
                            right: 10,
                            left: 10,
                            bottom: 0,
                        }}
                    >
                        <defs>
                            <pattern
                                height="16"
                                id="translation-pairs-stripe"
                                patternTransform="rotate(-45)"
                                patternUnits="userSpaceOnUse"
                                width="16"
                            >
                                <rect fill="var(--stripe-color-1)" height="16" width="8" />
                                <rect fill="var(--stripe-color-2)" height="16" width="8" x="8" />
                            </pattern>
                            <pattern
                                height="16"
                                id="translation-pairs-stripe-hover"
                                patternTransform="rotate(-45)"
                                patternUnits="userSpaceOnUse"
                                width="16"
                            >
                                <rect fill="var(--accent-600)" height="16" width="8" />
                                <rect fill="var(--accent-500)" height="16" width="8" x="8" />
                            </pattern>
                        </defs>

                        {/* Add grid */}
                        <CartesianGrid
                            stroke="var(--muted)"
                            strokeDasharray="4 4"
                            strokeOpacity={0.1}
                            strokeWidth={1}
                            vertical={false}
                        />

                        {/* Configure X-Axis */}
                        <XAxis axisLine={false} dataKey="date" tickLine={false} tickMargin={10} />

                        {/* Add Tooltip */}
                        <Tooltip
                            content={({ active, payload }) => {
                                if (!active || !payload || payload.length === 0) return null;

                                const data = payload[0].payload;
                                const activePairs = allPairs
                                    .filter((key) => (data[key] as number) > 0)
                                    .sort((a, b) => (data[b] as number) - (data[a] as number));

                                return (
                                    <div className="border-border/50 bg-background shadow-large min-w-32 rounded-md border p-3 text-xs">
                                        <div className="border-border/50 mb-2 border-b pb-2">
                                            <div className="text-foreground font-medium">{data.date}</div>
                                            <div className="text-muted-foreground">Total: {data.total}</div>
                                        </div>
                                        <div className="grid gap-1.5">
                                            {activePairs.map((key) => {
                                                const config = chartConfig[key];
                                                return (
                                                    <div
                                                        key={key}
                                                        className="flex items-center justify-between gap-2"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className="h-2 w-2 rounded-full"
                                                                style={{ backgroundColor: config?.color }}
                                                            />
                                                            <span className="text-muted-foreground">
                                                                {config?.label || key}
                                                            </span>
                                                        </div>
                                                        <span className="text-foreground font-medium tabular-nums">
                                                            {data[key]}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            }}
                            cursor={{ fill: 'var(--muted)', opacity: 0.1 }}
                        />

                        {/* Single Bar for Total */}
                        <Bar
                            activeBar={{
                                fill: 'url(#translation-pairs-stripe-hover)',
                            }}
                            dataKey="total"
                            fill="url(#translation-pairs-stripe)"
                            radius={[12, 12, 12, 12]}
                        />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
