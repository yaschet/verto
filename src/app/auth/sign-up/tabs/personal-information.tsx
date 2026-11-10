/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { useZodResolver } from '@/src/hooks/use-zod-resolver';
import { SignInIcon, UserCircleDashedIcon } from '@phosphor-icons/react';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@components/ui/form';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import type { RegistrationDataType } from '@/types/auth/registration';

export default function PersonalInformation({
    isLoading,
    personalInformation,
    submitPersonalInformation,
}: {
    personalInformation: RegistrationDataType['personalInformation'];
    submitPersonalInformation: (values: RegistrationDataType['personalInformation']) => void;
    isLoading: boolean;
    backward: () => void;
}) {
    const personalInformationSchema = z.object({
        day: z.string().min(1, 'You must select a day.'),
        firstName: z.string().min(2, 'First name must be at least 2 characters long.'),
        lastName: z.string().min(2, 'Last name must be at least 2 characters long.'),
        month: z.string().min(1, 'You must select a month.'),
        year: z.string().min(4, 'You must select a year.'),
    });

    // Constants for months and years:
    const MONTHS = [
        { label: 'January', value: 1 },
        { label: 'February', value: 2 },
        { label: 'March', value: 3 },
        { label: 'April', value: 4 },
        { label: 'May', value: 5 },
        { label: 'June', value: 6 },
        { label: 'July', value: 7 },
        { label: 'August', value: 8 },
        { label: 'September', value: 9 },
        { label: 'October', value: 10 },
        { label: 'November', value: 11 },
        { label: 'December', value: 12 },
    ];

    const CURRENT_YEAR = new Date().getFullYear();

    const YEARS = useMemo(() => {
        const startYear = 1900;
        return Array.from({ length: CURRENT_YEAR - startYear + 1 }, (_, i) => ({
            label: (startYear + i).toString(),
            value: startYear + i,
        })).reverse();
    }, []);

    // Function to generate days based on month and year:
    const generateDays = (month: number, year: number) => {
        const daysInMonth = new Date(year, month, 0).getDate();
        return Array.from({ length: daysInMonth }, (_, i) => ({
            label: (i + 1).toString(),
            value: i + 1,
        }));
    };
    // Initialize form with default values and validation schema
    const form = useForm<z.infer<typeof personalInformationSchema>>({
        defaultValues: {
            day: personalInformation?.dateOfBirth ? personalInformation.dateOfBirth.split('/')[0] : '',
            firstName: personalInformation?.firstName || '',
            lastName: personalInformation?.lastName || '',
            month: personalInformation?.dateOfBirth ? personalInformation.dateOfBirth.split('/')[1] : '',
            year: personalInformation?.dateOfBirth ? personalInformation.dateOfBirth.split('/')[2] : '',
        },
        resolver: useZodResolver(personalInformationSchema),
    });

    const { control, formState, getValues, handleSubmit, setValue, watch } = form;

    const selectedMonth = watch('month');
    const selectedYear = watch('year');

    // Compute days based on selected month and year
    const days = useMemo(() => {
        const monthNum = parseInt(selectedMonth) || 1;
        const yearNum = parseInt(selectedYear) || CURRENT_YEAR;
        return generateDays(monthNum, yearNum);
    }, [selectedMonth, selectedYear]);

    // Ensure selected day is valid whenever days change
    useEffect(() => {
        const selectedDay = parseInt(getValues('day')) || 1;
        const maxDay = days.length;
        if (selectedDay > maxDay) {
            setValue('day', maxDay.toString(), { shouldValidate: true });
        } else if (selectedDay < 1 || isNaN(selectedDay)) {
            setValue('day', '1', { shouldValidate: true });
        }
    }, [days, getValues, setValue]);

    // Helper component to render select fields
    function SelectField({
        label,
        name,
        options,
    }: {
        name: keyof z.infer<typeof personalInformationSchema>;
        label: string;
        options: { label: string; value: number }[];
    }) {
        return (
            <FormField
                control={control}
                name={name}
                render={({ field }) => (
                    <FormItem>
                        <Select
                            autoComplete={`bday-${name}`}
                            defaultValue={field.value}
                            onValueChange={field.onChange}
                        >
                            <SelectTrigger>
                                <FormControl>
                                    <SelectValue placeholder={label} />
                                </FormControl>
                            </SelectTrigger>
                            <SelectContent>
                                {options.map((option) => (
                                    <SelectItem key={option.value} value={option.value.toString()}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
        );
    }

    // Handle form submission
    const onSubmit = (values: z.infer<typeof personalInformationSchema>) => {
        submitPersonalInformation({
            dateOfBirth: `${values.day}/${values.month}/${values.year}`,
            firstName: values.firstName,
            lastName: values.lastName,
        });
    };

    return (
        <div className="flex w-full flex-col items-center justify-center gap-5">
            {/* Header Section */}
            <div className="mb-5 flex flex-col items-center justify-center gap-3" data-testid="welcome-text">
                <div className="bg-primary-100 dark:bg-primary-900 mb-3 flex size-16 items-center justify-center rounded-full">
                    <UserCircleDashedIcon
                        className="text-primary-500 dark:text-primary-400 size-8"
                        weight="duotone"
                    />
                </div>
                <h1 className="text-surface-900 text-center text-3xl leading-tight font-bold tracking-tight md:text-4xl dark:text-white">
                    Create Your Account
                </h1>
                <p className="text-surface-600 dark:text-surface-400 text-center font-medium">
                    Enter Your Personal Information to Get Started.
                </p>
            </div>

            {/* Form Section */}
            <Form {...form}>
                <form
                    autoComplete="on"
                    className="mb-5 flex w-full flex-col items-center justify-center gap-5"
                    onSubmit={handleSubmit(onSubmit)}
                >
                    {/* Personal Information Fields */}
                    <div className="grid w-full grid-flow-row grid-cols-1 gap-3 md:grid-cols-2">
                        <FormField
                            control={control}
                            name="firstName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>First name</FormLabel>
                                    <FormControl>
                                        <Input
                                            autoComplete="given-name"
                                            hasError={!!formState.errors.firstName}
                                            placeholder="John"
                                            shape="rounded"
                                            type="text"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={control}
                            name="lastName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Last name</FormLabel>
                                    <FormControl>
                                        <Input
                                            autoComplete="family-name"
                                            hasError={!!formState.errors.lastName}
                                            placeholder="Doe"
                                            shape="rounded"
                                            type="text"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Date of Birth Fields */}
                    <div className="w-full">
                        <Label className="mb-2 block text-sm" htmlFor="date_of_birth">
                            Date of Birth
                        </Label>
                        <div className="grid w-full grid-flow-row grid-cols-3 gap-3">
                            {/* Day */}
                            <SelectField label="Day" name="day" options={days} />
                            {/* Month */}
                            <SelectField label="Month" name="month" options={MONTHS} />
                            {/* Year */}
                            <SelectField label="Year" name="year" options={YEARS} />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <Button
                        className="mt-2 w-full"
                        color="primary"
                        disabled={isLoading}
                        loading={isLoading}
                        shape="rounded"
                        size="lg"
                        type="submit"
                        variant="solid"
                    >
                        <SignInIcon className="size-5" color="currentColor" weight="duotone" />
                        Continue
                    </Button>
                </form>
            </Form>
        </div>
    );
}
