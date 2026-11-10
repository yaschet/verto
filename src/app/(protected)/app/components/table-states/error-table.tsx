/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

// Error State Table Component:

// ? Importing the SVGs - Taking Care of the Error Illustration Component.
import { ArrowCounterClockwiseIcon, CloudWarningIcon } from '@phosphor-icons/react';
import Image from 'next/image';
import { titleCase } from 'title-case';
import { Button } from '@components/ui/button';
import { TableCell, TableRow } from '@components/ui/table';
import bugFixingImage from '@public/illustrations/document.svg';
import engineersImage from '@public/illustrations/document.svg';
import serverDownImage from '@public/illustrations/document.svg';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';
import type { ColumnDef, Table as TanstackTable } from '@tanstack/react-table';

type ErrorStateTableProps<TData, TValue> = {
    tableInstance?: TanstackTable<TData>;
    columns: ColumnDef<TData, TValue>[];
    showImage?: boolean;
    refetch: () => void;
    error?: ApiResponseOrError | ApiErrorType | null;
};

function ErrorStateDisplay<TData, TValue>({
    columns,
    error,
    refetch,
    showImage = true,
}: ErrorStateTableProps<TData, TValue>) {
    const ErrorMessage = (
        <div className="mb-5 flex w-full flex-col items-center justify-center gap-3">
            {!showImage && (
                <div className="bg-primary-100 dark:bg-primary-900 mb-3 flex size-16 items-center justify-center rounded-full">
                    <CloudWarningIcon
                        className="text-destructive-500 dark:text-destructive-400 size-8"
                        weight="duotone"
                    />
                </div>
            )}
            <h3 className="text-surface-900 text-center text-xl leading-tight font-bold tracking-tight md:text-2xl dark:text-white">
                {titleCase(
                    error?.title ?? error?.message.replace(/\.$/, '') ?? 'Oops, something went wrong!',
                )}
            </h3>
            <p className="text-surface-600 dark:text-surface-400 text-center text-sm font-medium md:text-base">
                {error?.description ?? "We're unable to load the data at the moment. Please try again."}
            </p>
        </div>
    );

    // Random Image to Display:
    const images = [bugFixingImage, engineersImage, serverDownImage];

    const chosenImage = images[Math.floor(Math.random() * images.length)];

    return (
        <TableRow className="cursor-auto hover:cursor-auto focus:cursor-auto active:cursor-auto">
            <TableCell className="h-auto w-full py-12 text-center" colSpan={columns.length}>
                <div className="flex flex-col items-center justify-center gap-4">
                    {showImage !== false && (
                        <Image
                            priority
                            alt="No Translations Found"
                            blurDataURL={chosenImage.src}
                            className="pointer-events-none mx-auto mb-8 aspect-square size-64 select-none md:size-80 lg:size-96"
                            draggable={false}
                            height={256}
                            placeholder="blur"
                            src={chosenImage}
                            width={256}
                        />
                    )}
                    <div className="flex flex-col items-center justify-center gap-4">
                        {ErrorMessage}

                        {/* Button to ArrowsCounterClockwise the Data or Try Again */}
                        <Button
                            color="primary"
                            shape="rounded"
                            size="lg"
                            type="button"
                            variant="solid"
                            onClick={() => {
                                refetch();
                            }}
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
            </TableCell>
        </TableRow>
    );
}

export { ErrorStateDisplay };
