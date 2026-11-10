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
import CreditsBurnDownPatternIcon from '@app/(protected)/admin/dashboard/components/statistics/credit-transactions/partials/credits-burn-down-pattern-icon';
import { generateDateRange, getDateRange } from '@library/time';
import type { ChartConfig } from '@/components/ui/chart';
import type { CreditsTransactionType } from '@/types/core/billing';
import type { CreditTransaction } from '@actions/services/analytics/get-credit-transaction-history';

/**
 * Type definition for chart data entries.
 */
export type CreditsBurnDownChartDataType = {
    date: Date; // Using Date object for easier manipulation
    label: string;
} & Record<CreditsTransactionType, number>;

/**
 * Prepares the chart data by aggregating credit transactions based on the selected filter.
 *
 * @param data - The fetched credit transactions data.
 * @param selectedFilter - The selected time filter.
 * @returns An array of chart data points.
 */
export const prepareCreditsBurnDownChartData = (
    data: CreditTransaction[] | undefined,
    selectedFilter: string,
): CreditsBurnDownChartDataType[] => {
    if (!data || data.length === 0) return [];

    const now = new Date();
    let displayStartDate: Date;
    let displayEndDate: Date;
    let interval: 'day' | 'week' | 'month' = 'month'; // Default interval

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
            interval = 'day'; // Change to 'week' if weekly aggregation is preferred
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

    // Generate the date range based on the determined interval
    const dates: Date[] = generateDateRange(displayStartDate, displayEndDate, interval);

    // Initialize chart data with all intervals and zeroed transaction types
    const initializedData: CreditsBurnDownChartDataType[] = dates.map((date) => ({
        date,
        label:
            interval === 'day'
                ? format(date, 'dd MMM')
                : interval === 'week'
                  ? `${format(date, 'dd MMM')} - ${format(addDays(date, 6), 'dd MMM')}` // Display date range for the week
                  : format(date, 'MMM yyyy'),
        purchase: 0,
        consumption: 0,
        refund: 0,
        bonus: 0,
        penalty: 0,
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

        if (chartEntry) {
            chartEntry[item.type] += item.credits;
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
 * Determines which transaction types have data in the current chartData.
 *
 * @param chartData - The prepared chart data.
 * @param transactionTypes - All possible transaction types.
 * @returns An array of visible transaction types.
 */
export const getVisibleTransactionTypes = (
    chartData: CreditsBurnDownChartDataType[],
    transactionTypes: CreditsTransactionType[],
): CreditsTransactionType[] => {
    const typesWithData = new Set<CreditsTransactionType>();
    chartData.forEach((entry) => {
        transactionTypes.forEach((type) => {
            if (entry[type] > 0) {
                typesWithData.add(type);
            }
        });
    });
    return transactionTypes.filter((type) => typesWithData.has(type));
};

/**
 * Prepares chart configuration based on transaction types and color palette.
 *
 * @param visibleTransactionTypes - An array of transaction types that have data.
 * @returns A ChartConfig object mapping each type to its label and color.
 */
export const prepareCreditsBurnDownChartConfig = (
    visibleTransactionTypes: CreditsTransactionType[],
): ChartConfig => {
    const config: ChartConfig = {
        consumption: {
            label: 'Consumption',
            color: 'var(--foreground)',
            icon: (
                <CreditsBurnDownPatternIcon
                    color="var(--foreground)"
                    patternId="credits-burn-down-consumption"
                    type="consumption"
                />
            ),
        },
        purchase: {
            label: 'Purchases',
            color: 'var(--success)',
            strokeDasharray: '5 5',
            icon: (
                <CreditsBurnDownPatternIcon
                    color="var(--success)"
                    patternId="credits-burn-down-purchase"
                    strokeDasharray="5 5"
                    type="purchase"
                />
            ),
        },
        refund: {
            label: 'Refunds',
            color: 'var(--warning)',
            patternId: 'admin-pattern-refund',
            icon: (
                <CreditsBurnDownPatternIcon
                    color="var(--warning)"
                    patternId="credits-burn-down-refund"
                    type="refund"
                />
            ),
        },
        bonus: {
            label: 'Bonuses',
            color: 'var(--info)',
            patternId: 'admin-pattern-bonus',
            icon: (
                <CreditsBurnDownPatternIcon
                    color="var(--info)"
                    patternId="credits-burn-down-bonus"
                    type="bonus"
                />
            ),
        },
        penalty: {
            label: 'Penalties',
            color: 'var(--destructive)',
            icon: (
                <CreditsBurnDownPatternIcon
                    color="var(--destructive)"
                    patternId="credits-burn-down-penalty"
                    type="penalty"
                />
            ),
        },
    };

    // Filter the config based on visible transaction types:
    const filteredConfig: ChartConfig = {};

    visibleTransactionTypes.forEach((type) => {
        filteredConfig[type] = config[type];
    });

    return filteredConfig;
};
