/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { BackspaceIcon, EmptyIcon, UserPlusIcon } from '@phosphor-icons/react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { TableCell, TableRow } from '@/src/components/ui/table';
import { EMPTY_QUERIED_TABLE_IMAGES, EMPTY_TABLE_IMAGES } from '@/src/constants/images';
import { Button } from '@components/ui/button';
import { Skeleton } from '@components/ui/skeleton';
import type { CustomerRow } from '@/src/schemas/customer-schemas';
import type { CustomersTableMetaType } from '@/types/core/tanstack';
import type { ColumnDef, Table as TanstackTable } from '@tanstack/react-table';
import type { StaticImageData } from 'next/image';

type CustomersEmptyRowProps = {
    tableInstance: TanstackTable<CustomerRow>;
    columns: ColumnDef<CustomerRow>[];
    showImage?: boolean;
};

const CustomersEmptyRow: React.FC<CustomersEmptyRowProps> = React.memo(
    ({ columns, showImage = true, tableInstance }: CustomersEmptyRowProps) => {
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
            const randomQueriedStateImage =
                EMPTY_QUERIED_TABLE_IMAGES[Math.floor(Math.random() * EMPTY_QUERIED_TABLE_IMAGES.length)];

            // Priority for the global filter.
            if (tableInstance.getState().globalFilter) {
                setImageSource(randomQueriedStateImage);
                setHeadline(`No customers match your search for "${tableInstance.getState().globalFilter}".`);
                setDescription('Try refining your search or clearing the filter to view all customers.');
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
                setHeadline('No customers added yet.');
                setDescription(
                    "You haven't added any customers to your list. Once you do, they will appear here.",
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
                        <UserPlusIcon className="mr-2 size-5" color="currentColor" weight="duotone" />
                        <span className="hidden font-bold md:block">Add Customer</span>
                    </Button>,
                );
            }
            setIsLoading(false);
        }, [pathname, tableInstance]);

        return (
            <TableRow>
                <TableCell colSpan={columns.length}>
                    <div className="mx-auto flex h-auto flex-col items-center justify-center gap-2 py-12 text-center">
                        <div className="h-auto w-full flex-col items-center justify-center py-12 text-center">
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
                </TableCell>
            </TableRow>
        );
    },
);

CustomersEmptyRow.displayName = 'CustomersEmptyRow';

export default CustomersEmptyRow;
