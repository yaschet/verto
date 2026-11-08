/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { FunnelXIcon, MagnifyingGlassIcon } from '@phosphor-icons/react';
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
import { LoadingStateTable } from '@/src/app/(protected)/app/components/table-states/loading-table';
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
import { USER_COLUMNS } from '@/src/app/(protected)/admin/users/table/users-columns';
import type { AdminUserRow } from '@/src/schemas/admin-user-schemas';
import type { UsersTableMetaType } from '@/src/app/(protected)/admin/users/table/users-columns';
import type { PaginatedResponse } from '@/types/rest/common';
import type { OnChangeFn, PaginationState, SortingState, VisibilityState } from '@tanstack/react-table';

type UsersTableProps = {
    data: PaginatedResponse<AdminUserRow>;
    isLoading: boolean;
    pagination: PaginationState;
    sorting: SortingState;
    triggerAdjustCredits: (user: AdminUserRow) => void;
    triggerResetPassword: (user: AdminUserRow) => void;
    triggerUserUpdate: (user: AdminUserRow) => void;
    triggerUserSuspension: (user: AdminUserRow) => void;
    triggerPermanentUserDeletion: (user: AdminUserRow) => void;
    triggerUserReactivation: (user: AdminUserRow) => void;
    triggerManageMFA: (user: AdminUserRow) => void;
};

export function UsersTable({
    data,
    isLoading,
    pagination,
    sorting,
    triggerAdjustCredits,
    triggerResetPassword,
    triggerUserUpdate,
    triggerUserSuspension,
    triggerPermanentUserDeletion,
    triggerUserReactivation,
    triggerManageMFA,
}: UsersTableProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});

    // Search Params
    const queryPageFilter = searchParams.get('keyword') ? (searchParams.get('keyword') as string) : '';
    const _queryPageSortBy = searchParams.get('sortby') ? (searchParams.get('sortby') as string) : '';
    const _queryPageSortDirection = searchParams.get('direction')
        ? (searchParams.get('direction') as string)
        : '';

    // Global Filter state and debounce setup
    const [globalFilter, setGlobalFilter] = useState<string | undefined>(queryPageFilter ?? '');
    const [debouncedGlobalFilter] = useDebounce(globalFilter, 500);

    // Update URL when the debounced filter changes
    useEffect(() => {
        const updateURL = (value: string) => {
            const params = new URLSearchParams(searchParams.toString());

            if (value.length > 0) {
                params.set('keyword', value);
            } else {
                params.delete('keyword');
            }

            // Reset to page 1 on filter change
            params.set('page', '1');

            router.push(`${pathname}?${params.toString()}`, { scroll: false });
        };

        if (debouncedGlobalFilter !== queryPageFilter) {
            updateURL(debouncedGlobalFilter || '');
        }
    }, [debouncedGlobalFilter, pathname, router, searchParams, queryPageFilter]);

    // Set initial global filter from URL params
    useEffect(() => {
        setGlobalFilter(queryPageFilter);
    }, [queryPageFilter]);

    const handleGlobalFilterChange = (value: string) => {
        setGlobalFilter(value);
    };

    // Pagination Handler
    const handlePaginationChange: OnChangeFn<PaginationState> = (updaterOrValue) => {
        const newPagination =
            typeof updaterOrValue === 'function' ? updaterOrValue(pagination) : updaterOrValue;

        const params = new URLSearchParams(searchParams.toString());
        params.set('page', String(newPagination.pageIndex + 1));
        params.set('limit', String(newPagination.pageSize));

        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    // Sorting Handler
    const handleSortingChange: OnChangeFn<SortingState> = (updaterOrValue) => {
        const newSorting = typeof updaterOrValue === 'function' ? updaterOrValue(sorting) : updaterOrValue;

        const params = new URLSearchParams(searchParams.toString());

        if (newSorting.length === 0) {
            params.delete('sortby');
            params.delete('direction');
        } else {
            const sortingCriteria = newSorting[0];
            params.set('sortby', sortingCriteria.id);
            params.set('direction', sortingCriteria.desc ? 'desc' : 'asc');
        }

        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const meta: UsersTableMetaType = {
        triggerAdjustCredits,
        triggerResetPassword,
        triggerUserSuspension,
        triggerPermanentUserDeletion,
        triggerUserReactivation,
        triggerUserUpdate,
        triggerManageMFA,
    };

    const tableInstance = useReactTable({
        columns: USER_COLUMNS,
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
        meta,
        onColumnVisibilityChange: setColumnVisibility,
        onGlobalFilterChange: handleGlobalFilterChange,
        onPaginationChange: handlePaginationChange,
        onRowSelectionChange: setRowSelection,
        onSortingChange: handleSortingChange,
        pageCount: data.pagination?.pagesCount ?? 0,
        state: {
            columnVisibility,
            globalFilter: globalFilter ?? undefined,
            pagination,
            rowSelection,
            sorting,
        },
    });

    const resetTable = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('page');
        params.delete('limit');
        params.delete('keyword');
        params.delete('sortby');
        params.delete('direction');
        params.delete('role');
        params.delete('status');
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    if (isLoading) {
        return <LoadingStateTable columns={USER_COLUMNS} fullUiLoading={false} limit={pagination.pageSize} />;
    }

    return (
        <div className="mb-3 flex h-auto w-full flex-col gap-4">
            <div className="flex h-auto w-full flex-col items-center justify-between gap-4 px-0 md:h-16 md:flex-row">
                <div className="relative flex w-full flex-1 flex-row items-center justify-start gap-3 p-1 md:size-full md:max-w-full">
                    <div className="relative flex size-full max-w-full flex-1 flex-row items-center justify-start">
                        <MagnifyingGlassIcon
                            className="text-surface-300 dark:text-surface-700 relative inset-y-0 left-0 ml-2 size-6"
                            color="currentColor"
                            weight="regular"
                        />
                        <input
                            className="text-surface-500 dark:text-surface-400 absolute inset-0 flex h-full w-auto max-w-full flex-1 flex-row items-center justify-start border-none bg-transparent pl-12 ring-0 ring-transparent outline-none focus:border-transparent focus:ring-0 focus:outline-none"
                            placeholder="Search users..."
                            type="text"
                            value={tableInstance.getState().globalFilter ?? ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                tableInstance.setGlobalFilter(e.target.value ?? '')
                            }
                        />
                    </div>
                </div>

                <ScrollArea className="w-full max-w-full md:w-auto md:flex-1">
                    <div className="flex w-max min-w-full flex-row items-center justify-start gap-3 p-1 md:w-full md:justify-end">
                        {(tableInstance.getState().globalFilter ||
                            tableInstance.getState().sorting.length > 0) && (
                            <Button
                                className="flex items-center justify-center"
                                color="secondary"
                                variant="plain"
                                onClick={resetTable}
                            >
                                <FunnelXIcon className="size-5" color="currentColor" weight="duotone" />
                                <span className="hidden font-bold md:block">Clear</span>
                            </Button>
                        )}

                        <div className="flex flex-row items-center gap-2">
                            <Select
                                value={searchParams.get('role') ?? 'all'}
                                onValueChange={(value) => {
                                    const params = new URLSearchParams(searchParams.toString());
                                    if (value === 'all') {
                                        params.delete('role');
                                    } else {
                                        params.set('role', value);
                                    }
                                    params.set('page', '1');
                                    router.push(`${pathname}?${params.toString()}`, { scroll: false });
                                }}
                            >
                                <SelectTrigger className="h-9 w-[130px]">
                                    <SelectValue placeholder="Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Roles</SelectItem>
                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                    <SelectItem value="USER">User</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select
                                value={searchParams.get('status') ?? 'all'}
                                onValueChange={(value) => {
                                    const params = new URLSearchParams(searchParams.toString());
                                    if (value === 'all') {
                                        params.delete('status');
                                    } else {
                                        params.set('status', value);
                                    }
                                    params.set('page', '1');
                                    router.push(`${pathname}?${params.toString()}`, { scroll: false });
                                }}
                            >
                                <SelectTrigger className="h-9 w-[130px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="ONLINE">Online</SelectItem>
                                    <SelectItem value="OFFLINE">Offline</SelectItem>
                                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select
                                onValueChange={(value) => tableInstance.setPageSize(parseInt(value) ?? 10)}
                            >
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
                    <ScrollBar orientation="horizontal" className="invisible sm:visible" />
                </ScrollArea>
            </div>

            <ScrollArea className="flex w-full flex-col gap-2">
                <div className="w-full rounded-3xl p-1">
                    <Table className="w-full max-w-full">
                        <TableHeader>
                            {tableInstance.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                      header.column.columnDef.header,
                                                      header.getContext(),
                                                  )}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {tableInstance.getRowModel().rows?.length ? (
                                tableInstance.getRowModel().rows.map((row) => (
                                    <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={USER_COLUMNS.length} className="h-24 text-center">
                                        No results.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>

            {tableInstance.getRowModel().rows.length > 0 && (
                <div className="mt-4 flex h-auto w-full flex-wrap items-center justify-between gap-3 p-1 text-sm">
                    <div className="text-surface-600 dark:text-surface-400 flex w-full flex-1 items-center justify-start gap-3">
                        Showing {tableInstance.getRowModel().rows.length} of {data.total} entries
                    </div>
                    <div className="flex w-full flex-1 items-center justify-center gap-3">
                        <Pagination tableInstance={tableInstance} />
                    </div>
                    <div className="text-surface-600 dark:text-surface-400 flex w-full flex-1 items-center justify-end gap-3">
                        Page {tableInstance.getState().pagination.pageIndex + 1} of{' '}
                        {data.pagination?.pagesCount ?? 0}
                    </div>
                </div>
            )}
        </div>
    );
}
