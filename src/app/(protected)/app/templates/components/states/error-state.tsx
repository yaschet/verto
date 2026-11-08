/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

// ? Importing the Image component from next/image.
import { ArrowsCounterClockwiseIcon, CloudIcon, FolderOpenIcon } from '@phosphor-icons/react';
import Image from 'next/image';
import { Fragment } from 'react';
import { titleCase } from 'title-case';
import { SectionTitle } from '@/src/app/(protected)/app/components/common';
import { Button } from '@components/ui/button';
import { Skeleton } from '@components/ui/skeleton';
import cloudDocsImage from '@public/illustrations/document.svg';
import filingSystemImage from '@public/illustrations/document.svg';
import folderImage from '@public/illustrations/document.svg';
import myDocumentsImage from '@public/illustrations/document.svg';
import personalDocumentsImage from '@public/illustrations/document.svg';
import workingLateImage from '@public/illustrations/document.svg';
import type { Tables } from '@/types/database/database';
import type { ApiErrorType } from '@/types/rest/errors';
import type { QueryObserverResult, RefetchOptions } from '@tanstack/react-query';

const errorStateImages = [
    // * Empty States - do not contain images from the queriedStateImages array.
    cloudDocsImage,
    filingSystemImage,
    folderImage,
    myDocumentsImage,
    personalDocumentsImage,
    workingLateImage,
];

const randomErrorStateImage = errorStateImages[Math.floor(Math.random() * errorStateImages.length)];

export function TemplatesError({
    error = null,
    isLoading,
    refetch,
    showImage = true,
}: {
    isLoading?: boolean;
    refetch?: (options?: RefetchOptions) => Promise<
        QueryObserverResult<
            | {
                  templates: Tables<'templates'>[];
                  templates_collections: Tables<'templates_collections'>[];
              }
            | undefined,
            ApiErrorType
        >
    >;
    showImage?: boolean;
    error: ApiErrorType | null;
}) {
    const imageSource = randomErrorStateImage;

    const ErrorMessage = (
        <div className="mb-5 flex w-full flex-col items-center justify-center gap-3">
            {!showImage && (
                <div className="bg-primary-100 dark:bg-primary-900 mb-3 flex size-16 items-center justify-center rounded-full">
                    <CloudIcon
                        className="text-destructive-500 dark:text-destructive-400 size-8"
                        weight="duotone"
                    />
                </div>
            )}
            <h3 className="text-surface-900 text-center text-xl leading-tight font-bold tracking-tight md:text-2xl dark:text-white">
                {titleCase(
                    error?.title ?? error?.message?.replace(/\.$/, '') ?? 'Oops, something went wrong!',
                )}
            </h3>
            <p className="text-surface-600 dark:text-surface-400 text-center text-sm font-medium md:text-base">
                {error?.description ?? "We're unable to load the data at the moment. Please try again."}
            </p>
        </div>
    );

    return (
        <Fragment>
            {/* 4 cards - Grid for statistics */}
            <div className="flex w-full max-w-full flex-col items-start justify-start gap-6">
                {/* Title of the Section */}
                <SectionTitle icon={FolderOpenIcon} title="Templates" />
                {/* Cards */}
                <div className="mx-auto flex h-auto flex-col items-center justify-center gap-2 py-12 text-center">
                    <div className="h-auto w-full py-12 text-center">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center gap-4">
                                <Skeleton className="size-24 max-w-sm" />
                                <Skeleton className="mt-2 h-6 w-40 max-w-sm" />
                                <Skeleton className="h-4 w-60 max-w-sm" />
                                <Skeleton className="h-4 w-80 max-w-sm" />
                                <Skeleton className="mt-2 h-12 w-60 max-w-sm" />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center gap-4">
                                <Image
                                    priority
                                    alt="No Translations Found"
                                    blurDataURL={imageSource.src}
                                    className="pointer-events-none mb-8 aspect-square size-64 select-none md:size-80 lg:size-96"
                                    draggable={false}
                                    height={250}
                                    placeholder="blur"
                                    src={imageSource}
                                    width={250}
                                />
                                <div className="flex flex-col items-center justify-center gap-4">
                                    {ErrorMessage}

                                    <Button
                                        className="flex items-center justify-center font-extrabold"
                                        color="primary"
                                        shape="rounded"
                                        size="lg"
                                        variant="solid"
                                        onClick={() => refetch && refetch()}
                                    >
                                        <ArrowsCounterClockwiseIcon
                                            className="size-5 opacity-75"
                                            color="currentColor"
                                            weight="duotone"
                                        />
                                        Try Again
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Fragment>
    );
}
