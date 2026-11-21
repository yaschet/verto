/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { addDays, endOfDay, format, startOfDay, startOfMonth, startOfWeek } from 'date-fns';
import { getLanguage } from 'language-flag-colors';
import { getColorForString } from '@library/color-utilities';
import { generateDateRange } from '@library/time';
import type { ChartConfig } from '@/components/ui/chart';
import type { TranslationPair } from '@actions/services/analytics/get-translation-pairs-history';

export type FilterOption = {
    label: string;
    value: string;
};

export type ChartDataType = {
    date: string;
    total: number;
    [pairKey: string]: number | string;
};

/**
 * Prepares chart data based on fetched data and selected filter.
 *
 * @param data - The fetched translation pairs data.
 * @param selectedFilter - The selected time filter.
 * @param startDate - The start date for the data range.
 * @param endDate - The end date for the data range.
 * @param now - The current date.
 * @returns An array of chart data points.
 */
export const prepareChartData = (
    data: TranslationPair[] | undefined,
    selectedFilter: string,
    startDate: Date | undefined,
    endDate: Date | undefined,
    now: Date,
): ChartDataType[] => {
    if (!data || data.length === 0) return [];

    // Determine interval based on selected filter
    let interval: 'day' | 'week' | 'month' = 'day';
    if (selectedFilter === 'last_3_months') {
        interval = 'week';
    } else if (selectedFilter === 'last_6_months' || selectedFilter === 'all') {
        interval = 'month';
    }

    // Generate date range based on interval
    const earliestDate =
        startDate || (data.length > 0 ? startOfDay(new Date(data[0].created_at)) : startOfDay(now));
    const latestDate = endDate || endOfDay(now);
    const dateRange = generateDateRange(earliestDate, latestDate, interval);

    // Get all unique translation pairs
    const allPairs = Array.from(
        new Set(data.map((item) => `${item.source_language}-${item.target_language}`)),
    );

    // Initialize chart data
    const initializedData: ChartDataType[] = dateRange.map((date) => {
        const dateLabel =
            interval === 'day'
                ? format(date, 'dd MMM')
                : interval === 'week'
                  ? `${format(date, 'dd MMM')} - ${format(addDays(date, 6), 'dd MMM')}`
                  : format(date, 'MMM yyyy');

        const dataPoint: ChartDataType = { date: dateLabel, total: 0 };
        allPairs.forEach((pairKey) => {
            dataPoint[pairKey] = 0;
        });
        return dataPoint;
    });

    // Aggregate data
    data.forEach((item) => {
        const itemDate = new Date(item.created_at);

        let keyDate: Date;
        if (interval === 'day') {
            keyDate = startOfDay(itemDate);
        } else if (interval === 'week') {
            keyDate = startOfWeek(itemDate, { weekStartsOn: 0 });
        } else {
            keyDate = startOfMonth(itemDate);
        }

        const dateLabel =
            interval === 'day'
                ? format(keyDate, 'dd MMM')
                : interval === 'week'
                  ? `${format(keyDate, 'dd MMM')} - ${format(addDays(keyDate, 6), 'dd MMM')}`
                  : format(keyDate, 'MMM yyyy');

        const pairKey = `${item.source_language}-${item.target_language}`;
        const dataPoint = initializedData.find((entry) => entry.date === dateLabel);
        if (dataPoint) {
            dataPoint[pairKey] = (dataPoint[pairKey] as number) + 1; // Increment count
            dataPoint.total = (dataPoint.total as number) + 1;
        }
    });

    return initializedData;
};

/**
 * Prepares chart configuration based on translation pairs and color palette.
 *
 * @param allPairs - An array of unique translation pair keys.
 * @param colors - An array of color strings.
 * @returns A ChartConfig object mapping each pair to its label and color.
 */
export const prepareChartConfig = (allPairs: string[], colors: string[]): ChartConfig => {
    const config: ChartConfig = {};
    allPairs.forEach((pairKey) => {
        const [sourceCode, targetCode] = pairKey.split('-');
        const sourceLang = getLanguage(sourceCode)?.name || sourceCode;
        const targetLang = getLanguage(targetCode)?.name || targetCode;
        config[pairKey] = {
            label: `${sourceLang} → ${targetLang}`,
            color: getColorForString(pairKey, colors), // Use deterministic color assignment
        };
    });
    return config;
};
