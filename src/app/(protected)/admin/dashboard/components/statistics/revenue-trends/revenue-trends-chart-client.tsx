/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import {
    ArrowsCounterClockwiseIcon,
    CaretUpDownIcon,
    EmptyIcon,
    SelectionAllIcon,
    ShieldWarningIcon,
} from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import { Fragment, useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { titleCase } from 'title-case';
import { formatAmount } from '@/constants/credits';
import RevenueTrendsPatternIcon from '@app/(protected)/admin/dashboard/components/statistics/revenue-trends/partials/revenue-trends-pattern-icon';
import RevenueTrendsChartSuspense from '@app/(protected)/admin/dashboard/components/statistics/revenue-trends/revenue-trends-chart-suspense';
import {
    getVisibleRevenueTrendTypes,
    prepareRevenueTrendsChartConfig,
    prepareRevenueTrendsChartData,
} from '@app/(protected)/admin/dashboard/components/statistics/revenue-trends/revenue-trends-chart-utils';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card';
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from '@components/ui/chart';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@components/ui/dropdown-menu';
import { useUserData } from '@hooks/queries/auth/use-user-data';
import { getDateRange } from '@library/time';
import { cn } from '@library/utils';
import { revenueTrendsQueryOptions } from '@queries/tanstack/admin/statistics-query-options';
import type { ApiErrorType } from '@/types/rest/errors';
import type { RevenueTrendType } from '@actions/admin/analytics/statistics/get-revenue-trends';
import type { RevenueTrendsChartDataType } from '@app/(protected)/admin/dashboard/components/statistics/revenue-trends/revenue-trends-chart-utils';
import type { ChartConfig } from '@components/ui/chart';

export default function RevenueTrendsChartClient() {
    // Retrieve the authenticated user's ID from the auth store
    const { data: userData } = useUserData();
    const { user } = userData ?? {};
    const userId = user?.id ?? '';

    // Define filter options
    const filterOptions = [
        { label: 'Last 7 Days', value: 'last_7_days' },
        { label: 'Last Month', value: 'last_month' },
        { label: 'Last 3 Months', value: 'last_3_months' },
        { label: 'Last 6 Months', value: 'last_6_months' },
        { label: 'All', value: 'all' },
    ];

    // Initialize `selectedFilter` to a valid option
    const [selectedFilter, setSelectedFilter] = useState<string>('last_6_months');

    // Compute the startDate and endDate based on the selected filter
    const now = new Date();
    const { endDate, startDate } = getDateRange(selectedFilter, now);

    // Fetch credit transactions data using React Query:
    const { data, error, isError, isFetching, isLoading, isPending, isRefetching, refetch } = useQuery(
        revenueTrendsQueryOptions(userId, {
            startDate,
            endDate,
        }),
    );

    // Prepare chart data using the utility function:
    const chartData: RevenueTrendsChartDataType[] = useMemo(() => {
        return prepareRevenueTrendsChartData(data, selectedFilter);
    }, [data, selectedFilter]);

    const revenueTrendTypes: RevenueTrendType[] = useMemo(() => {
        return [
            'adjustment',
            'charge',
            'payment',
            'refund',
            'payout',
            'topup',
            'stripe_fee',
        ] as RevenueTrendType[];
    }, []);

    // Determine which transaction types are visible based on the chart data:
    const visibleRevenueTrendTypes: RevenueTrendType[] = useMemo(() => {
        return getVisibleRevenueTrendTypes(chartData, revenueTrendTypes);
    }, [chartData, revenueTrendTypes]);

    // Prepare chart configuration using the utility function
    const chartConfig: ChartConfig = useMemo(() => {
        return prepareRevenueTrendsChartConfig(visibleRevenueTrendTypes);
    }, [visibleRevenueTrendTypes]);

    // Handle loading state:
    if (isLoading) {
        return <RevenueTrendsChartSuspense />;
    }

    // Handle error state:
    if (isError) {
        return (
            <Card className="flex h-full w-full flex-col">
                <CardHeader className="flex flex-col items-start justify-between sm:flex-row">
                    <CardTitle>Revenue Trends</CardTitle>
                    <CardDescription>Failed to load revenue trends.</CardDescription>
                </CardHeader>
                <CardContent className="flex size-full flex-col items-center justify-center py-12">
                    <div className="mb-5 flex w-full flex-col items-center justify-center gap-3">
                        <div className="bg-primary-100 dark:bg-primary-900 mb-3 flex items-center justify-center rounded-full p-4">
                            <ShieldWarningIcon
                                className="text-destructive-500 dark:text-destructive-400 size-8"
                                weight="duotone"
                            />
                        </div>
                        <h3 className="text-surface-900 text-center text-xl leading-tight font-bold tracking-tight md:text-2xl dark:text-white">
                            {titleCase(
                                (error as ApiErrorType)?.title ||
                                    (error as ApiErrorType)?.message?.replace(/\.$/, '') ||
                                    'Oops, something went wrong!',
                            )}
                        </h3>
                        <p className="text-surface-600 dark:text-surface-500 max-w-sm text-center text-sm">
                            {(error as Error & Partial<ApiErrorType>)?.description ||
                                "We're unable to load the data at the moment. Please try again."}
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Handle no data case:
    if (data?.length === 0) {
        return (
            <Card className="flex h-full w-full flex-col">
                <CardHeader className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                    <div className="flex flex-1 flex-col items-start justify-start gap-1">
                        <CardTitle>Revenue Trends</CardTitle>
                        <CardDescription className="text-sm">No revenue data available yet.</CardDescription>
                    </div>
                    <div className="flex flex-1 items-end justify-end">
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
                <CardContent className="flex size-full flex-col items-center justify-center py-12">
                    <div className="mb-5 flex flex-col items-center justify-center gap-3">
                        <div className="bg-primary-100 dark:bg-primary-900 mb-3 flex items-center justify-center rounded-full p-4">
                            <EmptyIcon
                                className="text-primary-500 dark:text-primary-400 size-8"
                                weight="duotone"
                            />
                        </div>
                        <h1 className="text-surface-900 dark:text-surface-100 text-2xl font-black tracking-tighter sm:text-2xl">
                            No Revenue Data
                        </h1>
                        <p className="text-muted text-center text-sm">
                            There is no revenue data available for the selected date range.
                        </p>
                        <div className="mt-3 flex flex-col items-center justify-center gap-2 md:flex-row md:gap-3">
                            {selectedFilter !== 'all' && (
                                <Button
                                    className="flex items-center justify-center font-bold"
                                    color="primary"
                                    shape="pill"
                                    size="lg"
                                    variant="solid"
                                    onClick={() => setSelectedFilter('all')}
                                >
                                    <SelectionAllIcon
                                        className="size-5"
                                        color="currentColor"
                                        weight="duotone"
                                    />
                                    <span>View All Time</span>
                                </Button>
                            )}
                            <Button
                                className="flex items-center justify-center"
                                color="primary"
                                disabled={isLoading || isFetching || isRefetching || isPending}
                                loading={isLoading || isFetching || isRefetching || isPending}
                                shape="pill"
                                size="lg"
                                variant="soft"
                                onClick={async () => {
                                    await refetch().then((r) => r);
                                }}
                            >
                                {!isLoading && !isFetching && !isRefetching && !isPending && (
                                    <Fragment>
                                        <ArrowsCounterClockwiseIcon
                                            className={cn('size-5')}
                                            color="currentColor"
                                            weight="duotone"
                                        />
                                        <span className="hidden font-bold md:block">Refresh</span>
                                    </Fragment>
                                )}
                                {(isLoading || isFetching || isRefetching || isPending) && (
                                    <span className="hidden font-bold md:block">Refreshing</span>
                                )}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="flex h-full w-full flex-col items-center justify-between">
            <CardHeader className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                <div className="flex flex-1 flex-col items-start justify-start gap-1">
                    <CardTitle>Revenue Trends</CardTitle>
                    <CardDescription className="text-sm">
                        View the revenue trends for the selected date range.
                    </CardDescription>
                </div>
                <div className="flex flex-1 items-end justify-end">
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

            <CardContent asChild={true} className="flex h-[400px] w-full md:h-[450px] lg:h-[500px]">
                <ChartContainer config={chartConfig}>
                    <AreaChart
                        data={chartData}
                        margin={{
                            top: 10,
                            right: 10,
                            left: 10,
                            bottom: 0,
                        }}
                        stackOffset="none"
                    >
                        {/* Define gradients and patterns for each visible transaction type */}
                        <defs>
                            {visibleRevenueTrendTypes.map((type: RevenueTrendType) => {
                                if (chartConfig[type].patternId) {
                                    // Define patterns for Striped and Dotted types.
                                    if (type === 'refund') {
                                        return (
                                            <pattern
                                                key={type}
                                                height="6"
                                                id={`revenue-trends-chart-${chartConfig[type].patternId}`}
                                                patternTransform="rotate(45)"
                                                patternUnits="userSpaceOnUse"
                                                width="6"
                                            >
                                                <line
                                                    stroke={chartConfig[type].color}
                                                    strokeWidth="1"
                                                    x1="0"
                                                    x2="0"
                                                    y1="0"
                                                    y2="6"
                                                />
                                            </pattern>
                                        );
                                    } else if (type === 'adjustment') {
                                        return (
                                            <pattern
                                                key={type}
                                                height="4"
                                                id={`revenue-trends-chart-${chartConfig[type].patternId}`}
                                                patternUnits="userSpaceOnUse"
                                                width="4"
                                            >
                                                <circle cx="2" cy="2" fill={chartConfig[type].color} r="1" />
                                            </pattern>
                                        );
                                    }
                                    return null;
                                } else {
                                    // Define linear gradient for other types
                                    return (
                                        <linearGradient
                                            key={type}
                                            id={`revenue-trends-color-${type}`}
                                            x1="0"
                                            x2="0"
                                            y1="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="5%"
                                                stopColor={chartConfig[type].color}
                                                stopOpacity={0.8}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor={chartConfig[type].color}
                                                stopOpacity={0.1}
                                            />
                                        </linearGradient>
                                    );
                                }
                            })}
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
                        <XAxis
                            allowDataOverflow={false}
                            allowDecimals={false}
                            allowDuplicatedCategory={false}
                            angle={0}
                            axisLine={false}
                            dataKey="label"
                            interval="preserveStartEnd"
                            tickFormatter={(value: string) => `${value}`}
                            tickLine={false}
                            tickMargin={8}
                            type="category"
                        />

                        {/* Add Tooltip */}
                        <ChartTooltip
                            content={
                                <ChartTooltipContent
                                    formatter={(value, name) => {
                                        const config = chartConfig[name as RevenueTrendType];
                                        if (!config) return null;

                                        const { color, label } = config;

                                        const formattedValue = formatAmount(Number(value ?? 0), 'USD');

                                        return (
                                            <div className="text-surface-900 dark:text-surface-100 relative flex w-full flex-wrap items-center justify-between gap-3 font-medium">
                                                <div className="text-surface-900 dark:text-surface-100 flex items-center gap-1 font-medium">
                                                    <RevenueTrendsPatternIcon
                                                        color={color ?? 'var(--foreground)'}
                                                        patternId={config.patternId}
                                                        strokeDasharray={config.strokeDasharray}
                                                        type={name as RevenueTrendType}
                                                    />
                                                    <p className="flex h-4 max-w-full items-center truncate">
                                                        {label || name}
                                                    </p>
                                                </div>
                                                <div className="text-foreground flex items-center gap-0.5 font-mono font-medium tabular-nums">
                                                    <span>{formattedValue}</span>
                                                    <span className="text-muted-foreground flex items-center text-[0.6rem] font-normal">
                                                        USD
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    }}
                                    indicator="line"
                                />
                            }
                        />

                        {/* Add Legend */}
                        <ChartLegend align="left" content={<ChartLegendContent />} verticalAlign="top" />

                        {/* Render Area for each visible transaction type */}
                        {visibleRevenueTrendTypes.map((type) => (
                            <Area
                                key={type}
                                connectNulls
                                activeDot={{ r: 4 }}
                                dataKey={type}
                                dot={false}
                                fill={
                                    chartConfig[type].patternId
                                        ? `url(#revenue-trends-chart-${chartConfig[type].patternId})`
                                        : `url(#revenue-trends-color-${type})`
                                }
                                fillOpacity={1}
                                stackId="revenue-trends-chart"
                                stroke={chartConfig[type].color}
                                strokeDasharray={chartConfig[type].strokeDasharray}
                                type="monotone"
                            />
                        ))}
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
