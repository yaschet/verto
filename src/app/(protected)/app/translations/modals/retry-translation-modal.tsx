/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { useMemo, useCallback } from 'react';
import {
    ArrowClockwiseIcon,
    ArrowsCounterClockwiseIcon,
    FileDocIcon,
    LightningIcon,
} from '@phosphor-icons/react';
import { useMutation } from '@tanstack/react-query';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { titleCase } from 'title-case';
import { z } from 'zod';
import { retryFromStage, type RetryStage } from '@actions/services/translations/retry-from-stage';
import { retryTranslation } from '@actions/services/translations/retry-translation';
import { Button } from '@components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@components/ui/dialog';
import { FormLabel } from '@components/ui/form';
import { useUserData } from '@hooks/queries/auth/use-user-data';
import { useZodResolver } from '@hooks/use-zod-resolver';
import { cn } from '@library/utils';
import { getQueryClient } from '@queries/tanstack/query-client';
import type { TranslationRow } from '@schemas/translation-schemas';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';
import type { Dispatch, SetStateAction, JSX } from 'react';

const retrySchema = z.object({
    retryType: z.enum(['full', 'generate']),
});

type RetryFormData = z.infer<typeof retrySchema>;

// Retry option configuration
type RetryOption = {
    value: 'full' | 'generate';
    label: string;
    description: string;
    estimatedTime: string;
    icon: typeof ArrowClockwiseIcon;
    color: 'primary' | 'success';
};

const retryOptions: RetryOption[] = [
    {
        value: 'generate',
        label: 'Retry Generation Only',
        description: 'Uses existing translation - much faster',
        estimatedTime: '~10 seconds',
        icon: FileDocIcon,
        color: 'success',
    },
    {
        value: 'full',
        label: 'Start Over Completely',
        description: 'Re-runs entire pipeline from scratch',
        estimatedTime: '~60 seconds',
        icon: ArrowClockwiseIcon,
        color: 'primary',
    },
];

// Color classes for retry type cards
const colorClasses = {
    success: {
        selected: 'border-success-500 bg-success-50 dark:bg-success-950/30',
        hover: 'hover:border-success-300 hover:bg-success-50/50 dark:hover:border-success-700 dark:hover:bg-success-950/20',
        icon: 'text-success-600 dark:text-success-400',
        iconBg: 'bg-success-100 dark:bg-success-900/30',
        badge: 'bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300',
    },
    primary: {
        selected: 'border-primary-500 bg-primary-50 dark:bg-primary-950/30',
        hover: 'hover:border-primary-300 hover:bg-primary-50/50 dark:hover:border-primary-700 dark:hover:bg-primary-950/20',
        icon: 'text-primary-600 dark:text-primary-400',
        iconBg: 'bg-primary-100 dark:bg-primary-900/30',
        badge: 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300',
    },
};

/**
 * Retry Translation Modal Component (Smart Retry)
 *
 * Shows granular retry options based on pipeline checkpoint state:
 * - If translation succeeded but generation failed: offer "Retry Generation Only" (~10s)
 * - Always offer "Start Over Completely" (~60s) as fallback
 *
 * Uses checkpoint-based pipeline architecture for 83% faster retries
 * when only the generation stage failed.
 */
export default function RetryTranslationModal({
    isRetryModalOpen,
    selectedTranslation,
    setIsRetryModalOpen,
    setSelectedTranslation,
}: {
    isRetryModalOpen: boolean;
    selectedTranslation: TranslationRow | null;
    setSelectedTranslation: Dispatch<SetStateAction<TranslationRow | null>>;
    setIsRetryModalOpen: Dispatch<SetStateAction<boolean>>;
}): JSX.Element {
    const queryClient = getQueryClient();
    const { data: userData } = useUserData();
    const { user } = userData ?? {};
    const userId = user?.id ?? '';

    // Analyze translation state to determine retry options
    const retryState = useMemo(() => {
        if (!selectedTranslation) return { canRetryGeneration: false, failedStage: null };

        const details = (selectedTranslation.details as Record<string, unknown>) || {};
        const hasTranslatedDocument = !!details.translated_document;
        const failedStage = details.failed_at_stage as string | undefined;

        return {
            canRetryGeneration: hasTranslatedDocument && failedStage === 'generating',
            failedStage,
            hasTranslatedDocument,
        };
    }, [selectedTranslation]);

    // Filter available options based on state
    const availableOptions = useMemo(() => {
        if (retryState.canRetryGeneration) {
            return retryOptions; // Both options available
        }
        // Only full retry available
        return retryOptions.filter((o) => o.value === 'full');
    }, [retryState.canRetryGeneration]);

    // Determine default selection
    const defaultRetryType = retryState.canRetryGeneration ? 'generate' : 'full';

    // Form setup with Zod validation
    const resolver = useZodResolver(retrySchema);
    const formMethods = useForm<RetryFormData>({
        defaultValues: {
            retryType: defaultRetryType,
        },
        mode: 'onChange',
        resolver,
    });

    const {
        control,
        handleSubmit,
        setValue,
        reset,
        formState: { isValid },
    } = formMethods;
    const watchedType = useWatch({ control, name: 'retryType' });

    // Reset form when modal opens with new translation
    useMemo(() => {
        if (isRetryModalOpen && selectedTranslation) {
            reset({ retryType: defaultRetryType });
        }
    }, [isRetryModalOpen, selectedTranslation, defaultRetryType, reset]);

    // Handle type change
    const handleTypeChange = useCallback(
        (newType: 'full' | 'generate') => {
            setValue('retryType', newType, { shouldValidate: true });
        },
        [setValue],
    );

    // Close handler
    const handleClose = useCallback(() => {
        setIsRetryModalOpen(false);
        setSelectedTranslation(null);
    }, [setIsRetryModalOpen, setSelectedTranslation]);

    // Success handler
    const handleSuccess = useCallback(
        async (data: ApiResponseOrError) => {
            handleClose();
            await queryClient.invalidateQueries({
                queryKey: ['paginated-translations', userId],
            });
            if (selectedTranslation?.id) {
                await queryClient.invalidateQueries({
                    queryKey: ['translation-detail', selectedTranslation.id],
                });
            }
            toast.success(data.message ?? 'Retry Started', {
                description: data.description ?? 'The translation is being processed again.',
            });
        },
        [handleClose, queryClient, userId, selectedTranslation?.id],
    );

    // Error handler
    const handleError = useCallback((error: (Error & Partial<ApiErrorType>) | ApiErrorType) => {
        toast.error(error.title ?? error.message ?? 'Error', {
            description: error.description ?? 'An error occurred while retrying the translation.',
        });
    }, []);

    // Full retry mutation
    const fullRetryMutation = useMutation({
        mutationFn: async ({ id }: { id: string }) => {
            const response = await retryTranslation({ translationId: id });
            if (response?.error || !response) throw response;
            return response;
        },
        onError: handleError,
        onSuccess: handleSuccess,
    });

    // Stage-specific retry mutation
    const stageRetryMutation = useMutation({
        mutationFn: async ({ id, stage }: { id: string; stage: RetryStage }) => {
            const response = await retryFromStage({ translationId: id, stage });
            if (response?.error || !response) throw response;
            return response;
        },
        onError: handleError,
        onSuccess: handleSuccess,
    });

    const isPending = fullRetryMutation.isPending || stageRetryMutation.isPending;

    // Form submission
    const onSubmit = async (data: RetryFormData) => {
        if (!selectedTranslation?.id) return;

        if (data.retryType === 'full') {
            await fullRetryMutation.mutateAsync({ id: selectedTranslation.id });
        } else if (data.retryType === 'generate') {
            await stageRetryMutation.mutateAsync({ id: selectedTranslation.id, stage: 'generate' });
        }
    };

    const selectedOption = availableOptions.find((o) => o.value === watchedType);

    return (
        <Dialog open={isRetryModalOpen} onOpenChange={setIsRetryModalOpen}>
            <DialogContent className="sm:max-w-lg">
                {/* Custom Header Layout - matches MFA dialog pattern */}
                <DialogHeader className="flex w-full flex-row items-center gap-4 space-y-0">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-warning-100 text-warning-600 dark:bg-warning-900/20 dark:text-warning-400">
                        <ArrowsCounterClockwiseIcon className="size-6" weight="duotone" />
                    </div>
                    <div className="flex flex-1 flex-col gap-1">
                        <DialogTitle>{titleCase('Retry Translation')}</DialogTitle>
                        <DialogDescription>
                            {retryState.canRetryGeneration
                                ? 'Generation failed, but translation completed. Choose how to proceed.'
                                : `Retry "${selectedTranslation?.display_name || 'translation'}"`}
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <FormProvider {...formMethods}>
                    <form className="mt-4 flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
                        {/* Retry Type Cards */}
                        <div>
                            <FormLabel className="mb-2 block text-sm font-medium text-surface-700 dark:text-surface-300">
                                Retry Option
                            </FormLabel>
                            <div
                                className={cn(
                                    'grid gap-3',
                                    availableOptions.length > 1 ? 'grid-cols-2' : 'grid-cols-1',
                                )}
                            >
                                {availableOptions.map((option) => {
                                    const isSelected = watchedType === option.value;
                                    const colors = colorClasses[option.color];
                                    const Icon = option.icon;
                                    const isRecommended =
                                        retryState.canRetryGeneration && option.value === 'generate';

                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => handleTypeChange(option.value)}
                                            disabled={isPending}
                                            className={cn(
                                                'relative flex flex-col items-center gap-3 rounded-2xl border-2 p-5 transition-all duration-150',
                                                isSelected
                                                    ? colors.selected
                                                    : `border-surface-200 dark:border-surface-800 ${colors.hover}`,
                                                isPending && 'cursor-not-allowed opacity-50',
                                            )}
                                        >
                                            {/* Recommended badge */}
                                            {isRecommended && (
                                                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-success-500 px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm">
                                                        <LightningIcon className="size-3" weight="fill" />
                                                        Faster
                                                    </span>
                                                </div>
                                            )}

                                            <div
                                                className={cn(
                                                    'flex size-11 items-center justify-center rounded-xl',
                                                    isSelected
                                                        ? colors.iconBg
                                                        : 'bg-surface-100 dark:bg-surface-800',
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
                                            <div className="flex flex-col items-center gap-1">
                                                <span
                                                    className={cn(
                                                        'text-sm font-medium text-center',
                                                        isSelected
                                                            ? 'text-surface-900 dark:text-surface-100'
                                                            : 'text-surface-600 dark:text-surface-400',
                                                    )}
                                                >
                                                    {option.label}
                                                </span>
                                                <span className="text-xs text-surface-500 text-center">
                                                    {option.estimatedTime}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            {selectedOption && (
                                <p className="mt-2 text-xs text-surface-500">{selectedOption.description}</p>
                            )}
                        </div>

                        {/* Warning for full retry */}
                        {watchedType === 'full' && (
                            <div className="rounded-2xl bg-surface-100 p-4 dark:bg-surface-900">
                                <p className="text-xs font-medium text-surface-600 dark:text-surface-400 mb-2">
                                    This will:
                                </p>
                                <ul className="text-surface-500 marker:text-warning list-disc space-y-1 pl-4 text-xs marker:font-bold">
                                    <li>Delete all previous results permanently</li>
                                    <li>Re-process the document from scratch</li>
                                    <li>Deduct credits again if successful</li>
                                </ul>
                            </div>
                        )}

                        {/* Info for generation retry */}
                        {watchedType === 'generate' && (
                            <div className="rounded-2xl bg-success-50 p-4 dark:bg-success-950/30">
                                <p className="text-xs font-medium text-success-700 dark:text-success-300 mb-2">
                                    Quick retry benefits:
                                </p>
                                <ul className="text-success-600 dark:text-success-400 marker:text-success-500 list-disc space-y-1 pl-4 text-xs marker:font-bold">
                                    <li>Keeps your existing translation</li>
                                    <li>Only regenerates the document</li>
                                    <li>83% faster than full retry</li>
                                </ul>
                            </div>
                        )}

                        {/* Footer */}
                        <DialogFooter className="mt-2 flex gap-3">
                            <Button
                                type="button"
                                variant="outlined"
                                onClick={handleClose}
                                disabled={isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                color={watchedType === 'generate' ? 'success' : 'warning'}
                                loading={isPending}
                                disabled={!isValid || isPending}
                            >
                                {isPending
                                    ? 'Retrying...'
                                    : watchedType === 'generate'
                                      ? 'Retry Generation'
                                      : 'Retry Translation'}
                            </Button>
                        </DialogFooter>
                    </form>
                </FormProvider>
            </DialogContent>
        </Dialog>
    );
}
