/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import {
    addDays,
    differenceInMonths,
    endOfMonth,
    format,
    isAfter,
    isBefore,
    startOfDay,
    startOfMonth,
    startOfWeek,
} from 'date-fns';
import RevenueTrendsPatternIcon from '@app/(protected)/admin/dashboard/components/statistics/revenue-trends/partials/revenue-trends-pattern-icon';
import { generateDateRange, getDateRange } from '@library/time';
import type { ChartConfig } from '@/components/ui/chart';
import type { RevenueTrend, RevenueTrendType } from '@actions/admin/analytics/statistics/get-revenue-trends';

/**
 * Type definition for chart data entries.
 */
export type RevenueTrendsChartDataType = {
    date: Date; // Using Date object for easier manipulation
    label: string;
} & Partial<Record<RevenueTrendType, number>>;

/**
 * Prepares the chart data by aggregating revenue trends based on the selected filter.
 *
 * @param data - The fetched revenue trends data.
 * @param selectedFilter - The selected time filter.
 * @returns An array of chart data points.
 */
export const prepareRevenueTrendsChartData = (
    data: RevenueTrend[] | undefined,
    selectedFilter: string,
): RevenueTrendsChartDataType[] => {
    if (!data || data.length === 0) return [];

    const now = new Date();
    let displayStartDate: Date;
    let displayEndDate: Date;
    let interval: 'day' | 'week' | 'month' = 'month'; // Default interval.

    switch (selectedFilter) {
        case 'last_7_days': {
            const { endDate, startDate } = getDateRange('last_7_days', now);
            displayStartDate = startDate!;
            displayEndDate = endDate!;
            interval = 'day';
            break;
        }
        case 'last_month': {
            const { endDate, startDate } = getDateRange('last_month', now);
            displayStartDate = startDate!;
            displayEndDate = endDate!;
            interval = 'day'; // Change to 'week' if weekly aggregation is preferred.
            break;
        }
        case 'last_3_months': {
            const { endDate, startDate } = getDateRange('last_3_months', now);
            displayStartDate = startDate!;
            displayEndDate = endDate!;
            interval = 'week';
            break;
        }
        case 'last_6_months': {
            const { endDate, startDate } = getDateRange('last_6_months', now);
            displayStartDate = startDate!;
            displayEndDate = endDate!;
            interval = 'month';
            break;
        }
        case 'all': {
            const transactionDates = data.map((item) => new Date(item.time));
            const earliestDate = startOfMonth(
                new Date(Math.min(...transactionDates.map((d) => d.getTime()))),
            );
            displayStartDate = earliestDate;
            displayEndDate = endOfMonth(now);
            interval = determineInterval(differenceInMonths(displayEndDate, earliestDate) + 1);
            break;
        }
        default: {
            // Default to last 12 months if no valid filter is selected:
            const defaultRange = getDateRange('last_6_months', now);
            displayStartDate = defaultRange.startDate!;
            displayEndDate = defaultRange.endDate!;
            interval = 'month';
            break;
        }
    }

    // Generate the date range based on the determined interval:
    const dates: Date[] = generateDateRange(displayStartDate, displayEndDate, interval);

    // Initialize chart data with all intervals and zeroed transaction types
    const initializedData: RevenueTrendsChartDataType[] = dates.map((date) => ({
        date: date,
        label:
            interval === 'day'
                ? format(date, 'dd MMM')
                : interval === 'week'
                  ? `${format(date, 'dd MMM')} - ${format(addDays(date, 6), 'dd MMM')}` // Display date range for the week
                  : format(date, 'MMM yyyy'),
        charge: 0,
        payment: 0,
        refund: 0,
        adjustment: 0,
        payout: 0,
        topup: 0,
        stripe_fee: 0,
    }));

    // Aggregate actual data into the initialized data
    data.forEach((item) => {
        const date = new Date(item.time);

        if (isBefore(date, displayStartDate) || isAfter(date, displayEndDate)) return;

        let keyDate: Date;
        if (interval === 'day') {
            keyDate = startOfDay(date);
        } else if (interval === 'week') {
            // Align to the start of the week
            keyDate = startOfWeek(date, { weekStartsOn: 0 });
        } else {
            keyDate = startOfMonth(date);
        }

        const chartEntry = initializedData.find((entry) => {
            return entry.date.getTime() === keyDate.getTime();
        });

        if (chartEntry && item.type && item.amount) {
            chartEntry[item.type] = (chartEntry[item.type] || 0) + item.amount;
        }
    });

    return initializedData;
};

/**
 * Determines the appropriate interval for the X-axis based on the total range in months.
 *
 * @param totalMonths - Total number of months in the data range
 * @returns 'day', 'week', or 'month'
 */
const determineInterval = (totalMonths: number): 'day' | 'week' | 'month' => {
    if (totalMonths <= 1) return 'day';
    if (totalMonths <= 6) return 'week';
    return 'month';
};

/**
 * Determines which revenue trend types have data and should be displayed on the chart.
 *
 * @param chartData - The prepared chart data.
 * @param transactionTypes - All possible transaction types.
 * @returns An array of visible transaction types.
 */
export const getVisibleRevenueTrendTypes = (
    chartData: RevenueTrendsChartDataType[],
    transactionTypes: RevenueTrendType[],
): RevenueTrendType[] => {
    const typesWithData = new Set<RevenueTrendType>();
    chartData.forEach((entry) => {
        transactionTypes.forEach((type) => {
            if (entry[type] && Math.abs(entry[type]) > 0) {
                typesWithData.add(type);
            }
        });
    });
    return transactionTypes.filter((type) => typesWithData.has(type));
};

/**
 * Prepares chart configuration based on revenue trends and color palette.
 *
 * @param visibleTransactionTypes - An array of revenue trend types that have data.
 * @returns A `ChartConfig` object mapping each type to its label and color.
 */
export const prepareRevenueTrendsChartConfig = (visibleTransactionTypes: RevenueTrendType[]): ChartConfig => {
    const config: ChartConfig = {
        charge: {
            label: 'Charge',
            color: 'var(--foreground)',
            icon: <RevenueTrendsPatternIcon color="var(--foreground)" type="charge" />,
        },
        payment: {
            label: 'Payment',
            color: 'var(--info)',
            icon: <RevenueTrendsPatternIcon color="var(--info)" type="payment" />,
        },
        refund: {
            label: 'Refund',
            color: 'var(--error)',
            icon: <RevenueTrendsPatternIcon color="var(--destructive)" type="refund" />,
        },
        adjustment: {
            label: 'Adjustment',
            color: 'var(--muted)',
            icon: <RevenueTrendsPatternIcon color="var(--muted)" type="adjustment" />,
        },
        payout: {
            label: 'Payout',
            color: 'var(--destructive)',
            icon: <RevenueTrendsPatternIcon color="var(--warning)" type="payout" />,
        },
        topup: {
            label: 'Top-up',
            color: 'var(--info)',
            icon: <RevenueTrendsPatternIcon color="var(--info)" type="topup" />,
        },
    };

    // Filter the config based on visible transaction types:
    const filteredConfig: ChartConfig = {};
    visibleTransactionTypes.forEach((type) => {
        filteredConfig[type] = config[type];
    });

    return filteredConfig;
};
