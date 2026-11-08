/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { useEffect, useMemo } from 'react';
import type { Control, FieldErrors } from 'react-hook-form';
import { useWatch } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/src/components/ui/form';
import { Input } from '@/src/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';
import type { AdminUserFormData } from '@/types/admin/user-forms';
import type { FieldPath } from 'react-hook-form';
import { cn } from '@/src/library/utils';

interface PersonalInformationFieldsProps {
    control: Control<AdminUserFormData>;
    errors: FieldErrors<AdminUserFormData>;
    baseName?: 'personalInformation';
    disabled?: boolean;
}

/**
 * Personal Information Fields Component
 *
 * Renders atomic form fields for personal information:
 * - firstName, lastName (text inputs)
 * - dateOfBirth (day/month/year selects with smart day generation)
 *
 * Date logic:
 * - Days are dynamically generated based on selected month/year
 * - Accounts for leap years (February 29)
 * - Validates selected day doesn't exceed max days in month
 *
 * Props:
 * - control: React Hook Form control object
 * - errors: Errors object for displaying validation messages
 * - baseName: Field name prefix (always 'personalInformation' for this field set)
 * - disabled: Disable all inputs (for loading state)
 */
export function PersonalInformationFields({
    control,
    errors,
    baseName = 'personalInformation',
    disabled,
}: PersonalInformationFieldsProps) {
    // Constants for date selects
    const MONTHS = [
        { label: 'January', value: '1' },
        { label: 'February', value: '2' },
        { label: 'March', value: '3' },
        { label: 'April', value: '4' },
        { label: 'May', value: '5' },
        { label: 'June', value: '6' },
        { label: 'July', value: '7' },
        { label: 'August', value: '8' },
        { label: 'September', value: '9' },
        { label: 'October', value: '10' },
        { label: 'November', value: '11' },
        { label: 'December', value: '12' },
    ];

    const CURRENT_YEAR = new Date().getFullYear();

    const YEARS = useMemo(() => {
        const startYear = 1900;
        return Array.from({ length: CURRENT_YEAR - startYear + 1 }, (_, i) => ({
            label: (startYear + i).toString(),
            value: (startYear + i).toString(),
        })).reverse();
    }, []);

    // Watch month and year to update available days
    const monthValue = useWatch({
        control,
        name: `${baseName}.month` as const,
    });

    const yearValue = useWatch({
        control,
        name: `${baseName}.year` as const,
    });

    const dayValue = useWatch({
        control,
        name: `${baseName}.day` as const,
    });

    // Generate days based on selected month/year
    const generateDays = (monthStr: string, yearStr: string) => {
        const month = parseInt(monthStr) || 1;
        const year = parseInt(yearStr) || CURRENT_YEAR;
        const daysInMonth = new Date(year, month, 0).getDate();

        return Array.from({ length: daysInMonth }, (_, i) => ({
            label: (i + 1).toString(),
            value: (i + 1).toString(),
        }));
    };

    const days = useMemo(
        () => generateDays(monthValue || '1', yearValue || CURRENT_YEAR.toString()),
        [monthValue, yearValue],
    );

    // Validate and adjust selected day if it exceeds max days in month
    useEffect(() => {
        if (!dayValue || !control._formValues) return;

        const selectedDay = parseInt(dayValue) || 1;
        const maxDay = days.length;

        if (selectedDay > maxDay) {
            control._formValues[baseName].day = maxDay.toString();
        }
    }, [days, dayValue, control, baseName]);

    // Helper to build field names with baseName prefix
    const getFieldName = (field: string) => `${baseName}.${field}` as FieldPath<AdminUserFormData>;

    const sectionErrors = errors?.[baseName];

    return (
        <div className="space-y-4 w-full">
            {/* First Name and Last Name in two columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={control}
                    name={getFieldName('firstName')}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>First name</FormLabel>
                            <FormControl>
                                <Input
                                    autoComplete="given-name"
                                    placeholder="John"
                                    disabled={disabled}
                                    hasError={!!sectionErrors?.firstName}
                                    {...field}
                                    value={(field.value as string) ?? ''}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={control}
                    name={getFieldName('lastName')}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Last name</FormLabel>
                            <FormControl>
                                <Input
                                    autoComplete="family-name"
                                    placeholder="Doe"
                                    disabled={disabled}
                                    hasError={!!sectionErrors?.lastName}
                                    {...field}
                                    value={(field.value as string) ?? ''}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            {/* Date of Birth with day/month/year selects */}
            <div>
                <FormLabel className="mb-2 block">Date of birth</FormLabel>
                <div className="grid grid-cols-3 gap-2 md:gap-3">
                    {/* Day Select */}
                    <FormField
                        control={control}
                        name={getFieldName('day')}
                        render={({ field }) => {
                            const hasError = !!sectionErrors?.day;
                            return (
                                <FormItem>
                                    <Select
                                        value={(field.value as string) ?? ''}
                                        onValueChange={field.onChange}
                                        disabled={disabled}
                                    >
                                        <FormControl>
                                            <SelectTrigger
                                                className={cn(
                                                    hasError &&
                                                        'bg-destructive-100 dark:bg-destructive-950 border border-destructive',
                                                )}
                                            >
                                                <SelectValue placeholder="Day" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {days.map((day) => (
                                                <SelectItem key={day.value} value={day.value}>
                                                    {day.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            );
                        }}
                    />

                    {/* Month Select */}
                    <FormField
                        control={control}
                        name={getFieldName('month')}
                        render={({ field }) => {
                            const hasError = !!sectionErrors?.month;
                            return (
                                <FormItem>
                                    <Select
                                        value={(field.value as string) ?? ''}
                                        onValueChange={field.onChange}
                                        disabled={disabled}
                                    >
                                        <FormControl>
                                            <SelectTrigger
                                                className={cn(
                                                    hasError &&
                                                        'bg-destructive-100 dark:bg-destructive-950 border border-destructive',
                                                )}
                                            >
                                                <SelectValue placeholder="Month" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {MONTHS.map((month) => (
                                                <SelectItem key={month.value} value={month.value}>
                                                    {month.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            );
                        }}
                    />

                    {/* Year Select */}
                    <FormField
                        control={control}
                        name={getFieldName('year')}
                        render={({ field }) => {
                            const hasError = !!sectionErrors?.year;
                            return (
                                <FormItem>
                                    <Select
                                        value={(field.value as string) ?? ''}
                                        onValueChange={field.onChange}
                                        disabled={disabled}
                                    >
                                        <FormControl>
                                            <SelectTrigger
                                                className={cn(
                                                    hasError &&
                                                        'bg-destructive-100 dark:bg-destructive-950 border border-destructive',
                                                )}
                                            >
                                                <SelectValue placeholder="Year" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {YEARS.map((year) => (
                                                <SelectItem key={year.value} value={year.value}>
                                                    {year.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            );
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
