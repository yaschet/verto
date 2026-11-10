/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { EmptyIcon, UploadIcon, UserPlusIcon } from '@phosphor-icons/react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@components/ui/button';
import { Skeleton } from '@components/ui/skeleton';
import addDocumentImage from '@public/illustrations/document.svg';
import addFilesImage from '@public/illustrations/document.svg';
import addNotesStateImage from '@public/illustrations/document.svg';
import adventureImage from '@public/illustrations/document.svg';
import bookReadingImage from '@public/illustrations/document.svg';
import cloudDocsImage from '@public/illustrations/document.svg';
import dreamerImage from '@public/illustrations/document.svg';
import emptyImage from '@public/illustrations/document.svg';
import filingSystemImage from '@public/illustrations/document.svg';
import folderImage from '@public/illustrations/document.svg';
import myDocumentsImage from '@public/illustrations/document.svg';
import noDataImage from '@public/illustrations/document.svg';
import notFoundImage from '@public/illustrations/document.svg';
import personalDocumentsImage from '@public/illustrations/document.svg';
import polaroidImage from '@public/illustrations/document.svg';
import searchingImage from '@public/illustrations/document.svg';
import starryWindowImage from '@public/illustrations/document.svg';
import voidImage from '@public/illustrations/document.svg';
import welcomeImage from '@public/illustrations/document.svg';
import workingLateImage from '@public/illustrations/document.svg';
import type { CustomersTableMetaType } from '@/types/core/tanstack';
import type { ColumnDef, Table as TanstackTable } from '@tanstack/react-table';
import type { ReactNode } from 'react';

type CustomersEmptyRowProps<TData, TValue> = {
    tableInstance: TanstackTable<TData>;
    showImage?: boolean;
    columns?: ColumnDef<TData, TValue>[];
};

// ? Random Image to Display:
const queriedStateImages = [emptyImage, noDataImage, notFoundImage, searchingImage, voidImage];
const emptyStateImages = [
    // * EmptyIcon States - do not contain images from the queriedStateImages array.
    addDocumentImage,
    addFilesImage,
    addNotesStateImage,
    adventureImage,
    bookReadingImage,
    cloudDocsImage,
    dreamerImage,
    filingSystemImage,
    folderImage,
    myDocumentsImage,
    personalDocumentsImage,
    polaroidImage,
    starryWindowImage,
    welcomeImage,
    workingLateImage,
];

const randomQueriedStateImage = queriedStateImages[Math.floor(Math.random() * queriedStateImages.length)];

let randomEmptyStateImage = emptyStateImages[Math.floor(Math.random() * emptyStateImages.length)];

function EmptyStateDisplay<TData, TValue>({
    showImage,
    tableInstance,
}: CustomersEmptyRowProps<TData, TValue>) {
    // ? Determine whether there is a global filter or not.
    // If there is a global filter, display the no translations found with the query message.
    // Else, display the no translations found message.
    const isGlobalFilter = tableInstance.getState().globalFilter;

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [imageSource, setImageSource] = useState<typeof addNotesStateImage>(addNotesStateImage);
    const [headline, setHeadline] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [ButtonComponent, setButtonComponent] = useState<ReactNode>(null);

    const pathname = usePathname();

    useEffect(() => {
        setIsLoading(true);

        // Priority for the global filter.
        if (isGlobalFilter) {
            setImageSource(randomQueriedStateImage);
            setHeadline(`No Translations Found with the query "${tableInstance.getState().globalFilter}"!`);
            setDescription(
                'Please try a different search query. \nTranslations you process will appear here.',
            );
            setButtonComponent(null);
        }
        // * Customers Page.
        else if (pathname === '/app/customers') {
            setImageSource(randomEmptyStateImage);
            setHeadline('No Customers Found!');
            setDescription(
                "It seems like you haven't added any customers yet. \nCustomers you add will appear here.",
            );
            setButtonComponent(
                <Button
                    className="flex items-center justify-center"
                    color="default"
                    size="lg"
                    variant="solid"
                    onClick={() => {
                        const meta = tableInstance.options?.meta as CustomersTableMetaType;

                        meta?.triggerCustomerAddition?.();
                    }}
                >
                    <UserPlusIcon className="size-5" color="currentColor" weight="duotone" />
                    <span className="hidden font-bold md:block">Add Customer</span>
                </Button>,
            );
        }
        // * History Page.
        else if (pathname === '/app/translations') {
            setImageSource(randomEmptyStateImage);
            setHeadline('No Translations Found!');
            setDescription(
                "It seems like you haven't translated any documents yet. \nTranslations you process will appear here.",
            );
            setButtonComponent(
                <Button
                    asChild
                    className="flex items-center justify-center font-bold"
                    color="default"
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
        // * Default.
        else {
            randomEmptyStateImage = emptyStateImages[Math.floor(Math.random() * emptyStateImages.length)];

            setImageSource(randomEmptyStateImage);
            setHeadline('No Translations Found!');
            setDescription(
                "It seems like you haven't translated any documents yet. \nTranslations you process will appear here.",
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
    }, [pathname, isGlobalFilter, tableInstance]);

    return (
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
                        {showImage !== false && (
                            <Image
                                alt="No Translations Found"
                                className="mb-8 aspect-square size-64 md:size-80 lg:size-96"
                                height={250}
                                src={imageSource}
                                width={250}
                            />
                        )}
                        <div className="flex flex-col items-center justify-center gap-4">
                            <div className="mb-5 flex flex-col items-center justify-center gap-3">
                                {showImage === false && (
                                    <div className="bg-primary-100 dark:bg-primary-900 mb-3 flex size-16 items-center justify-center rounded-full">
                                        <EmptyIcon
                                            className="text-primary-500 dark:text-primary-400 size-8"
                                            weight="duotone"
                                        />
                                    </div>
                                )}
                                <h1 className="text-surface-900 dark:text-surface-100 text-2xl font-black tracking-tighter sm:text-2xl">
                                    {headline}
                                </h1>
                                <p className="text-surface-600 dark:text-surface-500 text-sm leading-7">
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
}

export { EmptyStateDisplay };
