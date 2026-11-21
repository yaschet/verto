/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import {
    ArrowLeftIcon,
    FileTextIcon,
    FilePlusIcon,
    WarningIcon,
    WarningCircleIcon,
} from '@phosphor-icons/react';
import Link from 'next/link';
import { Button } from '@components/ui/button';
import { DefaultCard } from '@components/ui/card';
import { cn } from '@library/utils';
import type { TranslationRow } from '@schemas/translation-schemas';

type TranslationErrorStateProps = {
    translation: TranslationRow;
    hasPdfError: boolean;
    hasTranslationError: boolean;
};

/**
 * Translation Error State
 *
 * Premium error/incomplete state for the Review page when translation
 * data is missing or corrupted.
 *
 * Shows specific errors, recovery steps, and clear CTAs.
 * Design inspired by checkout canceled page.
 */
export function TranslationErrorState({
    translation,
    hasPdfError,
    hasTranslationError,
}: TranslationErrorStateProps) {
    const displayName = translation.display_name || 'Untitled Document';

    // Determine error messages
    const errorMessages: { title: string; description: string }[] = [];

    if (hasPdfError) {
        errorMessages.push({
            title: 'Original document not found',
            description: 'The PDF file could not be located in storage. It may have been deleted or moved.',
        });
    }

    if (hasTranslationError) {
        errorMessages.push({
            title: 'Translation content missing',
            description:
                'The translated content could not be loaded. The translation pipeline may not have completed.',
        });
    }

    return (
        <main className="relative flex min-h-[calc(100vh-3.8125rem)] w-full flex-col">
            {/* Header - Same pattern as Details page */}
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
                <Link href={`/app/translations/${translation.id}`}>
                    <Button className="gap-2" color="primary" variant="soft">
                        <ArrowLeftIcon className="size-4" />
                        Back
                    </Button>
                </Link>
            </div>

            {/* Main Content */}
            <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
                <div className="flex w-full max-w-xl flex-col items-center text-center">
                    {/* WarningIcon Icon Container */}
                    <div className="bg-warning-100 dark:bg-warning-900 mb-6 flex size-16 items-center justify-center rounded-full">
                        <WarningCircleIcon
                            className="text-warning-600 dark:text-warning-400 size-8"
                            weight="duotone"
                        />
                    </div>

                    {/* Headline */}
                    <h1
                        className={cn(
                            'text-surface-900 dark:text-surface-100 text-2xl font-black tracking-tight sm:text-3xl',
                            'text-pretty',
                        )}
                    >
                        Translation Incomplete
                    </h1>

                    {/* Description */}
                    <p className="text-surface-600 dark:text-surface-400 mt-3 max-w-md text-base break-words">
                        <span className="font-medium break-all">"{displayName}"</span> couldn't be fully
                        loaded for review.
                    </p>

                    {/* Error Details Card */}
                    <DefaultCard className="bg-warning-50 dark:bg-warning-950/30 border-warning-200 dark:border-warning-800/50 mt-8 w-full p-0">
                        <div className="border-warning-200 dark:border-warning-800/50 flex items-center gap-3 border-b px-5 py-3">
                            <WarningIcon
                                className="text-warning-600 dark:text-warning-400 size-5 shrink-0"
                                weight="duotone"
                            />
                            <span className="text-warning-800 dark:text-warning-200 text-sm font-semibold">
                                What happened
                            </span>
                        </div>
                        <div className="space-y-3 px-5 py-4">
                            {errorMessages.map((error, index) => (
                                <div key={index} className="flex items-start gap-3">
                                    <div className="bg-warning-200 dark:bg-warning-800 mt-1 size-1.5 shrink-0 rounded-full" />
                                    <div className="text-left">
                                        <p className="text-warning-800 dark:text-warning-200 text-sm font-medium">
                                            {error.title}
                                        </p>
                                        <p className="text-warning-600 dark:text-warning-400 mt-0.5 text-xs">
                                            {error.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </DefaultCard>

                    {/* Recovery Steps Card */}
                    <DefaultCard className="bg-surface-50 dark:bg-surface-900/50 mt-4 w-full border-0 p-0 shadow-none">
                        <div className="border-surface-200 dark:border-surface-800 flex items-center gap-3 border-b px-5 py-3">
                            <FileTextIcon className="text-surface-500 size-5 shrink-0" weight="duotone" />
                            <span className="text-surface-700 dark:text-surface-300 text-sm font-semibold">
                                What you can do
                            </span>
                        </div>
                        <div className="space-y-3 px-5 py-4">
                            <div className="flex items-start gap-3">
                                <span className="bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                                    1
                                </span>
                                <div className="text-left">
                                    <p className="text-surface-700 dark:text-surface-300 text-sm font-medium">
                                        Go back to translation details
                                    </p>
                                    <p className="text-surface-500 dark:text-surface-500 mt-0.5 text-xs">
                                        Check the status and try retrying the translation from there.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                                    2
                                </span>
                                <div className="text-left">
                                    <p className="text-surface-700 dark:text-surface-300 text-sm font-medium">
                                        Upload the document again
                                    </p>
                                    <p className="text-surface-500 dark:text-surface-500 mt-0.5 text-xs">
                                        Create a new translation with a fresh upload.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </DefaultCard>

                    {/* Action Buttons */}
                    <div className="mt-10 flex w-full flex-wrap items-center justify-center gap-3">
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
                    </div>
                </div>
            </div>
        </main>
    );
}
