/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

// ! History Data Table ...
import type { TranslationRow } from '@/schemas/translation-schemas';
import { MagnifyingGlassIcon } from '@phosphor-icons/react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Fragment } from 'react';
import { TRANSLATION_COLUMNS } from '@/src/app/(protected)/app/translations/table/translations-columns';
import { Skeleton } from '@components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import type { ColumnDef, Table as TanstackTable } from '@tanstack/react-table';

function LoadingStateTable<TData = TranslationRow, TValue = unknown>({
    canSearch = true,
    columns = TRANSLATION_COLUMNS as unknown as ColumnDef<TData, TValue>[],
    fullUiLoading = false,
    limit = 10,
}: {
    columns?: ColumnDef<TData, TValue>[];
    limit?: number;
    fullUiLoading?: boolean;
    canSearch?: boolean;
}) {
    const table = useReactTable({
        // ! Older Configuration for the table:
        // * We were using client-side pagination, but we switched to server-side pagination.
        columns,
        data: [],
        enableColumnFilters: false,
        enableGlobalFilter: canSearch,
        enableHiding: false,
        enableMultiRemove: false,
        enableMultiRowSelection: false,
        enableMultiSort: false,
        enableRowSelection: false,
        enableSorting: false,
        enableSubRowSelection: false,
        getCoreRowModel: getCoreRowModel(),
        state: {
            pagination: {
                pageIndex: 0,
                pageSize: limit ?? 5,
            },
        },
    });

    return (
        <div className="mb-3 flex h-auto w-full flex-col">
            {/* Table Actions, Mainly the ability to search the table, and if there are selected rows, we can display a Delete Button. */}

            {canSearch && (
                <div className="flex h-16 w-full items-center justify-between px-0">
                    <div className="relative flex size-full max-w-full flex-1 flex-row items-center justify-start">
                        <div className="relative flex size-full max-w-full flex-row items-center justify-start">
                            <MagnifyingGlassIcon
                                className="text-surface-300 dark:text-surface-700 relative inset-y-0 left-0 ml-2 size-6"
                                color="currentColor"
                                weight="regular"
                            />

                            {/* Input */}
                            <input
                                className="text-surface-500 dark:text-surface-400 absolute inset-0 flex h-full w-auto max-w-full flex-1 flex-row items-center justify-start border-none bg-transparent pl-12 ring-0 ring-transparent outline-none focus:border-transparent focus:ring-0 focus:outline-none"
                                placeholder="Search records..."
                                type="text"
                                value={table.getState().globalFilter || ''}
                                onChange={(event) => table.setGlobalFilter(event.target.value)}
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className="w-full rounded-xl">
                <Table className="w-full max-w-full">
                    {!fullUiLoading && (
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => {
                                        if (header.id === 'select') {
                                            return null;
                                        }

                                        return (
                                            <TableHead key={header.id}>
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                          header.column.columnDef.header,
                                                          header.getContext(),
                                                      )}
                                            </TableHead>
                                        );
                                    })}
                                </TableRow>
                            ))}
                        </TableHeader>
                    )}
                    <TableBody>
                        <LoadingStateDisplay
                            canSelect={false}
                            columns={columns ?? TRANSLATION_COLUMNS}
                            tableInstance={table}
                        />
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

type LoadingStateDisplayProps<TData, TValue> = {
    tableInstance: TanstackTable<TData>;
    columns: ColumnDef<TData, TValue>[];
    canSelect?: boolean;
};

function LoadingStateDisplay<TData, TValue>({
    canSelect = false,
    columns,
    tableInstance,
}: LoadingStateDisplayProps<TData, TValue>) {
    return (
        <Fragment>
            {Array.from({ length: tableInstance.getState().pagination.pageSize }).map((_, index) => (
                <TableRow key={index} className="pointer-events-none">
                    {columns.map((column, columnIndex) => {
                        switch (column.id) {
                            case 'select':
                                return (
                                    canSelect && (
                                        <TableCell key={columnIndex}>
                                            <Skeleton className="aspect-square h-8 w-auto" />
                                        </TableCell>
                                    )
                                );
                            case 'display_name':
                            case 'document_name':
                            case 'document_type':
                                return (
                                    <TableCell key={columnIndex}>
                                        <div className="flex items-center justify-start gap-2">
                                            <Skeleton className="aspect-square h-12 w-auto rounded-xl" />
                                            <div className="flex h-full flex-col items-start justify-center gap-2">
                                                <Skeleton className="h-4 w-60" />
                                                <Skeleton className="h-4 w-40" />
                                            </div>
                                        </div>
                                    </TableCell>
                                );
                            case 'duration':
                                return (
                                    <TableCell key={columnIndex}>
                                        <Skeleton className="h-4 w-24" />
                                    </TableCell>
                                );
                            case 'date':
                            case 'created_at':
                            case 'updated_at':
                                return (
                                    <TableCell key={columnIndex}>
                                        <Skeleton className="h-4 w-40" />
                                    </TableCell>
                                );
                            case 'status':
                                return (
                                    <TableCell key={columnIndex}>
                                        <Skeleton className="h-8 w-32" />
                                    </TableCell>
                                );
                            case 'customer_name':
                                return (
                                    <TableCell key={columnIndex}>
                                        <div className="flex items-center justify-start gap-2">
                                            <Skeleton className="aspect-square h-12 w-auto" />
                                            <div className="flex h-full flex-col items-start justify-center gap-2">
                                                <Skeleton className="h-4 w-60" />
                                                <Skeleton className="h-4 w-40" />
                                            </div>
                                        </div>{' '}
                                    </TableCell>
                                );
                            case 'actions':
                                return (
                                    <TableCell key={columnIndex}>
                                        <div className="flex items-center justify-start gap-2">
                                            <Skeleton className="aspect-square h-8 w-auto" />
                                            <Skeleton className="aspect-square h-8 w-auto" />
                                            <Skeleton className="aspect-square h-8 w-auto" />
                                        </div>
                                    </TableCell>
                                );
                            default:
                                return (
                                    <TableCell key={columnIndex}>
                                        <div className="flex items-center justify-start gap-2">
                                            <Skeleton className="h-4 w-40" />
                                        </div>
                                    </TableCell>
                                );
                        }
                    })}
                </TableRow>
            ))}
        </Fragment>
    );
}

export { LoadingStateTable, LoadingStateDisplay };
