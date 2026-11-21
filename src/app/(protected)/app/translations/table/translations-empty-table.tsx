/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { BackspaceIcon, EmptyIcon, UploadIcon } from '@phosphor-icons/react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { EMPTY_TABLE_IMAGES } from '@/src/constants/images';
import { Button } from '@components/ui/button';
import { Skeleton } from '@components/ui/skeleton';
import type { TranslationRow } from '@/src/schemas/translation-schemas';
import type { ColumnDef, Table as TanstackTable } from '@tanstack/react-table';
import type { StaticImageData } from 'next/image';

type CustomersEmptyRowProps<TData, TValue> = {
    tableInstance: TanstackTable<TData>;
    showImage?: boolean;
    columns?: ColumnDef<TData, TValue>[];
};

const TranslationsEmptyTable: React.FC<CustomersEmptyRowProps<TranslationRow, unknown>> = React.memo(
    ({
        showImage = true,
        tableInstance,
    }: {
        tableInstance: TanstackTable<TranslationRow>;
        showImage?: boolean;
    }) => {
        const [isLoading, setIsLoading] = useState<boolean>(true);
        const [imageSource, setImageSource] = useState<StaticImageData>(EMPTY_TABLE_IMAGES[0]);
        const [headline, setHeadline] = useState<string>('');
        const [description, setDescription] = useState<string>('');
        const [ButtonComponent, setButtonComponent] = useState<React.ReactNode>(null);

        const pathname = usePathname();

        useEffect(() => {
            setIsLoading(true);

            const randomEmptyStateImage =
                EMPTY_TABLE_IMAGES[Math.floor(Math.random() * EMPTY_TABLE_IMAGES.length)];

            // Priority for the global filter.
            if (tableInstance.getState().globalFilter) {
                setImageSource(randomEmptyStateImage);
                setHeadline(
                    `No Translations Found with the query "${tableInstance.getState().globalFilter}"!`,
                );
                setDescription(
                    'Please try a different search query. \nTranslations you process will appear here.',
                );
                setButtonComponent(
                    <Button
                        className="flex items-center justify-center"
                        color="default"
                        size="lg"
                        variant="solid"
                        onClick={() => {
                            tableInstance.setGlobalFilter('');
                        }}
                    >
                        <BackspaceIcon className="size-5" color="currentColor" weight="duotone" />
                        Clear Search
                    </Button>,
                );
            } else {
                setImageSource(randomEmptyStateImage);
                setHeadline('No Translations Found!');
                setDescription(
                    "It seems like you haven't translated any documents yet. Translations you process will appear here.",
                );
                setButtonComponent(
                    <Button
                        asChild
                        className="flex items-center justify-center font-bold"
                        color="primary"
                        shape="pill"
                        size="lg"
                        variant="solid"
                    >
                        <Link href="/app/translations/new">
                            <UploadIcon className="mr-2 size-5" color="currentColor" weight="duotone" />
                            <span>Create Translation</span>
                        </Link>
                    </Button>,
                );
            }
            setIsLoading(false);
        }, [pathname, tableInstance]);

        return (
            <div className="mx-auto flex h-auto flex-col items-center justify-center gap-2 py-12 text-center">
                <div className="h-auto w-full py-12 text-center">
                    {isLoading ? (
                        <div className="mx-auto flex flex-col items-center justify-center gap-4">
                            <Skeleton className="size-24 max-w-sm" />
                            <Skeleton className="mt-2 h-6 w-40 max-w-sm" />
                            <Skeleton className="h-4 w-60 max-w-sm" />
                            <Skeleton className="h-4 w-80 max-w-sm" />
                            <Skeleton className="mt-2 h-12 w-60 max-w-sm" />
                        </div>
                    ) : (
                        <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-4">
                            {showImage && (
                                <Image
                                    alt="No Customers Found"
                                    className="mb-8 aspect-square size-64 max-w-full md:size-80 lg:size-96"
                                    height={250}
                                    src={imageSource}
                                    width={250}
                                />
                            )}
                            <div className="flex flex-col items-center justify-center gap-4">
                                <div className="mb-5 flex flex-col items-center justify-center gap-3">
                                    {!showImage && (
                                        <div className="bg-primary-100 dark:bg-primary-900 mb-3 flex size-16 items-center justify-center rounded-full">
                                            <EmptyIcon
                                                className="text-primary-500 dark:text-primary-400 size-8"
                                                weight="duotone"
                                            />
                                        </div>
                                    )}
                                    <h1 className="text-surface-900 dark:text-surface-100 text-2xl font-black tracking-tighter sm:text-3xl">
                                        {headline}
                                    </h1>
                                    <p className="text-surface-600 dark:text-surface-500 text-base leading-7 font-medium">
                                        {description}
                                    </p>
                                </div>
                                {ButtonComponent && (
                                    <div className="flex items-center justify-center gap-2">
                                        {ButtonComponent}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    },
);

TranslationsEmptyTable.displayName = 'TranslationsEmptyTable';

export default TranslationsEmptyTable;
