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
import { COLORS_PACK } from '@/constants/colors';
import UserActivityPatternIcon from '@app/(protected)/admin/dashboard/components/statistics/user-activity/partials/user-activity-pattern-icon';
import { generateDateRange, getDateRange } from '@library/time';
import type {
    UserActivityReport,
    UserActivityType,
} from '@actions/admin/analytics/statistics/get-user-activity-reports';
import type { ChartConfig } from '@ui/chart';

export type UserActivityChartDataType = {
    date: Date;
    label: string;
} & Partial<Record<UserActivityType, number>>;

export const prepareUserActivityChartData = (
    data: UserActivityReport[] | undefined,
    selectedFilter: string,
): UserActivityChartDataType[] => {
    if (!data || data.length === 0) return [];

    const now = new Date();
    let displayStartDate: Date;
    let displayEndDate: Date;
    let interval: 'day' | 'week' | 'month' = 'month';

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
            interval = 'day';
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
            const transactionDates = data.map((item) => new Date(item.timestamp));
            const earliestDate = startOfMonth(
                new Date(Math.min(...transactionDates.map((d) => d.getTime()))),
            );
            displayStartDate = earliestDate;
            displayEndDate = endOfMonth(now);
            interval = determineInterval(differenceInMonths(displayEndDate, earliestDate) + 1);
            break;
        }
        default: {
            const defaultRange = getDateRange('last_6_months', now);
            displayStartDate = defaultRange.startDate!;
            displayEndDate = defaultRange.endDate!;
            interval = 'month';
            break;
        }
    }

    const dates: Date[] = generateDateRange(displayStartDate, displayEndDate, interval);

    const initializedData: UserActivityChartDataType[] = dates.map((date) => ({
        date: date,
        label:
            interval === 'day'
                ? format(date, 'dd MMM')
                : interval === 'week'
                  ? `${format(date, 'dd MMM')} - ${format(addDays(date, 6), 'dd MMM')}`
                  : format(date, 'MMM yyyy'),
        sign_in: 0,
        sign_out: 0,
        heartbeat: 0,
        enabled_mfa: 0,
        disabled_mfa: 0,
        changed_email: 0,
        changed_password: 0,
        closed_account: 0,
        updated_profile: 0,
        created_customer: 0,
        updated_customer: 0,
        deleted_customer: 0,
        created_translation: 0,
        deleted_translation: 0,
        assigned_customer_to_translation: 0,
        initiated_checkout: 0,
        completed_checkout: 0,
        failed_checkout: 0,
        opened_billing_portal: 0,
        customer_deleted: 0,
        accessed_signed_url: 0,
    }));

    data.forEach((item) => {
        const date = new Date(item.timestamp);

        if (isBefore(date, displayStartDate) || isAfter(date, displayEndDate)) return;

        let keyDate: Date;
        if (interval === 'day') {
            keyDate = startOfDay(date);
        } else if (interval === 'week') {
            keyDate = startOfWeek(date, { weekStartsOn: 0 });
        } else {
            keyDate = startOfMonth(date);
        }

        const chartEntry = initializedData.find((entry) => {
            return entry.date.getTime() === keyDate.getTime();
        });

        if (chartEntry && item.type) {
            chartEntry[item.type] = (chartEntry[item.type] || 0) + 1;
        }
    });

    return initializedData;
};

const determineInterval = (totalMonths: number): 'day' | 'week' | 'month' => {
    if (totalMonths <= 1) return 'day';
    if (totalMonths <= 6) return 'week';
    return 'month';
};

export const getVisibleActivityTypes = (
    chartData: UserActivityChartDataType[],
    transactionTypes: UserActivityType[],
): UserActivityType[] => {
    const typesWithData = new Set<UserActivityType>();
    chartData.forEach((entry) => {
        transactionTypes.forEach((type) => {
            if (entry[type] && entry[type] > 0) {
                typesWithData.add(type);
            }
        });
    });
    return transactionTypes.filter((type) => typesWithData.has(type));
};

export const prepareUserActivityChartConfig = (visibleActivityTypes: UserActivityType[]): ChartConfig => {
    const config: ChartConfig = {
        sign_in: {
            label: 'Sign-in',
            color: COLORS_PACK[0],
            icon: (
                <UserActivityPatternIcon
                    color={COLORS_PACK[0]}
                    patternId="user-activity-sign-in"
                    type="sign_in"
                />
            ),
        },
        sign_out: {
            label: 'Sign-out',
            color: COLORS_PACK[1],
            icon: (
                <UserActivityPatternIcon
                    color={COLORS_PACK[1]}
                    patternId="user-activity-sign-out"
                    type="sign_out"
                />
            ),
        },
        heartbeat: {
            label: 'Heartbeat',
            color: COLORS_PACK[2],
            icon: (
                <UserActivityPatternIcon
                    color={COLORS_PACK[2]}
                    patternId="user-activity-heartbeat"
                    type="heartbeat"
                />
            ),
            patternId: 'user-activity-heartbeat',
            strokeDasharray: '3 3',
        },
        enabled_mfa: {
            label: 'Enabled MFA',
            color: COLORS_PACK[3],
            icon: (
                <UserActivityPatternIcon
                    color={COLORS_PACK[3]}
                    patternId="user-activity-enabled-mfa"
                    type="enabled_mfa"
                />
            ),
        },
        disabled_mfa: {
            label: 'Disabled MFA',
            color: COLORS_PACK[4],
            icon: (
                <UserActivityPatternIcon
                    color={COLORS_PACK[4]}
                    patternId="user-activity-disabled-mfa"
                    type="disabled_mfa"
                />
            ),
        },
        changed_email: {
            label: 'Changed Email',
            color: COLORS_PACK[5],
            icon: (
                <UserActivityPatternIcon
                    color={COLORS_PACK[5]}
                    patternId="user-activity-changed-email"
                    type="changed_email"
                />
            ),
        },
        changed_password: {
            label: 'Changed Password',
            color: COLORS_PACK[6],
            icon: (
                <UserActivityPatternIcon
                    color={COLORS_PACK[6]}
                    patternId="user-activity-changed-password"
                    type="changed_password"
                />
            ),
        },
        closed_account: {
            label: 'Closed Account',
            color: COLORS_PACK[7],
            icon: (
                <UserActivityPatternIcon
                    color={COLORS_PACK[7]}
                    patternId="user-activity-closed-account"
                    type="closed_account"
                />
            ),
        },
        updated_profile: {
            label: 'Updated Profile',
            color: COLORS_PACK[8],
            icon: (
                <UserActivityPatternIcon
                    color={COLORS_PACK[8]}
                    patternId="user-activity-updated-profile"
                    type="updated_profile"
                />
            ),
        },
        created_customer: {
            label: 'Created Customer',
            color: COLORS_PACK[9],
            icon: (
                <UserActivityPatternIcon
                    color={COLORS_PACK[9]}
                    patternId="user-activity-created-customer"
                    type="created_customer"
                />
            ),
        },
        updated_customer: {
            label: 'Updated Customer',
            color: COLORS_PACK[10],
            icon: (
                <UserActivityPatternIcon
                    color={COLORS_PACK[10]}
                    patternId="user-activity-updated-customer"
                    type="updated_customer"
                />
            ),
        },
        deleted_customer: {
            label: 'Deleted Customer',
            color: COLORS_PACK[11],
            icon: (
                <UserActivityPatternIcon
                    color={COLORS_PACK[11]}
                    patternId="user-activity-deleted-customer"
                    type="deleted_customer"
                />
            ),
        },
        created_translation: {
            label: 'Created Translation',
            color: COLORS_PACK[12],
            patternId: 'user-activity-created-translation',
            icon: (
                <UserActivityPatternIcon
                    color={COLORS_PACK[12]}
                    patternId="user-activity-created-translation"
                    type="created_translation"
                />
            ),
        },
        deleted_translation: {
            label: 'Deleted Translation',
            color: COLORS_PACK[13],
            icon: (
                <UserActivityPatternIcon
                    color={COLORS_PACK[13]}
                    patternId="user-activity-deleted-translation"
                    type="deleted_translation"
                />
            ),
        },
        assigned_customer_to_translation: {
            label: 'Assigned Customer to Translation',
            color: COLORS_PACK[14],
            icon: (
                <UserActivityPatternIcon
                    color={COLORS_PACK[14]}
                    patternId="user-activity-assigned-customer-to-translation"
                    type="assigned_customer_to_translation"
                />
            ),
        },
        initiated_checkout: {
            label: 'Initiated Checkout',
            color: COLORS_PACK[15],
            icon: (
                <UserActivityPatternIcon
                    color={COLORS_PACK[15]}
                    patternId="user-activity-initiated-checkout"
                    type="initiated_checkout"
                />
            ),
        },
        completed_checkout: {
            label: 'Completed Checkout',
            color: COLORS_PACK[16],
            icon: (
                <UserActivityPatternIcon
                    color={COLORS_PACK[16]}
                    patternId="user-activity-completed-checkout"
                    type="completed_checkout"
                />
            ),
        },
        failed_checkout: {
            label: 'Failed Checkout',
            color: COLORS_PACK[0],
            icon: (
                <UserActivityPatternIcon
                    color={COLORS_PACK[0]}
                    patternId="user-activity-failed-checkout"
                    type="failed_checkout"
                />
            ),
        },
        opened_billing_portal: {
            label: 'Opened Billing',
            color: COLORS_PACK[1],
            icon: (
                <UserActivityPatternIcon
                    color={COLORS_PACK[1]}
                    patternId="user-activity-opened-billing-portal"
                    type="opened_billing_portal"
                />
            ),
        },
        customer_deleted: {
            label: 'Customer Deleted',
            color: COLORS_PACK[2],
            icon: (
                <UserActivityPatternIcon
                    color={COLORS_PACK[2]}
                    patternId="user-activity-customer-deleted"
                    type="customer_deleted"
                />
            ),
        },
        accessed_signed_url: {
            label: 'Accessed Signed URL',
            color: COLORS_PACK[3],
            icon: (
                <UserActivityPatternIcon
                    color={COLORS_PACK[3]}
                    patternId="user-activity-accessed-signed-url"
                    type="accessed_signed_url"
                />
            ),
        },
    };

    const filteredConfig: ChartConfig = {};
    visibleActivityTypes.forEach((type) => {
        filteredConfig[type] = config[type];
    });

    return filteredConfig;
};
