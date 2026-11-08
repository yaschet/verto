/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import {
    ArrowDownIcon,
    ArrowUpIcon,
    EmptyIcon,
    MinusIcon,
    SigmaIcon,
    StripeLogoIcon,
    UsersIcon,
} from '@phosphor-icons/react';
import React from 'react';
import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts';
import { DefaultCard } from '@components/ui/card';
import { cn } from '@library/utils';
import type { Icon } from '@phosphor-icons/react';

export type CardType = {
    id: string;
    value: string;
    label: string;
    icon: Icon;
    index?: number;
    trend?: number;
    trendLabel?: string;
    data?: { value: number }[];
} & React.HTMLAttributes<HTMLDivElement>;

export const getAdminOverviewIcon = (id: string): Icon => {
    switch (id) {
        case 'total-users':
            return UsersIcon;
        case 'total-translations':
            return SigmaIcon;
        case 'stripe-balance':
            return StripeLogoIcon;
        default:
            return EmptyIcon;
    }
};

// Mock data for the sparkline chart - in a real app this would come from the API
const generateSparklineData = (trend: number) => {
    const data = [];
    let value = 50;
    for (let i = 0; i < 10; i++) {
        // Generate random trend based on the overall trend direction
        const randomChange = Math.random() * 20 - 10;
        const trendBias = trend > 0 ? 10 : trend < 0 ? -10 : 0;
        value = Math.max(10, Math.min(90, value + randomChange + trendBias));
        data.push({ value });
    }
    return data;
};

export function InsightCard(props: CardType) {
    const IconComponent: Icon = props.icon;
    const isFirstCard = props.index === 0;

    const chartData = React.useMemo(() => {
        if (props.data && props.data.length > 0) {
            return props.data;
        }
        return generateSparklineData(props.trend || 0);
    }, [props.trend, props.data]);

    // Determine chart colors based on card type/trend
    const getChartColors = () => {
        if (isFirstCard) {
            return {
                stroke: 'var(--background)',
                fill: 'var(--background)',
            };
        }
        // Use semantic colors for others based on ID or just a default
        switch (props.id) {
            case 'total-users':
                // Using --accent (blue)
                return { stroke: 'var(--accent)', fill: 'var(--accent)' };
            case 'total-translations':
                // Using --secondary (purple)
                return { stroke: 'var(--secondary)', fill: 'var(--secondary)' };
            case 'stripe-balance':
                // Using --primary (zinc)
                return { stroke: 'var(--primary)', fill: 'var(--primary)' };
            default:
                // Using --primary (zinc)
                return { stroke: 'var(--primary)', fill: 'var(--primary)' };
        }
    };

    const colors = getChartColors();

    return (
        <DefaultCard
            className={cn(
                'relative flex flex-col gap-1 overflow-hidden transition-all duration-200',
                isFirstCard
                    ? 'bg-black text-white dark:bg-white dark:text-black'
                    : 'bg-card text-card-foreground',
            )}
        >
            {/* Reflection Object */}
            {isFirstCard && (
                <div className="pointer-events-none absolute -top-[20%] right-[2.5%] h-[140%] w-[30%] -rotate-20 bg-white/8 dark:bg-black/3" />
            )}

            {/* Background Chart */}
            <div className="pointer-events-none absolute inset-x-0 -right-3 bottom-3 -left-3 h-10 w-[calc(100%+24px)] opacity-20">
                <ResponsiveContainer height="100%" width="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id={`gradient-${props.id}`} x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0%" stopColor={colors.fill} stopOpacity={0.6} />
                                <stop offset="100%" stopColor={colors.fill} stopOpacity={0.05} />
                            </linearGradient>
                        </defs>
                        <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                        <Area
                            dataKey="value"
                            fill={`url(#gradient-${props.id})`}
                            isAnimationActive={false}
                            stroke="none"
                            type="monotone"
                        />
                        <Area
                            dataKey="value"
                            fill="none"
                            isAnimationActive={false}
                            stroke={colors.stroke}
                            strokeWidth={3}
                            type="monotone"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="relative z-10 flex w-full flex-row items-start justify-between">
                <p
                    className={cn(
                        'text-sm font-medium',
                        isFirstCard ? 'text-neutral-400 dark:text-neutral-500' : 'text-muted-foreground',
                    )}
                >
                    {props.label}
                </p>
                <div
                    className={cn(
                        'flex size-10 items-center justify-center rounded-full',
                        isFirstCard
                            ? 'bg-white text-black dark:bg-black dark:text-white'
                            : 'bg-accent-100 text-accent-500 dark:bg-accent-900 dark:text-accent-300',
                        !isFirstCard &&
                            props.id === 'total-users' &&
                            'bg-accent-100 text-accent-600 dark:bg-accent-900/50 dark:text-accent-400',
                        !isFirstCard &&
                            props.id === 'total-translations' &&
                            'bg-secondary-100 text-secondary-600 dark:bg-secondary-900/50 dark:text-secondary-400',
                        !isFirstCard &&
                            props.id === 'stripe-balance' &&
                            'bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400',
                    )}
                >
                    <IconComponent
                        className="size-5"
                        color="currentColor"
                        weight={isFirstCard ? 'fill' : 'duotone'}
                    />
                </div>
            </div>
            <div className="relative z-10 flex w-full flex-col items-start justify-start gap-1 pb-10">
                <h1
                    className={cn(
                        'text-3xl font-bold lining-nums',
                        isFirstCard ? 'text-white dark:text-black' : 'text-foreground',
                    )}
                >
                    {props.value}
                </h1>
                {props.trend !== undefined && (
                    <div className="flex flex-row items-center justify-start gap-1">
                        {props.trend > 0 ? (
                            <ArrowUpIcon className="size-3 text-emerald-500" weight="duotone" />
                        ) : props.trend < 0 ? (
                            <ArrowDownIcon className="size-3 text-red-500" weight="duotone" />
                        ) : (
                            <MinusIcon className="text-muted-foreground size-3" weight="duotone" />
                        )}
                        <span
                            className={cn(
                                'text-xs font-medium',
                                props.trend > 0
                                    ? 'text-emerald-500'
                                    : props.trend < 0
                                      ? 'text-red-500'
                                      : 'text-muted-foreground',
                            )}
                        >
                            {Math.abs(props.trend).toFixed(1)}%
                        </span>
                        <span
                            className={cn(
                                'text-xs',
                                isFirstCard
                                    ? 'text-neutral-500 dark:text-neutral-500'
                                    : 'text-muted-foreground',
                            )}
                        >
                            {props.trendLabel ?? 'from last week'}
                        </span>
                    </div>
                )}
            </div>
        </DefaultCard>
    );
}
