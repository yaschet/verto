/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

// ? Importing the Image component from next/image.
import { FolderOpenIcon } from '@phosphor-icons/react';
import Image from 'next/image';
import { Fragment } from 'react';
import { EMPTY_TABLE_IMAGES } from '@/constants/images';
import { SectionTitle } from '@/src/app/(protected)/app/components/common';
import { Skeleton } from '@components/ui/skeleton';

export function TemplatesEmpty({ isLoading }: { isLoading?: boolean }) {
    const imageSource = EMPTY_TABLE_IMAGES[Math.floor(Math.random() * EMPTY_TABLE_IMAGES.length)];

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
                                    alt="No Translations Found"
                                    className="mb-8 aspect-square size-64 md:size-80 lg:size-96"
                                    height={250}
                                    src={imageSource}
                                    width={250}
                                />
                                <div className="flex max-w-md flex-col items-center justify-center gap-4">
                                    <div className="flex flex-col items-center justify-center gap-4">
                                        <h1 className="text-surface-900 dark:text-surface-100 text-2xl font-black tracking-tighter sm:text-2xl">
                                            No Templates Available
                                        </h1>
                                        <p className="text-surface-600 dark:text-surface-500 text-sm leading-7">
                                            It looks like we don't have any templates at the moment, this
                                            could be due to a service issue, or we are currently updating our
                                            templates.
                                            <br />
                                            Please check back later or try refreshing the page. Need help?{' '}
                                            <br />
                                            <a className="text-blue-500 underline" href="/support">
                                                Contact Support
                                            </a>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Fragment>
    );
}
