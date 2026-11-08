/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import type { ApiErrorType } from '@/types/rest/errors';
import {
    ArrowsCounterClockwiseIcon,
    CaretUpDownIcon,
    ChartLineDownIcon,
    ChartLineUpIcon,
    EmptyIcon,
    FunnelSimpleIcon,
    SelectionAllIcon,
    ShieldWarningIcon,
} from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import { Fragment, useMemo, useState } from 'react';
import { Label, PolarGrid, PolarRadiusAxis, RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts';
import { titleCase } from 'title-case';
import NewSignUpsChartSuspense from '@app/(protected)/admin/dashboard/components/metrics/new-sign-ups/new-sign-ups-chart-suspense';
import { useUserData } from '@hooks/queries/auth/use-user-data';
import { getDateRange } from '@library/time';
import { newSignUpsAnalyticsQueryOptions } from '@queries/tanstack/admin/metrics-query-options';
import { Button } from '@ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@ui/chart';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@ui/dropdown-menu';
import type { AdminFilterOption } from '@app/(protected)/admin/dashboard/components/statistics/translation-pairs/translation-pairs-utils';
import type { ChartConfig } from '@ui/chart';

export function NewSignUpsChartClient() {
    // Retrieve the authenticated user's ID from the auth store:
    const { data: userData } = useUserData();
    const { user } = userData ?? {};
    const userId = user?.id;

    // Define filter options:
    const filterOptions: AdminFilterOption[] = [
        {
            label: 'Last 7 Days',
            value: 'last_7_days',
            description: 'A detailed overview of new user sign-ups over the past 7 days.',
        },
        {
            label: 'Last Month',
            value: 'last_month',
            description: 'A comprehensive summary of new user sign-ups over the past month.',
        },
        {
            label: 'Last 3 Months',
            value: 'last_3_months',
            description: 'An extensive report of new user sign-ups over the past 3 months.',
        },
        {
            label: 'Last 6 Months',
            value: 'last_6_months',
            description: 'A thorough analysis of new user sign-ups over the past 6 months.',
        },
        {
            label: 'All',
            value: 'all',
            description: 'A complete history of new user sign-ups since the inception of the software.',
        },
    ];

    // Initialize `selectedFilter` to a valid option:
    const [selectedFilter, setSelectedFilter] = useState<string>('last_6_months');

    // Compute the startDate and endDate based on the selected filter:
    const now = new Date();

    const { endDate, startDate } = getDateRange(selectedFilter, now);

    // Fetch new sign-ups data using React Query, passing selectedFilter, startDate and endDate
    const { data, error, isError, isFetching, isLoading, isPending, isRefetching, refetch } = useQuery(
        newSignUpsAnalyticsQueryOptions(userId, {
            selectedFilter,
            startDate,
            endDate,
        }),
    );

    // Define the chart configuration:
    const chartConfig = {
        signUps: {
            label: 'Sign Ups',
            color: 'var(--primary)',
        },
    } satisfies ChartConfig;

    // Calculate total sign-ups and total users
    const totalSignUps = data?.totalSignUps ?? 0;
    const totalUsers = data?.totalUsers ?? 0;

    // Calculate the proportion
    const proportion = totalUsers > 0 ? (totalSignUps / totalUsers) * 100 : 0;

    // Define the chart data with a single data point
    const chartData = [
        {
            label: 'New Sign Ups',
            signUps: data?.totalUsers ?? 0,
            fill: 'var(--primary)',
        },
    ];

    // Define the label to display in the center
    const label = 'New Sign Ups';

    // Destructure trend data from the server response
    const { trend, trendDescription, trendPercentage } = data || {
        trend: 'up',
        trendPercentage: 0,
        trendDescription: '',
    };

    // Determine the endAngle based on proportion
    const endAngle = useMemo(() => {
        if (proportion >= 100) {
            return 360;
        }

        return (proportion / 100) * 360;
    }, [proportion]);

    // Handle loading state:
    if (isLoading) {
        return <NewSignUpsChartSuspense />;
    }

    // Handle error state:
    if (isError) {
        return (
            <Card className="flex h-full w-full flex-col">
                <CardHeader>
                    <CardTitle>New User Sign-Ups</CardTitle>
                    <CardDescription className="text-sm">
                        {filterOptions.find((option) => option.value === selectedFilter)?.description ??
                            'A comprehensive summary of new user sign-ups over the selected range.'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex w-full flex-col items-center justify-center py-12">
                    <div className="mb-5 flex w-full flex-col items-center justify-center gap-3">
                        <div className="bg-primary-100 dark:bg-primary-900 mb-3 flex items-center justify-center rounded-full p-4">
                            <ShieldWarningIcon
                                className="text-destructive-500 dark:text-destructive-400 size-8"
                                weight="duotone"
                            />
                        </div>
                        <h3 className="text-surface-900 text-center text-xl leading-tight font-bold tracking-tight md:text-2xl dark:text-white">
                            {titleCase(
                                (error as Error & Partial<ApiErrorType>)?.title ||
                                    (error as Error & Partial<ApiErrorType>)?.message?.replace(/\.$/, '') ||
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
    if (!data) {
        return (
            <Card className="flex h-full w-full flex-col">
                <CardHeader className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                    <div className="flex flex-1 flex-col items-start justify-start gap-1">
                        <CardTitle>New User Sign-Ups</CardTitle>
                        <CardDescription className="text-sm">
                            {filterOptions.find((option) => option.value === selectedFilter)?.description ??
                                'A comprehensive summary of new user sign-ups over the selected range.'}
                        </CardDescription>
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
                <CardContent className="flex w-full flex-col items-center justify-center py-12">
                    <div className="mb-5 flex flex-col items-center justify-center gap-3 text-center">
                        <div className="bg-primary-100 dark:bg-primary-900 mb-3 flex items-center justify-center rounded-full p-4">
                            <EmptyIcon
                                className="text-primary-500 dark:text-primary-400 size-8"
                                weight="duotone"
                            />
                        </div>
                        <h1 className="text-surface-900 dark:text-surface-100 text-2xl font-black tracking-tighter sm:text-2xl">
                            {selectedFilter === 'all'
                                ? 'No Credit Transactions Available'
                                : 'No Credit Transactions for Selected Period'}
                        </h1>
                        <p className="text-surface-600 dark:text-surface-500 max-w-sm text-center text-sm">
                            {selectedFilter === 'all'
                                ? "No credit transactions are available for the entire period. Users haven't made any purchases, received bonuses, requested refunds, or conducted other transactions."
                                : "No credit transactions are available for the selected period. Users haven't made any purchases, received bonuses, requested refunds, or conducted other transactions."}
                        </p>
                    </div>
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
                                <SelectionAllIcon className="size-5" color="currentColor" weight="duotone" />
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
                                        className="size-5"
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
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="flex h-full w-full flex-col">
            <CardHeader className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                <div className="flex flex-1 flex-col items-start justify-start gap-1">
                    <CardTitle>Sign Ups</CardTitle>
                    <CardDescription className="text-sm">
                        {filterOptions.find((option) => option.value === selectedFilter)?.description ||
                            'A comprehensive summary of new user sign-ups over the selected range.'}
                    </CardDescription>
                </div>
                <div className="flex flex-1 items-end justify-end">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild={true}>
                            <Button
                                color="default"
                                size="icon"
                                tooltipContent={
                                    filterOptions.find((option) => option.value === selectedFilter)?.label ||
                                    'Select a filter'
                                }
                                variant="soft"
                            >
                                <FunnelSimpleIcon className="size-5" color="currentColor" weight="duotone" />
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
            <CardContent
                asChild={true}
                className="mx-auto flex aspect-square h-[200px] max-h-[250px] w-full md:h-[220px] lg:h-[250px]"
            >
                <ChartContainer config={chartConfig}>
                    <ResponsiveContainer height="100%" width="100%">
                        <RadialBarChart
                            data={chartData}
                            endAngle={endAngle}
                            innerRadius={80}
                            outerRadius={140}
                            startAngle={0}
                        >
                            <PolarGrid
                                className="first:fill-surface-2 last:fill-background"
                                gridType="circle"
                                polarRadius={[86, 74]}
                                radialLines={false}
                                stroke="none"
                            />

                            <RadialBar background dataKey="signUps" />

                            <PolarRadiusAxis axisLine={false} tick={false} tickLine={false}>
                                <Label
                                    content={({ viewBox }) => {
                                        if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                                            return (
                                                <text
                                                    dominantBaseline="middle"
                                                    textAnchor="middle"
                                                    x={viewBox.cx}
                                                    y={viewBox.cy}
                                                >
                                                    <tspan
                                                        className="fill-foreground text-4xl font-bold"
                                                        x={viewBox.cx}
                                                        y={viewBox.cy}
                                                    >
                                                        {totalSignUps.toLocaleString()}
                                                    </tspan>
                                                    <tspan
                                                        className="fill-muted text-xs"
                                                        x={viewBox.cx}
                                                        y={(viewBox.cy || 0) + 24}
                                                    >
                                                        {label}
                                                    </tspan>
                                                </text>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                            </PolarRadiusAxis>
                            <ChartTooltip
                                content={
                                    <ChartTooltipContent
                                        hideLabel
                                        formatter={(value, name) => {
                                            const config = chartConfig[name as keyof typeof chartConfig];
                                            if (!config) return null;

                                            const { color, label: itemLabel } = config;

                                            return (
                                                <div className="text-surface-900 dark:text-surface-100 relative flex items-center justify-between gap-3 font-medium">
                                                    <div className="text-surface-900 dark:text-surface-100 flex items-center gap-2 font-medium">
                                                        <span
                                                            className="size-3 rounded"
                                                            style={{ backgroundColor: color }}
                                                        />
                                                        <p className="flex h-4 max-w-full items-center truncate">
                                                            {itemLabel}
                                                        </p>
                                                    </div>
                                                    <div className="text-foreground gap-0.5 font-mono font-medium tabular-nums">
                                                        <span>{value}</span>
                                                        <span className="text-muted text-[0.6rem] font-normal">
                                                            {' '}
                                                            (
                                                            {(
                                                                (parseInt(value?.toString() || '0') /
                                                                    totalUsers) *
                                                                100
                                                            ).toFixed(0)}
                                                            % of total users)
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        }}
                                        indicator="line"
                                    />
                                }
                                cursor={false}
                            />
                        </RadialBarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2 text-start leading-none font-bold">
                    <span>Trending {trend} by</span>
                    {trend === 'up' ? (
                        <span className="text-success font-bold">
                            {Math.abs(trendPercentage).toFixed(1)}%
                        </span>
                    ) : (
                        <span className="text-destructive font-bold">
                            {Math.abs(trendPercentage).toFixed(1)}%
                        </span>
                    )}
                    <span>this period</span>
                    {trend === 'up' ? (
                        <ChartLineUpIcon
                            className="text-success size-5"
                            color="currentColor"
                            weight="duotone"
                        />
                    ) : (
                        <ChartLineDownIcon
                            className="text-destructive size-5"
                            color="currentColor"
                            weight="duotone"
                        />
                    )}
                </div>
                <div className="text-muted text-xs leading-none">
                    {trendDescription ||
                        `The number of new sign-ups has ${trend === 'up' ? 'increased' : 'decreased'} since the previous period.`}
                </div>
            </CardFooter>
        </Card>
    );
}
