/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { ArrowCounterClockwiseIcon, CloudWarningIcon } from '@phosphor-icons/react';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { TableCell, TableRow } from '@/src/components/ui/table';
import { ERROR_STATE_IMAGES } from '@/src/constants/images';
import { Skeleton } from '@components/ui/skeleton';
import type { CustomerRow } from '@/src/schemas/customer-schemas';
import type { PaginatedResponse } from '@/types/rest/common';
import type { ApiResponseOrError } from '@/types/rest/response';
import type { ColumnDef, Table as TanstackTable } from '@tanstack/react-table';
import type { StaticImageData } from 'next/image';

type CustomersErrorRowProps = {
    tableInstance?: TanstackTable<CustomerRow>;
    showImage?: boolean;
    columns: ColumnDef<CustomerRow>[];
    refetch: () => void;
    error: ApiResponseOrError<PaginatedResponse<CustomerRow>> | null;
};

const CustomersErrorRow: React.FC<CustomersErrorRowProps> = React.memo(
    ({ columns, error, refetch, showImage = true }: CustomersErrorRowProps) => {
        const [isLoading, setIsLoading] = useState<boolean>(true);
        const [imageSource, setImageSource] = useState<StaticImageData>(ERROR_STATE_IMAGES[0]);
        const [headline, setHeadline] = useState<string>('Something Went Wrong!');
        const [description, setDescription] = useState<string>(
            "We're unable to load the data at the moment. Please try again.",
        );

        useEffect(() => {
            setIsLoading(true);

            const randomImage = ERROR_STATE_IMAGES[Math.floor(Math.random() * ERROR_STATE_IMAGES.length)];

            setImageSource(randomImage);
            setHeadline(error?.title ?? error?.message.replace(/\.$/, '') ?? 'Something Went Wrong!');
            setDescription(
                error?.description ?? "We're unable to load the data at the moment. Please try again.",
            );

            setIsLoading(false);
        }, [error]);

        return (
            <TableRow className="cursor-auto hover:cursor-auto focus:cursor-auto active:cursor-auto">
                <TableCell className="h-auto w-full py-12 text-center" colSpan={columns.length}>
                    <div className="flex flex-col items-center justify-center gap-4">
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
                                {showImage && (
                                    <Image
                                        priority
                                        alt="Error Image"
                                        blurDataURL={imageSource.src}
                                        className="pointer-events-none mx-auto mb-8 aspect-square size-64 select-none md:size-80 lg:size-96"
                                        draggable={false}
                                        height={256}
                                        placeholder="blur"
                                        src={imageSource}
                                        width={256}
                                    />
                                )}
                                <div className="flex flex-col items-center justify-center gap-4">
                                    {!showImage && (
                                        <div className="bg-primary-100 dark:bg-primary-900 mb-3 flex size-16 items-center justify-center rounded-full">
                                            <CloudWarningIcon
                                                className="text-destructive-500 dark:text-destructive-400 size-8"
                                                weight="duotone"
                                            />
                                        </div>
                                    )}
                                    <h3 className="text-surface-900 text-center text-xl leading-tight font-bold tracking-tight md:text-2xl dark:text-white">
                                        {headline}
                                    </h3>
                                    <p className="text-surface-600 dark:text-surface-400 text-center text-sm font-medium md:text-base">
                                        {description}
                                    </p>
                                    <Button
                                        color="primary"
                                        shape="rounded"
                                        size="lg"
                                        type="button"
                                        variant="solid"
                                        onClick={refetch}
                                    >
                                        <ArrowCounterClockwiseIcon
                                            className="size-5"
                                            color="currentColor"
                                            weight="duotone"
                                        />
                                        <span>Try Again</span>
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </TableCell>
            </TableRow>
        );
    },
);

CustomersErrorRow.displayName = 'CustomersErrorRow';

export default CustomersErrorRow;
