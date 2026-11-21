/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { useMemo, useCallback, useState, useEffect } from 'react';
import {
    GiftIcon,
    ArrowCounterClockwiseIcon,
    WarningIcon,
    ArrowRightIcon,
    WalletIcon,
    PencilSimpleIcon,
} from '@phosphor-icons/react';
import { useMutation } from '@tanstack/react-query';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { adjustCredits } from '@actions/admin/users/adjust-credits';
import { Button } from '@components/ui/button';
import { DialogFooter } from '@components/ui/dialog';
import { FormField, FormItem, FormLabel, FormMessage } from '@components/ui/form';
import { Input } from '@components/ui/input';
import { useZodResolver } from '@hooks/use-zod-resolver';
import { cn } from '@library/utils';
import type { AdminUserRow } from '@schemas/admin-user-schemas';
import type { ApiErrorType } from '@/types/rest/errors';
import type { Dispatch, SetStateAction } from 'react';

// Schema - amount is always positive, type determines operation
const adjustCreditsSchema = z.object({
    amount: z.coerce.number().int().min(1, 'Amount must be at least 1'),
    type: z.enum(['bonus', 'penalty', 'refund']),
    description: z.string().min(5, 'Description must be at least 5 characters'),
});

type AdjustCreditsData = {
    amount: number;
    type: 'bonus' | 'penalty' | 'refund';
    description: string;
};

// Transaction type definitions
const transactionTypes = [
    {
        value: 'bonus' as const,
        label: 'Bonus',
        icon: GiftIcon,
        color: 'success' as const,
        description: 'Add credits as a reward or promotion',
    },
    {
        value: 'refund' as const,
        label: 'Refund',
        icon: ArrowCounterClockwiseIcon,
        color: 'primary' as const,
        description: 'Return credits for a failed service',
    },
    {
        value: 'penalty' as const,
        label: 'Penalty',
        icon: WarningIcon,
        color: 'destructive' as const,
        description: 'Deduct credits for violations',
    },
];

// Professional description templates
const getAutoDescription = (type: 'bonus' | 'penalty' | 'refund', amount: number): string => {
    switch (type) {
        case 'bonus':
            return `Awarded ${amount} bonus credits to account.`;
        case 'refund':
            return `Refunded ${amount} credits to account.`;
        case 'penalty':
            return `Deducted ${amount} credits from account.`;
        default:
            return '';
    }
};

// Color classes for transaction type cards
const colorClasses = {
    success: {
        selected: 'border-success-500 bg-success-50 dark:bg-success-950/30',
        hover: 'hover:border-success-300 hover:bg-success-50/50 dark:hover:border-success-700 dark:hover:bg-success-950/20',
        icon: 'text-success-600 dark:text-success-400',
        iconBg: 'bg-success-100 dark:bg-success-900/30',
    },
    primary: {
        selected: 'border-primary-500 bg-primary-50 dark:bg-primary-950/30',
        hover: 'hover:border-primary-300 hover:bg-primary-50/50 dark:hover:border-primary-700 dark:hover:bg-primary-950/20',
        icon: 'text-primary-600 dark:text-primary-400',
        iconBg: 'bg-primary-100 dark:bg-primary-900/30',
    },
    destructive: {
        selected: 'border-destructive-500 bg-destructive-50 dark:bg-destructive-950/30',
        hover: 'hover:border-destructive-300 hover:bg-destructive-50/50 dark:hover:border-destructive-700 dark:hover:bg-destructive-950/20',
        icon: 'text-destructive-600 dark:text-destructive-400',
        iconBg: 'bg-destructive-100 dark:bg-destructive-900/30',
    },
};

// Preset amounts - always positive, type determines operation
const presetAmounts = [5, 10, 25, 50, 100, 250];

interface AdjustCreditsFormProps {
    selectedUser: AdminUserRow | null;
    currentBalance: number;
    setIsModalOpen: Dispatch<SetStateAction<boolean>>;
    onClose: () => void;
    onCreditsAdjusted: () => void;
}

export function AdjustCreditsForm({
    selectedUser,
    currentBalance,
    onClose,
    onCreditsAdjusted,
}: AdjustCreditsFormProps) {
    // Track whether user wants custom description
    const [useCustomDescription, setUseCustomDescription] = useState(false);

    const resolver = useZodResolver(adjustCreditsSchema);

    const formMethods = useForm<AdjustCreditsData>({
        defaultValues: {
            amount: 10,
            type: 'bonus',
            description: getAutoDescription('bonus', 10),
        },
        mode: 'onChange',
        resolver,
    });

    const {
        control,
        handleSubmit,
        setValue,
        formState: { isValid },
    } = formMethods;

    // Watch form values for live preview
    const watchedType = useWatch({ control, name: 'type' });
    const watchedAmount = useWatch({ control, name: 'amount' });

    // Auto-update description when type or amount changes (if not using custom)
    useEffect(() => {
        if (!useCustomDescription && watchedAmount > 0) {
            setValue('description', getAutoDescription(watchedType, watchedAmount), { shouldValidate: true });
        }
    }, [watchedType, watchedAmount, useCustomDescription, setValue]);

    // Handle type change
    const handleTypeChange = useCallback(
        (newType: 'bonus' | 'penalty' | 'refund') => {
            setValue('type', newType);
        },
        [setValue],
    );

    // Calculate new balance - penalty subtracts, others add
    const newBalance = useMemo(() => {
        const amount = Math.abs(Number(watchedAmount) || 0);
        return watchedType === 'penalty' ? currentBalance - amount : currentBalance + amount;
    }, [currentBalance, watchedAmount, watchedType]);

    const { isPending, mutateAsync } = useMutation({
        mutationFn: async (data: AdjustCreditsData) => {
            const response = await adjustCredits({
                amount: Math.abs(data.amount),
                description: data.description,
                type: data.type,
                userId: selectedUser?.id ?? '',
            });

            if (response?.error || !response) {
                throw response;
            }

            return response;
        },
        onError: (error: (Error & Partial<ApiErrorType>) | ApiErrorType | unknown) => {
            const err = error as ApiErrorType;
            toast.error(err?.message || 'Failed to adjust credits', {
                description: err?.description || 'An error occurred while adjusting credits.',
            });
        },
        onSuccess: () => {
            toast.success('Credits adjusted successfully', {
                description: `${watchedType === 'penalty' ? 'Deducted' : 'Added'} ${watchedAmount} credits.`,
            });
            onClose();
            onCreditsAdjusted();
        },
    });

    const selectedTypeConfig = transactionTypes.find((t) => t.value === watchedType);

    return (
        <FormProvider {...formMethods}>
            <form
                className="mt-4 flex flex-col gap-5"
                onSubmit={handleSubmit(async (data) => mutateAsync(data))}
            >
                {/* Transaction Type Cards */}
                <div>
                    <FormLabel className="mb-2 block text-sm font-medium text-surface-700 dark:text-surface-300">
                        Transaction Type
                    </FormLabel>
                    <div className="grid grid-cols-3 gap-3">
                        {transactionTypes.map((type) => {
                            const isSelected = watchedType === type.value;
                            const colors = colorClasses[type.color];
                            const Icon = type.icon;

                            return (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => handleTypeChange(type.value)}
                                    className={cn(
                                        'flex flex-col items-center gap-3 rounded-2xl border-2 p-5 transition-all duration-150',
                                        isSelected
                                            ? colors.selected
                                            : `border-surface-200 dark:border-surface-800 ${colors.hover}`,
                                    )}
                                >
                                    <div
                                        className={cn(
                                            'flex size-11 items-center justify-center rounded-xl',
                                            isSelected ? colors.iconBg : 'bg-surface-100 dark:bg-surface-800',
                                        )}
                                    >
                                        <Icon
                                            className={cn(
                                                'size-5',
                                                isSelected ? colors.icon : 'text-surface-500',
                                            )}
                                            weight="duotone"
                                        />
                                    </div>
                                    <span
                                        className={cn(
                                            'text-sm font-medium',
                                            isSelected
                                                ? 'text-surface-900 dark:text-surface-100'
                                                : 'text-surface-600 dark:text-surface-400',
                                        )}
                                    >
                                        {type.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    {selectedTypeConfig && (
                        <p className="mt-2 text-xs text-surface-500">{selectedTypeConfig.description}</p>
                    )}
                </div>

                {/* Amount Section */}
                <div className="space-y-2.5">
                    <FormLabel className="mb-2 block text-sm font-medium text-surface-700 dark:text-surface-300">
                        Amount
                    </FormLabel>

                    {/* Preset Pills - Responsive Grid */}
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                        {presetAmounts.map((amount) => {
                            const isActive = watchedAmount === amount;

                            // Type-specific active colors
                            const getActiveClasses = () => {
                                switch (watchedType) {
                                    case 'bonus':
                                        return 'bg-success-100 text-success-700 ring-1 ring-success-300 dark:bg-success-900/40 dark:text-success-300 dark:ring-success-700';
                                    case 'refund':
                                        return 'bg-accent-100 text-accent-700 ring-1 ring-accent-300 dark:bg-accent-900/40 dark:text-accent-300 dark:ring-accent-700';
                                    case 'penalty':
                                        return 'bg-destructive-100 text-destructive-700 ring-1 ring-destructive-300 dark:bg-destructive-900/40 dark:text-destructive-300 dark:ring-destructive-700';
                                    default:
                                        return '';
                                }
                            };

                            return (
                                <button
                                    key={amount}
                                    type="button"
                                    onClick={() => setValue('amount', amount, { shouldValidate: true })}
                                    className={cn(
                                        'rounded-xl py-2.5 text-sm font-semibold transition-all duration-150',
                                        isActive
                                            ? getActiveClasses()
                                            : 'bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-surface-700',
                                    )}
                                >
                                    {amount}
                                </button>
                            );
                        })}
                    </div>

                    {/* Custom Amount Input */}
                    <FormField
                        control={control}
                        name="amount"
                        render={({ field }) => (
                            <FormItem>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        min={1}
                                        step={1}
                                        placeholder="Enter amount"
                                        className="pr-16"
                                        {...field}
                                        onChange={(e) => {
                                            const val = Math.abs(Math.floor(e.target.valueAsNumber));
                                            field.onChange(isNaN(val) ? '' : val);
                                        }}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-surface-500">
                                        credits
                                    </span>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Description */}
                <FormField
                    control={control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <div className="flex items-center justify-between">
                                <FormLabel className="text-sm font-medium text-surface-700 dark:text-surface-300">
                                    Description
                                </FormLabel>
                                <button
                                    type="button"
                                    onClick={() => setUseCustomDescription(!useCustomDescription)}
                                    className={cn(
                                        'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all',
                                        useCustomDescription
                                            ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                                            : 'bg-surface-100 text-surface-500 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-surface-700',
                                    )}
                                >
                                    <PencilSimpleIcon
                                        className="size-3.5"
                                        weight={useCustomDescription ? 'fill' : 'regular'}
                                    />
                                    {useCustomDescription ? 'Custom' : 'Customize'}
                                </button>
                            </div>
                            {useCustomDescription ? (
                                <textarea
                                    placeholder="Enter a custom description..."
                                    className={cn(
                                        'w-full min-h-[80px] resize-none rounded-xl px-4 py-3 text-sm',
                                        'bg-surface-100 dark:bg-surface-900',
                                        'border border-surface-200 dark:border-surface-800',
                                        'text-foreground placeholder:text-muted-foreground',
                                        'outline outline-2 outline-transparent outline-offset-0',
                                        'focus-visible:outline-primary-500 dark:focus-visible:outline-primary-500',
                                        'focus-visible:bg-white dark:focus-visible:bg-surface-800',
                                        'hover:bg-surface-50 dark:hover:bg-surface-800',
                                        'transition-all duration-150',
                                    )}
                                    {...field}
                                />
                            ) : (
                                <div
                                    className={cn(
                                        'w-full rounded-xl px-4 py-3 text-sm',
                                        'bg-surface-50 dark:bg-surface-900/50',
                                        'border border-surface-200 dark:border-surface-800',
                                        'text-surface-700 dark:text-surface-300',
                                    )}
                                >
                                    {field.value || 'Description will be generated automatically.'}
                                </div>
                            )}
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Balance Preview */}
                {watchedAmount !== 0 &&
                    (() => {
                        // Type-specific colors for the balance preview
                        const getPreviewColors = () => {
                            if (newBalance < 0) {
                                // Always destructive if balance goes negative
                                return {
                                    container: 'bg-destructive-50 dark:bg-destructive-950/30',
                                    iconContainer: 'bg-destructive-100 dark:bg-destructive-900/40',
                                    icon: 'text-destructive-600 dark:text-destructive-400',
                                    badge: 'bg-destructive-100 text-destructive-700 dark:bg-destructive-900/40 dark:text-destructive-300',
                                };
                            }
                            switch (watchedType) {
                                case 'bonus':
                                    return {
                                        container: 'bg-success-50 dark:bg-success-950/30',
                                        iconContainer: 'bg-success-100 dark:bg-success-900/40',
                                        icon: 'text-success-600 dark:text-success-400',
                                        badge: 'bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300',
                                    };
                                case 'refund':
                                    return {
                                        container: 'bg-accent-50 dark:bg-accent-950/30',
                                        iconContainer: 'bg-accent-100 dark:bg-accent-900/40',
                                        icon: 'text-accent-600 dark:text-accent-400',
                                        badge: 'bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300',
                                    };
                                case 'penalty':
                                    return {
                                        container: 'bg-destructive-50 dark:bg-destructive-950/30',
                                        iconContainer: 'bg-destructive-100 dark:bg-destructive-900/40',
                                        icon: 'text-destructive-600 dark:text-destructive-400',
                                        badge: 'bg-destructive-100 text-destructive-700 dark:bg-destructive-900/40 dark:text-destructive-300',
                                    };
                                default:
                                    return {
                                        container: 'bg-surface-100 dark:bg-surface-800',
                                        iconContainer: 'bg-surface-200 dark:bg-surface-700',
                                        icon: 'text-surface-500',
                                        badge: 'bg-surface-200 text-surface-700 dark:bg-surface-700 dark:text-surface-300',
                                    };
                            }
                        };

                        const colors = getPreviewColors();

                        return (
                            <div className={cn('rounded-2xl p-4', colors.container)}>
                                <div className="flex items-center gap-4">
                                    <div
                                        className={cn(
                                            'flex size-10 shrink-0 items-center justify-center rounded-xl',
                                            colors.iconContainer,
                                        )}
                                    >
                                        <WalletIcon className={cn('size-5', colors.icon)} weight="duotone" />
                                    </div>
                                    <div className="flex flex-1 items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-medium text-surface-500">
                                                Current
                                            </span>
                                            <span className="text-lg font-bold text-surface-900 dark:text-surface-100">
                                                {currentBalance.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span
                                                className={cn(
                                                    'rounded-lg px-2.5 py-1 text-sm font-semibold',
                                                    colors.badge,
                                                )}
                                            >
                                                {watchedType === 'penalty' ? '-' : '+'}
                                                {Math.abs(watchedAmount)}
                                            </span>
                                            <ArrowRightIcon className="size-4 text-surface-400" />
                                            <div className="flex flex-col items-end">
                                                <span className="text-xs font-medium text-surface-500">
                                                    After
                                                </span>
                                                <span
                                                    className={cn(
                                                        'text-lg font-bold',
                                                        newBalance < 0
                                                            ? 'text-destructive-600 dark:text-destructive-400'
                                                            : 'text-surface-900 dark:text-surface-100',
                                                    )}
                                                >
                                                    {newBalance.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {newBalance < 0 && (
                                    <p className="mt-3 text-xs font-medium text-destructive-600 dark:text-destructive-400">
                                        Cannot deduct more than available balance. Reduce the amount.
                                    </p>
                                )}
                            </div>
                        );
                    })()}

                {/* Footer */}
                <DialogFooter className="mt-2 flex gap-3">
                    <Button type="button" variant="outlined" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        color={watchedType === 'penalty' ? 'destructive' : 'primary'}
                        loading={isPending}
                        disabled={!isValid || !watchedAmount || watchedAmount < 1 || newBalance < 0}
                    >
                        {isPending
                            ? watchedType === 'penalty'
                                ? 'Deducting...'
                                : 'Adding...'
                            : watchedType === 'penalty'
                              ? 'Deduct Credits'
                              : 'Add Credits'}
                    </Button>
                </DialogFooter>
            </form>
        </FormProvider>
    );
}
