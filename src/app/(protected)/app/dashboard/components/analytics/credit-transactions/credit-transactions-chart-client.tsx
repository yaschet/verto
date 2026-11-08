/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import type { ApiErrorType } from '@/types/rest/errors';
import { CaretUpDownIcon, EmptyIcon, ShieldWarningIcon, ShoppingCartIcon } from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import useWindowSize from 'react-use/lib/useWindowSize';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { titleCase } from 'title-case';
import CreditTransactionsChartSuspense from '@app/(protected)/app/dashboard/components/analytics/credit-transactions/credit-transactions-chart-suspense';
import {
    getVisibleTransactionTypes,
    prepareChartConfig,
    prepareChartData,
} from '@app/(protected)/app/dashboard/components/analytics/credit-transactions/credit-transactions-chart-utils';
import CreditTransactionsPatternIcon from '@app/(protected)/app/dashboard/components/analytics/credit-transactions/partials/credit-transactions-pattern-icon';
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
import { analyticsCreditTransactionsQueryOptions } from '@queries/tanstack/analytics-query-options';
import type { CreditsTransactionType } from '@/types/core/billing';
import type { ChartDataType } from '@app/(protected)/app/dashboard/components/analytics/credit-transactions/credit-transactions-chart-utils';
import type { ChartConfig } from '@components/ui/chart';

export default function CreditTransactionsChartClient() {
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

    const { width } = useWindowSize();

    // Fetch credit transactions data using React Query:
    const { data, error, isError, isLoading } = useQuery(
        analyticsCreditTransactionsQueryOptions(userId, {
            startDate,
            endDate,
        }),
    );

    // Prepare chart data using the utility function:
    const chartData: ChartDataType[] = useMemo(() => {
        return prepareChartData(data, selectedFilter);
    }, [data, selectedFilter]);

    // Define all possible transaction types in the desired order:
    const transactionTypes: CreditsTransactionType[] = useMemo(
        () => ['penalty', 'bonus', 'refund', 'purchase', 'consumption'],
        [],
    );

    // Determine which transaction types are visible based on the chart data:
    const visibleTransactionTypes: CreditsTransactionType[] = useMemo(() => {
        return getVisibleTransactionTypes(chartData, transactionTypes);
    }, [chartData, transactionTypes]);

    // Prepare chart configuration using the utility function
    const chartConfig: ChartConfig = useMemo(() => {
        return prepareChartConfig(visibleTransactionTypes);
    }, [visibleTransactionTypes]);

    // Handle loading state:
    if (isLoading) {
        return <CreditTransactionsChartSuspense />;
    }

    // Handle error state:
    if (isError) {
        return (
            <Card className="flex h-full flex-col">
                <CardHeader>
                    <CardTitle>Credit Transaction History</CardTitle>
                    <CardDescription>Failed to load credit transactions.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col items-center justify-center py-12">
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
                        <p className="text-surface-600 dark:text-surface-400 text-center text-sm font-medium md:text-base">
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
            <Card className="flex h-full flex-col">
                <CardHeader className="flex flex-col items-start justify-between sm:flex-row">
                    <div className="flex flex-col items-start justify-start gap-1">
                        <CardTitle
                            style={{
                                maxWidth: 'calc(100% - 1.5rem)',
                            }}
                        >
                            Credit Transaction History
                        </CardTitle>
                        <CardDescription
                            className="text-sm"
                            style={{
                                maxWidth: 'calc(100% - 1.5rem)',
                            }}
                        >
                            No transaction data available yet.
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
                            No Transactions Found
                        </h1>
                        <p className="text-muted text-center text-sm">
                            It looks like you haven’t made any transactions yet.
                        </p>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                        <Button
                            asChild
                            className="flex items-center justify-center font-bold"
                            color="primary"
                            shape="pill"
                            size="lg"
                            variant="solid"
                        >
                            <Link href="/account/credits/top-up">
                                <ShoppingCartIcon className="size-5" color="currentColor" weight="duotone" />
                                <span>Top Up Credits</span>
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Calculate tick interval based on window width
    const maxTicks = Math.floor(width / 100) || 1;
    Math.ceil(chartData.length / maxTicks);

    return (
        <Card className="flex h-full flex-col">
            <CardHeader className="flex flex-col items-start justify-between sm:flex-row">
                <div className="flex flex-col items-start justify-start gap-1">
                    <CardTitle
                        style={{
                            maxWidth: 'calc(100% - 1.5rem)',
                        }}
                    >
                        Credit Transaction History
                    </CardTitle>
                    <CardDescription
                        className="text-sm"
                        style={{
                            maxWidth: 'calc(100% - 1.5rem)',
                        }}
                    >
                        An overview of your credit transactions, including usage, purchases, bonuses, and more
                        over the selected period.
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
                <ChartContainer className="aspect-auto h-96 w-full" config={chartConfig}>
                    <AreaChart
                        data={chartData}
                        margin={{
                            top: 20,
                            right: 10,
                            left: 10,
                            bottom: 0,
                        }}
                        stackOffset="none"
                    >
                        {/* Define gradients and patterns for each visible transaction type */}
                        <defs>
                            {visibleTransactionTypes.map((type) => {
                                if (chartConfig[type].patternId) {
                                    // Define patterns for refund and bonus:
                                    if (type === 'refund') {
                                        return (
                                            <pattern
                                                key={type}
                                                height="6"
                                                id={chartConfig[type].patternId}
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
                                    } else if (type === 'bonus') {
                                        return (
                                            <pattern
                                                key={type}
                                                height="4"
                                                id={chartConfig[type].patternId}
                                                patternUnits="userSpaceOnUse"
                                                width="4"
                                            >
                                                <circle cx="2" cy="2" fill={chartConfig[type].color} r="1" />
                                            </pattern>
                                        );
                                    }

                                    return null;
                                } else {
                                    // Define linear gradient for other types:
                                    return (
                                        <linearGradient
                                            key={type}
                                            id={`color_${type}`}
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
                                        const config = chartConfig[name as CreditsTransactionType];
                                        if (!config) return null;

                                        const { color, label } = config;

                                        return (
                                            <div className="text-surface-900 dark:text-surface-100 relative flex w-full flex-wrap items-center justify-between gap-3 font-medium">
                                                <div className="text-surface-900 dark:text-surface-100 flex items-center gap-1 font-medium">
                                                    <CreditTransactionsPatternIcon
                                                        color={color ?? 'var(--foreground)'}
                                                        strokeDasharray={config.strokeDasharray}
                                                        type={name as CreditsTransactionType}
                                                    />
                                                    <p className="flex h-4 max-w-full items-center truncate">
                                                        {label || name}
                                                    </p>
                                                </div>
                                                <div className="text-foreground flex items-center gap-0.5 font-mono font-medium tabular-nums">
                                                    <span>{value}</span>
                                                    <span className="text-muted-foreground flex items-center text-[0.6rem] font-normal">
                                                        VTC
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
                        {visibleTransactionTypes.map((type) => (
                            <Area
                                key={type}
                                activeDot={{ r: 4 }}
                                dataKey={type}
                                dot={false}
                                fill={
                                    chartConfig[type].patternId
                                        ? `url(#${chartConfig[type].patternId})`
                                        : `url(#color_${type})`
                                }
                                fillOpacity={1}
                                stackId="credit-transactions"
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
