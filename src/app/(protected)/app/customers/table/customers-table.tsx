/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { FunnelXIcon, MagnifyingGlassIcon, TrashIcon } from '@phosphor-icons/react';
import {
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { usePathname, useSearchParams } from 'next/navigation';
import { useRouter } from 'next-nprogress-bar';
import React, { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { getLogger } from '@/services/logger';
import { LoadingStateTable } from '@/src/app/(protected)/app/components/table-states/loading-table';
import CustomersEmptyRow from '@/src/app/(protected)/app/customers/table/customers-empty-table';
import CustomersErrorRow from '@/src/app/(protected)/app/customers/table/customers-error-table';
import { Button } from '@components/ui/button';
import Pagination from '@components/ui/pagination';
import { ScrollArea, ScrollBar } from '@components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import type { CustomerRow } from '@/src/schemas/customer-schemas';
import type { CustomersTableMetaType } from '@/types/core/tanstack';
import type { Tables } from '@/types/database/database';
import type { PaginatedResponse } from '@/types/rest/common';
import type { ApiResponseOrError } from '@/types/rest/response';
import type { ColumnDef, OnChangeFn, PaginationState, SortingState } from '@tanstack/react-table';

// ! DEBUGGING:
const LOG = getLogger('CLIENT:CUSTOMERS:DATA-TABLE').info;
const shouldDebug = false;

type TableDataType<T> = {
    results: T[];
    total: number;
};

type TableColumn<T> = ColumnDef<T>[];

type DataTableProps<T> = {
    columns?: TableColumn<T>;
    data?: TableDataType<T>;
    isLoading?: boolean;
    isError?: boolean;
    isSuccess?: boolean;
    refetch?: () => void;
    error?: ApiResponseOrError<PaginatedResponse<CustomerRow>> | null;
    isPlaceholderData?: boolean;
    triggerCustomerAddition: () => void;
    triggerCustomerUpdate: (customer: Tables<'extended_customer_view'>) => void;
    triggerCustomerDeletion: (customer: Tables<'extended_customer_view'>) => void;
    triggerMultipleCustomersDeletion: (customers: Tables<'extended_customer_view'>[]) => void;
};

export function CustomersTable({
    columns = [],
    data = { results: [], total: 0 },
    error = null,
    isError = false,
    isLoading = false,
    isPlaceholderData = false,
    isSuccess = true,
    refetch = () => {
        return;
    },
    triggerCustomerAddition,
    triggerCustomerDeletion,
    triggerCustomerUpdate,
    triggerMultipleCustomersDeletion,
}: DataTableProps<Tables<'extended_customer_view'>>) {
    const logger = getLogger('CLIENT:CUSTOMERS:DATA-TABLE');

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // * Search Params
    const queryPageIndex = searchParams.get('page') ? parseInt(searchParams.get('page') as string) : 1;
    const queryPageSize = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string) : 10;
    const queryPageFilter = searchParams.get('keyword') ? (searchParams.get('keyword') as string) : '';
    const queryPageSortBy = searchParams.get('sortby') ? (searchParams.get('sortby') as string) : '';
    const queryPageSortDirection = searchParams.get('direction')
        ? (searchParams.get('direction') as string)
        : '';

    // ! PAGINATION LOGIC:
    // Assuming queryPageIndex and queryPageSize are derived from URL parameters and are numbers
    const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
        pageIndex: queryPageIndex ? queryPageIndex - 1 : 0, // Adjust for zero-based index if necessary
        pageSize: queryPageSize || 10, // Default pageSize if not specified
    });

    const handlePaginationChange: OnChangeFn<PaginationState> = (updaterOrValue) => {
        // Determine the next pagination state based on the current state.
        const newPagination =
            typeof updaterOrValue === 'function'
                ? updaterOrValue({
                      pageIndex,
                      pageSize,
                  })
                : updaterOrValue;

        setPagination(newPagination);

        const params = new URLSearchParams();

        // Update with new pagination state; adjust pageIndex for one-based index if necessary.
        if (newPagination.pageIndex !== undefined) {
            // Adjust for one-based index.
            params.set('page', String(newPagination.pageIndex + 1));
        }
        if (newPagination.pageSize) {
            params.set('limit', String(newPagination.pageSize));
        }

        // Push updated search parameters to the URL:
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    // Effect to update state based on URL changes:
    useEffect(() => {
        setPagination({
            pageIndex: queryPageIndex - 1,
            pageSize: queryPageSize,
        });
    }, [queryPageIndex, queryPageSize]);

    // ! SORTING LOGIC:
    const [sortingState, setSortingState] = useState<SortingState>([]);

    const handleSortingChange: OnChangeFn<SortingState> = (updaterOrValue) => {
        if (shouldDebug) console.clear();

        const params = new URLSearchParams(searchParams.toString());

        if (shouldDebug) LOG('[Sorting] Current Params:', params.toString());

        const newSorting =
            typeof updaterOrValue === 'function' ? updaterOrValue(sortingState) : updaterOrValue;

        if (shouldDebug) LOG('[Sorting] New Sorting:', newSorting);

        if (newSorting.length === 0) {
            params.delete('sortby');
            params.delete('direction');

            if (shouldDebug) LOG('[Sorting] Sorting removed from the URL. New Params:', params.toString());
        } else {
            const sortingCriteria = newSorting[0];
            params.set('sortby', sortingCriteria.id);
            params.set('direction', sortingCriteria.desc ? 'desc' : 'asc');
            if (shouldDebug)
                logger.info(['[Sorting] Updated sorting in URL. New Params:', params.toString()]);
        }

        if (shouldDebug) LOG('[Sorting] New Params:', params.toString());

        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    useEffect(() => {
        setSortingState(
            queryPageSortBy &&
                queryPageSortDirection &&
                queryPageSortBy !== '' &&
                queryPageSortDirection !== '' &&
                queryPageSortBy !== 'null' &&
                queryPageSortDirection !== 'null' &&
                queryPageSortBy !== 'undefined' &&
                queryPageSortDirection !== 'undefined'
                ? [
                      {
                          desc: queryPageSortDirection === 'desc',
                          id: queryPageSortBy,
                      },
                  ]
                : [],
        );
    }, [queryPageSortBy, queryPageSortDirection]);

    // ! GLOBAL FILTER LOGIC:
    // ! GLOBAL FILTER console.infoIC:
    // Global Filter state and debounce setup
    const [globalFilter, setGlobalFilter] = useState<string | undefined>(queryPageFilter ?? '');
    const [debouncedGlobalFilter] = useDebounce(globalFilter, 500); // Debounce for 500ms

    // Update URL when the debounced filter changes
    useEffect(() => {
        const updateURL = (value: string) => {
            const params = new URLSearchParams(searchParams.toString());

            if (value.length > 0) {
                params.set('keyword', value);
            } else {
                params.delete('keyword');
            }

            // Push updated search parameters to the URL.
            router.push(`${pathname}?${params.toString()}`, { scroll: false });
        };

        updateURL(debouncedGlobalFilter || '');
    }, [debouncedGlobalFilter, pathname, router, searchParams]); // Update URL when debounced filter changes.

    // Set initial global filter from URL params
    useEffect(() => {
        setGlobalFilter(queryPageFilter);
    }, [queryPageFilter]);

    // Handle global filter change
    const handleGlobalFilterChange = (value: string) => {
        setGlobalFilter(value);
    };

    // ! TABLE INSTANCE:
    // * Newer Configuration for the table:
    const tableInstance = useReactTable({
        columns,
        data: data.results,
        enableGlobalFilter: true,
        enableMultiRemove: false,
        enableMultiSort: false,
        enableSorting: true,
        enableSortingRemoval: true,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        initialState: {
            globalFilter: '',
            pagination: {
                pageIndex: 0,
                pageSize: 10,
            },
            sorting: [],
        },
        manualFiltering: true,
        manualPagination: true,
        manualSorting: true,
        meta: {
            isPlaceholderData,
            triggerCustomerAddition,
            triggerCustomerDeletion,
            triggerCustomerUpdate,
            triggerMultipleCustomersDeletion,
        },
        onGlobalFilterChange: handleGlobalFilterChange,
        onPaginationChange: handlePaginationChange,
        onSortingChange: handleSortingChange,
        pageCount: data?.total ? Math.ceil(data.total / pageSize) : 0,
        state: {
            globalFilter: globalFilter ?? undefined,
            pagination: { pageIndex, pageSize },
            sorting: sortingState ?? [],
        },
    });

    // ! RESET TABLE:
    const resetTable = () => {
        const params = new URLSearchParams(searchParams.toString());

        params.delete('page');
        params.delete('limit');
        params.delete('keyword');
        params.delete('sortby');
        params.delete('direction');

        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    if (isLoading) {
        return <LoadingStateTable columns={columns} fullUiLoading={false} limit={pageSize} />;
    }

    return (
        <div className="mb-3 flex h-auto w-full flex-col">
            {/* Table Actions, Mainly the ability to search the table, and if there are selected rows, we can display a Delete Button. */}
            <div className="flex h-16 w-full items-center justify-between px-0">
                <div className="relative flex size-full max-w-full flex-1 flex-row items-center justify-start gap-3 p-1">
                    <div className="relative flex size-full max-w-full min-w-52 flex-1 flex-row items-center justify-start">
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
                            value={tableInstance.getState().globalFilter ?? ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                tableInstance.setGlobalFilter(e.target.value ?? '')
                            }
                        />
                    </div>
                </div>

                <div className="relative flex w-full flex-1 flex-row flex-wrap items-center justify-end gap-3 p-1">
                    {(tableInstance.getState().globalFilter ||
                        tableInstance.getState().sorting.length > 0) && (
                        <Button
                            className="flex items-center justify-center"
                            color="secondary"
                            variant="plain"
                            onClick={() => {
                                resetTable();
                            }}
                        >
                            <FunnelXIcon className="size-5" color="currentColor" weight="duotone" />
                            <span className="hidden font-bold md:block">Clear</span>{' '}
                        </Button>
                    )}

                    {tableInstance.getFilteredSelectedRowModel().rows.length ? (
                        <div className="flex items-center justify-end space-x-4">
                            <Button
                                className="flex items-center justify-center"
                                color="destructive"
                                variant="solid"
                                onClick={() => {
                                    const selectedRows = tableInstance.getFilteredSelectedRowModel().rows;

                                    const meta = tableInstance.options?.meta as CustomersTableMetaType;

                                    meta?.triggerMultipleCustomersDeletion?.(
                                        selectedRows.map((row) => row.original),
                                    );
                                }}
                            >
                                <TrashIcon className="size-5" color="currentColor" weight="duotone" />
                                <span className="hidden font-bold md:block">Delete</span>
                            </Button>
                        </div>
                    ) : null}

                    <Select onValueChange={(value) => tableInstance.setPageSize(parseInt(value) ?? 10)}>
                        <SelectTrigger className="h-9 max-h-9 w-full max-w-[180px] border-none">
                            <SelectValue
                                placeholder={`Show ${tableInstance.getState().pagination.pageSize} Records`}
                            />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Page Size</SelectLabel>
                                <SelectItem value="10">10 Records</SelectItem>
                                <SelectItem value="20">20 Records</SelectItem>
                                <SelectItem value="30">30 Records</SelectItem>
                                <SelectItem value="40">40 Records</SelectItem>
                                <SelectItem value="50">50 Records</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <ScrollArea className="flex w-full flex-col gap-2">
                <div className="w-full rounded-3xl p-1">
                    <Table className="w-full max-w-full">
                        <TableHeader>
                            {tableInstance.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers
                                        .filter((header) => {
                                            // Hide the column with ID 'select' if there are no records
                                            return (
                                                tableInstance.getRowModel().rows.length > 0 ||
                                                header.id !== 'select'
                                            );
                                        })
                                        .map((header) => {
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
                        <TableBody>
                            {!(isLoading || isError) &&
                                isSuccess &&
                                (tableInstance.getRowModel().rows?.length ? (
                                    tableInstance.getRowModel().rows.map((row) => (
                                        <TableRow
                                            key={row.id}
                                            data-state={row.getIsSelected() && 'selected'}
                                            variant="default"
                                        >
                                            {row
                                                .getVisibleCells()
                                                .filter((cell) => {
                                                    // Hide the column with ID 'select' if there are no records
                                                    return (
                                                        tableInstance.getRowModel().rows.length > 0 ||
                                                        cell.column.id !== 'select'
                                                    );
                                                })
                                                .map((cell) => (
                                                    <TableCell key={cell.id}>
                                                        {flexRender(
                                                            cell.column.columnDef.cell,
                                                            cell.getContext(),
                                                        )}
                                                    </TableCell>
                                                ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <CustomersEmptyRow columns={columns} tableInstance={tableInstance} />
                                ))}

                            {isError && (
                                <CustomersErrorRow
                                    columns={columns}
                                    error={error}
                                    refetch={refetch}
                                    tableInstance={tableInstance}
                                />
                            )}
                        </TableBody>
                    </Table>
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>

            {/* Table Pagination */}
            {tableInstance.getRowModel().rows.length > 0 && (
                <div className="mt-4 flex h-auto w-full flex-wrap items-center justify-between gap-3 p-1 text-sm">
                    <div className="text-surface-600 dark:text-surface-400 flex w-full flex-1 items-center justify-start gap-3">
                        Showing {tableInstance.getRowModel().rows.length} of {data?.total} entries
                    </div>
                    <div className="flex w-full flex-1 items-center justify-center gap-3">
                        <Pagination tableInstance={tableInstance} />
                    </div>
                    <div className="text-surface-600 dark:text-surface-400 flex w-full flex-1 items-center justify-end gap-3">
                        Page {tableInstance.getState().pagination.pageIndex + 1} of{' '}
                        {data?.total ? Math.ceil(data.total / pageSize) : 0}
                    </div>
                </div>
            )}
        </div>
    );
}

export default CustomersTable;
