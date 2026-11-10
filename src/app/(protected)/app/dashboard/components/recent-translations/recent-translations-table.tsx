/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Fragment } from 'react';
import { EmptyStateDisplay } from '@/src/app/(protected)/app/components/table-states/empty-table';
import { ErrorStateDisplay } from '@/src/app/(protected)/app/components/table-states/error-table';
import { LoadingStateDisplay } from '@/src/app/(protected)/app/components/table-states/loading-table';
import { TRANSLATION_COLUMNS } from '@/src/app/(protected)/app/translations/table/translations-columns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { useUserData } from '@hooks/queries/auth/use-user-data';
import { recentTranslationsQueryOptions } from '@queries/tanstack/translations-query-options';

export function RecentTranslationsTable() {
    const columns = TRANSLATION_COLUMNS;
    const { data: userData } = useUserData();
    const { user } = userData ?? {};
    const userId = user?.id ?? '';

    const { data, error, isError, isLoading, isSuccess, refetch } = useQuery(
        recentTranslationsQueryOptions(userId, {
            queryPageSize: 5,
        }),
    );

    const tableInstance = useReactTable({
        columns: TRANSLATION_COLUMNS,
        data: data ?? [],
        enableColumnFilters: false,
        enableFilters: false,
        enableMultiRowSelection: false,
        enableMultiSort: false,
        enableSorting: false,
        getCoreRowModel: getCoreRowModel(),
        pageCount: 1,
        state: {
            columnVisibility: {
                select: false,
            },
            pagination: {
                pageIndex: 0,
                pageSize: 5,
            },
        },
    });

    return (
        <div className="mb-3 w-full rounded-xl">
            <Table className="w-full max-w-full">
                <TableHeader>
                    {tableInstance.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                return (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                );
                            })}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {!(isLoading || isError) && isSuccess && (
                        <Fragment>
                            {tableInstance.getRowModel().rows?.length ? (
                                tableInstance.getRowModel().rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() && 'selected'}
                                        variant={
                                            row.getValue('status') === 'queued'
                                                ? 'queued'
                                                : row.getValue('status') === 'processing'
                                                  ? 'processing'
                                                  : row.getValue('status') === 'failed' ||
                                                      row.getValue('status') === 'canceled'
                                                    ? 'error'
                                                    : 'default'
                                        }
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length}>
                                        <EmptyStateDisplay
                                            columns={columns}
                                            showImage={false}
                                            tableInstance={tableInstance}
                                        />
                                    </TableCell>
                                </TableRow>
                            )}
                        </Fragment>
                    )}
                    {isLoading && <LoadingStateDisplay columns={columns} tableInstance={tableInstance} />}
                    {isError && (
                        <ErrorStateDisplay
                            columns={columns}
                            error={error}
                            refetch={refetch}
                            showImage={false}
                            tableInstance={tableInstance}
                        />
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
