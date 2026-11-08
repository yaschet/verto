/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { useZodResolver } from '@/src/hooks/use-zod-resolver';
import { CalendarDotsIcon, FunnelSimpleIcon, FunnelSimpleXIcon } from '@phosphor-icons/react';
import { useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { FormProvider, useForm } from 'react-hook-form';
import { TRANSACTION_TYPES } from '@app/(protected)/account/billing/components/partials/credits-transactions-cells';
import { useFilteringStore } from '@components/providers/filtering-store-provider';
import { Button } from '@components/ui/button';
import { Calendar } from '@components/ui/calendar';
import { Checkbox } from '@components/ui/checkbox';
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@components/ui/form';
import { Input } from '@components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@components/ui/popover';
import { cn } from '@library/utils';
import { transactionsHistoryFilterSchema } from '@schemas/billing-schemas';
import type { z } from 'zod';

// Helper to get color classes based on transaction type
function getColorClasses(color: string, isSelected: boolean) {
    const colorMap = {
        primary: {
            hover: 'hover:bg-primary-100 dark:hover:bg-primary-900',
            selected: 'bg-primary-50 dark:bg-primary-950',
        },
        success: {
            hover: 'hover:bg-success-100 dark:hover:bg-success-900',
            selected: 'bg-success-50 dark:bg-success-950',
        },
        warning: {
            hover: 'hover:bg-warning-100 dark:hover:bg-warning-900',
            selected: 'bg-warning-50 dark:bg-warning-950',
        },
        destructive: {
            hover: 'hover:bg-destructive-100 dark:hover:bg-destructive-900',
            selected: 'bg-destructive-50 dark:bg-destructive-950',
        },
    };

    const colors = colorMap[color as keyof typeof colorMap] || colorMap.primary;
    return isSelected ? colors.selected : colors.hover;
}

export function FilterTransactionsForm() {
    const sortedTransactionTypes: (keyof typeof TRANSACTION_TYPES)[] = [
        'consumption',
        'purchase',
        'bonus',
        'refund',
        'penalty',
    ];

    // Access the zustand store action
    const transactionsHistoryFilter = useFilteringStore((state) => state.transactionsHistory);
    const setTransactionsHistoryFilter = useFilteringStore(
        (state) => state.transactionsHistoryActions.setTransactionsHistoryFilter,
    );
    const resetTransactionsHistoryFilter = useFilteringStore(
        (state) => state.transactionsHistoryActions.resetTransactionsHistoryFilter,
    );
    const setIsSheetOpen = useFilteringStore(
        (state) => state.transactionsHistoryActions.setTransactionsHistoryFilterOpen,
    );

    const filterZodSchema = transactionsHistoryFilterSchema;

    const filterFormMethods = useForm<z.infer<typeof filterZodSchema>>({
        defaultValues: transactionsHistoryFilter,
        mode: 'all',
        resolver: useZodResolver(filterZodSchema),
    });

    const { control, handleSubmit } = filterFormMethods;

    // Modify the mutation function to save filters in the store
    const { isPending, mutateAsync } = useMutation({
        mutationFn: async ({ amountRange, dateRange, transactionType }: z.infer<typeof filterZodSchema>) => {
            // Save the submitted filter directly into the zustand store
            console.log('Filter Applied:', { transactionType, amountRange, dateRange });
            console.log(setTransactionsHistoryFilter);

            setTransactionsHistoryFilter({
                transactionType,
                amountRange,
                dateRange,
            });

            return {
                success: true,
                status: 200,
                title: 'Filter Applied',
                message: 'The filter has been applied successfully.',
                description: 'The filter has been applied successfully.',
            };
        },
        onSuccess: async () => {
            setIsSheetOpen(false);
        },
        retry: 3,
        retryDelay: (attempt) => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000),
    });

    // Handle form submission
    const onSubmit = (data: z.infer<typeof filterZodSchema>) => {
        mutateAsync(data).then((r) => r);
    };

    return (
        <FormProvider {...filterFormMethods}>
            <form
                className="flex w-full flex-col items-center justify-center gap-5"
                onSubmit={handleSubmit(onSubmit)}
            >
                <div className="flex w-full flex-col items-start justify-start gap-4">
                    {/* Form Fields */}
                    <FormField
                        control={control}
                        name="transactionType"
                        render={({ field }) => {
                            return (
                                <div className="flex flex-col items-start justify-start gap-2">
                                    <div className="mb-1 flex flex-col items-start justify-start gap-0">
                                        <FormLabel
                                            className="text-foreground text-sm font-medium"
                                            htmlFor="transactionType"
                                        >
                                            Transaction Type
                                        </FormLabel>

                                        <FormDescription>
                                            Select the type of transactions you want to filter by. You can
                                            filter by purchase, consumption, bonus, penalty, and refund
                                            transactions.
                                        </FormDescription>
                                    </div>
                                    {sortedTransactionTypes.map((key) => {
                                        const type = TRANSACTION_TYPES[key];
                                        const isSelected = field.value[key] === true;
                                        return (
                                            <FormItem
                                                key={type.text}
                                                className={cn(
                                                    'w-full',
                                                    'relative flex items-center rounded-full text-nowrap select-none',
                                                    'px-5 py-2.5',
                                                    'text-sm font-medium outline-none',
                                                    'cursor-pointer',
                                                    'transition-all duration-200 ease-in-out',
                                                    'active:scale-[0.98]',
                                                    getColorClasses(type.color || 'blue', isSelected),
                                                )}
                                                onClick={() => {
                                                    // Toggle the checkbox state when clicking anywhere on the container
                                                    // The checkbox wrapper will stopPropagation to prevent double-toggling
                                                    field.onChange({
                                                        ...field.value,
                                                        [key]: !field.value[key],
                                                    });
                                                }}
                                            >
                                                <div className="flex h-full w-full items-center justify-between gap-2">
                                                    <div className="flex h-full w-full flex-1 items-center gap-2">
                                                        <div className="flex h-auto w-auto items-center justify-center">
                                                            <Button
                                                                color={type.color}
                                                                shape="pill"
                                                                size="icon-md"
                                                                type="button"
                                                                variant="solid"
                                                            >
                                                                <type.icon
                                                                    className="size-5"
                                                                    color="currentColor"
                                                                    weight="duotone"
                                                                />
                                                            </Button>
                                                        </div>
                                                        <div className="flex w-full flex-1 flex-col items-start justify-start gap-1">
                                                            <span className="text-foreground text-sm font-bold whitespace-nowrap">
                                                                {type.text}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div onClick={(e) => e.stopPropagation()}>
                                                        <Checkbox
                                                            aria-label={`${type.text} Transactions`}
                                                            checked={field.value[key]}
                                                            color={type.checkboxColor}
                                                            id={key}
                                                            name={key}
                                                            radius="full"
                                                            onCheckedChange={(value) => {
                                                                // Only handle boolean values to prevent 'indeterminate' state issues
                                                                if (typeof value === 'boolean') {
                                                                    field.onChange({
                                                                        ...field.value,
                                                                        [key]: value,
                                                                    });
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </FormItem>
                                        );
                                    })}

                                    <FormMessage />
                                </div>
                            );
                        }}
                    />

                    <FormField
                        control={control}
                        name="amountRange"
                        render={({ field }) => {
                            return (
                                <div className="flex w-full flex-col items-start justify-start gap-2">
                                    <div className="mb-1 flex flex-col items-start justify-start gap-0">
                                        <FormLabel
                                            className="text-foreground text-sm font-medium"
                                            htmlFor="amountRange"
                                        >
                                            Amount
                                        </FormLabel>

                                        <FormDescription>
                                            Enter the minimum and maximum amount range you want to filter by.
                                            You can filter transactions by their amount range.
                                        </FormDescription>
                                    </div>

                                    <div className="flex w-full flex-row items-center justify-between gap-2">
                                        <FormItem className="w-full flex-1">
                                            <FormControl>
                                                <Input
                                                    className="w-full flex-1"
                                                    defaultValue={field.value.min ?? undefined}
                                                    placeholder="Min"
                                                    type="number"
                                                    onChange={(e) => {
                                                        field.onChange({
                                                            ...field.value,
                                                            min: e.target.value
                                                                ? parseInt(e.target.value ?? 0)
                                                                : undefined,
                                                        });
                                                    }}
                                                />
                                            </FormControl>
                                        </FormItem>
                                        <span className="text-muted flex-0 text-sm">to</span>
                                        <FormItem className="w-full flex-1">
                                            <FormControl>
                                                <Input
                                                    className="w-full"
                                                    defaultValue={field.value.max ?? undefined}
                                                    placeholder="Max"
                                                    type="number"
                                                    onChange={(e) => {
                                                        field.onChange({
                                                            ...field.value,
                                                            max: e.target.value
                                                                ? parseInt(e.target.value ?? 0)
                                                                : undefined,
                                                        });
                                                    }}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    </div>
                                    <FormMessage />
                                </div>
                            );
                        }}
                    />

                    <FormField
                        control={control}
                        name="dateRange"
                        render={({ field }) => {
                            return (
                                <div className="flex w-full flex-col items-start justify-start gap-2">
                                    <div className="mb-1 flex flex-col items-start justify-start gap-0">
                                        <FormLabel
                                            className="text-foreground text-sm font-medium"
                                            htmlFor="dateRange"
                                        >
                                            Date Range
                                        </FormLabel>

                                        <FormDescription>
                                            Enter the start and end date range you want to filter by. You can
                                            filter transactions by their date range.
                                        </FormDescription>
                                    </div>

                                    <div className="flex w-full flex-row items-center justify-between gap-2">
                                        <FormItem className="w-full flex-1">
                                            <FormControl>
                                                <div className={cn('grid gap-2')}>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                className={cn(
                                                                    'w-full justify-start text-start font-normal',
                                                                    !field.value.start &&
                                                                        'text-muted-foreground',
                                                                )}
                                                                color="default"
                                                                id="date"
                                                                variant="soft"
                                                            >
                                                                <CalendarDotsIcon
                                                                    className="size-5"
                                                                    color="currentColor"
                                                                    weight="duotone"
                                                                />
                                                                <span>
                                                                    {field.value.start
                                                                        ? field.value.end
                                                                            ? `${format(field.value.start, 'LLL dd, y')} - ${format(field.value.end, 'LLL dd, y')}`
                                                                            : format(
                                                                                  field.value.start,
                                                                                  'LLL dd, y',
                                                                              )
                                                                        : 'Select Date Range'}
                                                                </span>
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent
                                                            align="start"
                                                            className="w-auto rounded-3xl p-0"
                                                        >
                                                            <Calendar
                                                                autoFocus={true}
                                                                defaultMonth={
                                                                    new Date(field.value.start ?? Date.now())
                                                                }
                                                                mode="range"
                                                                numberOfMonths={2}
                                                                selected={
                                                                    field.value.start
                                                                        ? {
                                                                              from: field.value.start
                                                                                  ? new Date(
                                                                                        field.value.start,
                                                                                    )
                                                                                  : undefined,
                                                                              to: field.value.end
                                                                                  ? new Date(field.value.end)
                                                                                  : undefined,
                                                                          }
                                                                        : undefined
                                                                }
                                                                onSelect={(selectedDate) => {
                                                                    field.onChange({
                                                                        start: selectedDate?.from
                                                                            ? new Date(selectedDate.from)
                                                                            : undefined,
                                                                        end: selectedDate?.to
                                                                            ? new Date(selectedDate.to)
                                                                            : undefined,
                                                                    });
                                                                }}
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    </div>
                                </div>
                            );
                        }}
                    />

                    <div className="mt-2 flex w-full flex-row items-stretch justify-end gap-2">
                        <Button
                            className="w-full"
                            color="default"
                            shape="rounded"
                            size="lg"
                            type="button"
                            variant="soft"
                            onClick={() => {
                                setIsSheetOpen(false);
                                resetTransactionsHistoryFilter();
                            }}
                        >
                            <FunnelSimpleXIcon className="size-5" color="currentColor" weight="duotone" />
                            Reset Filters
                        </Button>
                        {isPending ? (
                            <Button
                                className="w-full"
                                color="primary"
                                disabled={true}
                                loading={true}
                                shape="rounded"
                                size="lg"
                                type="button"
                                variant="solid"
                            >
                                Applying Filters
                            </Button>
                        ) : (
                            <Button
                                className="w-full"
                                color="primary"
                                shape="rounded"
                                size="lg"
                                type="submit"
                                variant="solid"
                            >
                                <FunnelSimpleIcon className="size-5" color="currentColor" weight="duotone" />
                                Apply Filters
                            </Button>
                        )}
                    </div>
                </div>
            </form>
        </FormProvider>
    );
}
