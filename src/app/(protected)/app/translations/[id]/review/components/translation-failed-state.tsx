/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import {
    ArrowCounterClockwiseIcon,
    ArrowLeftIcon,
    ArrowRightIcon,
    ExclamationMarkIcon,
    FilePlusIcon,
    GlobeIcon,
    TranslateIcon,
    XIcon,
} from '@phosphor-icons/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as countriesFlag from 'country-flag-icons/react/1x1';
import Link from 'next/link';
import { toast } from 'sonner';
import { retryTranslation } from '@actions/services/translations/retry-translation';
import { Button } from '@components/ui/button';
import { DefaultCard } from '@components/ui/card';
import { cn } from '@library/utils';
import {
    AUTO_DETECT_LANGUAGE,
    AVAILABLE_SOURCE_LANGUAGES_WITH_AUTO,
    AVAILABLE_TARGET_LANGUAGES,
} from '@/src/constants/translations';
import { STATUS_MAPPING } from '@/app/(protected)/app/translations/table/constants/mappings';
import type { TranslationRow, TranslationStatus } from '@schemas/translation-schemas';

// Language helper (same as other review components)
const getLanguageDetails = (code: string | null | undefined, isSource: boolean = false) => {
    if (!code || code === AUTO_DETECT_LANGUAGE) {
        return {
            name: 'Auto-detect',
            isAuto: true,
            countryCode: null,
        };
    }

    const countryCodeMapping: Record<string, string> = {
        en: 'US',
        fr: 'FR',
        es: 'ES',
        de: 'DE',
        it: 'IT',
        pt: 'PT',
        ru: 'RU',
        zh: 'CN',
        ja: 'JP',
        ko: 'KR',
        ar: 'SA',
        hi: 'IN',
        nl: 'NL',
        pl: 'PL',
        tr: 'TR',
        vi: 'VN',
        th: 'TH',
        id: 'ID',
        sv: 'SE',
        da: 'DK',
        fi: 'FI',
        no: 'NO',
        cs: 'CZ',
        el: 'GR',
        he: 'IL',
        ro: 'RO',
        hu: 'HU',
        sk: 'SK',
        uk: 'UA',
        bg: 'BG',
        hr: 'HR',
        lt: 'LT',
        lv: 'LV',
        et: 'EE',
        sl: 'SI',
        sr: 'RS',
        fa: 'IR',
        ur: 'PK',
        ms: 'MY',
        tl: 'PH',
        sw: 'KE',
    };

    const list = isSource ? AVAILABLE_SOURCE_LANGUAGES_WITH_AUTO : AVAILABLE_TARGET_LANGUAGES;
    const lang = list.find(
        (l) => l.ids?.ISO_639_1 === code || (l.ids as { bcp_47_code?: string })?.bcp_47_code === code,
    );
    const countryCode = countryCodeMapping[code.toLowerCase()] || code.toUpperCase();

    return {
        name: lang?.name || code,
        isAuto: false,
        countryCode,
    };
};

type TranslationFailedStateProps = {
    translation: TranslationRow;
    status: Extract<TranslationStatus, 'failed' | 'canceled'>;
};

/**
 * Translation Failed State
 *
 * Displayed when a translation has failed or been canceled.
 * Shows appropriate icon (no spinner), error message, and retry option.
 * Retry uses TanStack Query mutation with loading state and toast feedback.
 */
export function TranslationFailedState({ translation, status }: TranslationFailedStateProps) {
    const queryClient = useQueryClient();
    const statusDetails = STATUS_MAPPING[status];
    const displayName = translation.display_name || 'Untitled Document';
    const isCanceled = status === 'canceled';

    // Language details with flags
    const sourceLang = getLanguageDetails(translation.source_language, true);
    const targetLang = getLanguageDetails(translation.target_language, false);
    const SourceFlag = sourceLang.countryCode
        ? countriesFlag[sourceLang.countryCode as keyof typeof countriesFlag]
        : null;
    const TargetFlag = targetLang.countryCode
        ? countriesFlag[targetLang.countryCode as keyof typeof countriesFlag]
        : null;

    // Icon based on status
    const StatusIcon = isCanceled ? XIcon : ExclamationMarkIcon;

    // Retry mutation with TanStack Query
    const retryMutation = useMutation({
        mutationFn: async () => {
            const response = await retryTranslation({ translationId: translation.id ?? '' });
            if (response?.error || !response) {
                throw new Error(response?.message || 'Failed to retry translation');
            }
            return response;
        },
        onSuccess: (data) => {
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['translation-review', translation.id] });
            queryClient.invalidateQueries({ queryKey: ['translation-detail', translation.id] });

            toast.success(data.message ?? 'Retry Started', {
                description: 'The translation is being processed again.',
            });
        },
        onError: (error: Error) => {
            toast.error('Retry Failed', {
                description: error.message || 'An error occurred while retrying the translation.',
            });
        },
    });

    const isRetrying = retryMutation.isPending;

    return (
        <main className="relative flex min-h-[calc(100vh-3.8125rem)] w-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
                <Link href={`/app/translations/${translation.id}`}>
                    <Button className="gap-2" color="primary" variant="soft">
                        <ArrowLeftIcon className="size-4" />
                        Back
                    </Button>
                </Link>
            </div>

            {/* Main Content - centered with max-width */}
            <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
                <div className="flex w-full max-w-xl flex-col items-center gap-6">
                    {/* Hero Section */}
                    <div className="flex flex-col items-center text-center">
                        {/* Static Icon - NO spinner */}
                        <div className="bg-destructive-100 dark:bg-destructive-900/30 mb-6 flex size-16 items-center justify-center rounded-full">
                            <StatusIcon
                                className="text-destructive-600 dark:text-destructive-400 size-8"
                                weight="duotone"
                            />
                        </div>

                        {/* Headline */}
                        <h1 className="text-surface-900 dark:text-surface-100 text-2xl font-bold tracking-tight sm:text-3xl">
                            {isCanceled ? 'Translation Canceled' : 'Translation Failed'}
                        </h1>

                        {/* Description */}
                        <p className="text-surface-500 mt-2 max-w-md text-base">
                            {statusDetails.tooltipContent}
                        </p>

                        {/* Document name */}
                        <p className="text-surface-400 mt-3 text-sm break-all max-w-full">{displayName}</p>
                    </div>

                    {/* Language Pair Card */}
                    <DefaultCard className="w-full p-4">
                        <span className="text-surface-500 text-xs font-medium uppercase tracking-wider mb-3 block">
                            Language Pair
                        </span>
                        <div className="flex items-center justify-center gap-3">
                            {/* Source Language */}
                            <div className="flex items-center gap-2">
                                <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-100 dark:bg-surface-800">
                                    {sourceLang.isAuto ? (
                                        <GlobeIcon className="size-4 text-surface-500" weight="duotone" />
                                    ) : SourceFlag ? (
                                        <SourceFlag className="size-5 rounded" />
                                    ) : (
                                        <GlobeIcon className="size-4 text-surface-500" weight="duotone" />
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-medium text-surface-400 uppercase">
                                        From
                                    </span>
                                    <span className="text-sm font-semibold text-surface-900 dark:text-surface-100">
                                        {sourceLang.name}
                                    </span>
                                </div>
                            </div>

                            {/* Arrow */}
                            <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800">
                                <ArrowRightIcon className="size-3 text-surface-400" />
                            </div>

                            {/* Target Language */}
                            <div className="flex items-center gap-2">
                                <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-100 dark:bg-surface-800">
                                    {TargetFlag ? (
                                        <TargetFlag className="size-5 rounded" />
                                    ) : (
                                        <TranslateIcon className="size-4 text-surface-500" weight="duotone" />
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-medium text-surface-400 uppercase">
                                        To
                                    </span>
                                    <span className="text-sm font-semibold text-surface-900 dark:text-surface-100">
                                        {targetLang.name}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </DefaultCard>

                    {/* Error Details Card */}
                    <DefaultCard className="bg-destructive-50 dark:bg-destructive-950/30 border-destructive-200 dark:border-destructive-800/50 w-full p-0">
                        <div className="border-destructive-200 dark:border-destructive-800/50 flex items-center gap-3 border-b px-5 py-3">
                            <StatusIcon
                                className="text-destructive-600 dark:text-destructive-400 size-5 shrink-0"
                                weight="duotone"
                            />
                            <span className="text-destructive-800 dark:text-destructive-200 text-sm font-semibold">
                                {isCanceled ? 'What happened' : 'Error Details'}
                            </span>
                        </div>
                        <div className="px-5 py-4">
                            <p className="text-destructive-700 dark:text-destructive-300 text-sm">
                                {isCanceled
                                    ? 'This translation was manually canceled before completion. No credits were charged for this document.'
                                    : 'The translation pipeline encountered an error. This could be due to an unsupported document format, an intermittent service issue, or content that could not be processed.'}
                            </p>
                            {!isCanceled && (
                                <p className="text-destructive-600 dark:text-destructive-400 mt-2 text-xs">
                                    You can retry the translation. If the problem persists, please contact
                                    support.
                                </p>
                            )}
                        </div>
                    </DefaultCard>

                    {/* Action Buttons */}
                    <div className="mt-4 flex w-full flex-wrap items-center justify-center gap-3">
                        <Button
                            asChild
                            color="primary"
                            variant="soft"
                            shape="pill"
                            size="lg"
                            className="flex-1"
                        >
                            <Link href={`/app/translations/${translation.id}`}>
                                <ArrowLeftIcon className="size-5" weight="bold" />
                                <span className="font-semibold">Back to Details</span>
                            </Link>
                        </Button>

                        {!isCanceled && (
                            <Button
                                color="primary"
                                variant="solid"
                                shape="pill"
                                size="lg"
                                className="flex-1"
                                onClick={() => retryMutation.mutate()}
                                disabled={isRetrying}
                                loading={isRetrying}
                            >
                                <ArrowCounterClockwiseIcon
                                    className={cn('size-5', isRetrying && 'hidden')}
                                    weight="bold"
                                />
                                <span className="font-semibold">
                                    {isRetrying ? 'Retrying...' : 'Retry Translation'}
                                </span>
                            </Button>
                        )}

                        {isCanceled && (
                            <Button
                                asChild
                                color="primary"
                                variant="solid"
                                shape="pill"
                                size="lg"
                                className="flex-1"
                            >
                                <Link href="/app/translations/new">
                                    <FilePlusIcon className="size-5" weight="duotone" />
                                    <span className="font-semibold">New Translation</span>
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
