/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import {
    addDays,
    addMonths,
    addWeeks,
    endOfDay,
    endOfMonth,
    endOfWeek,
    startOfDay,
    startOfMonth,
    startOfWeek,
    subDays,
    subMonths,
} from 'date-fns';

/**
 * Generates an array of Date objects representing each day, week, or month
 * between the startDate and endDate based on the interval.
 *
 * @param start - The starting date
 * @param end - The ending date
 * @param interval - 'day', 'week', or 'month'
 * @returns An array of Date objects
 */
export const generateDateRange = (start: Date, end: Date, interval: 'day' | 'week' | 'month'): Date[] => {
    const dates: Date[] = [];
    let current = new Date(start);

    if (interval === 'week') {
        current = startOfWeek(current, { weekStartsOn: 0 }); // Align to start of week (Sunday).
    } else if (interval === 'month') {
        current = startOfMonth(current); // Align to start of month (1st).
    }

    while (current <= end) {
        dates.push(new Date(current));

        if (interval === 'day') {
            current = addDays(current, 1);
        } else if (interval === 'week') {
            current = addWeeks(current, 1);
        } else if (interval === 'month') {
            current = addMonths(current, 1);
        }
    }

    return dates;
};

/**
 * Determines the start and end dates based on the selected filter.
 *
 * @param selectedFilter - The selected time filter.
 * @param now - The current date.
 * @returns An object containing startDate and endDate.
 */
export const getDateRange = (selectedFilter: string, now: Date): { startDate?: Date; endDate?: Date } => {
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    switch (selectedFilter) {
        case 'last_7_days':
            startDate = startOfDay(subDays(now, 6)); // Include today
            endDate = endOfDay(now);
            break;
        case 'last_month':
            startDate = startOfWeek(subMonths(now, 1), { weekStartsOn: 0 });
            endDate = endOfWeek(subMonths(now, 1), { weekStartsOn: 0 });
            break;
        case 'last_3_months':
            startDate = startOfMonth(subMonths(now, 2)); // Include current month
            endDate = endOfMonth(now);
            break;
        case 'last_6_months':
            startDate = startOfMonth(subMonths(now, 5)); // Include current month
            endDate = endOfMonth(now);
            break;
        case 'all':
            startDate = undefined;
            endDate = undefined;
            break;
        default:
            // Default to last 7 days
            startDate = startOfDay(subDays(now, 6));
            endDate = endOfDay(now);
            break;
    }

    return {
        startDate,
        endDate,
    };
};
