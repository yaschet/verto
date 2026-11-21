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
import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { LoadingStateTable } from '@/src/app/(protected)/app/components/table-states/loading-table';
import TranslationsEmptyTable from '@/src/app/(protected)/app/translations/table/translations-empty-table';
import TranslationsErrorTable from '@/src/app/(protected)/app/translations/table/translations-error-table';
import {
    TRANSLATION_FAILED_STATUSES,
    TRANSLATION_PENDING_STATUSES,
    TRANSLATION_PROCESSING_STATUSES,
} from '@/src/schemas/translation-schemas';
import { Button } from '@components/ui/button';
import Pagination from '@components/ui/pagination';
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
import type { TranslationColumn, TranslationRow } from '@/src/schemas/translation-schemas';
import type { TranslationsTableMetaType } from '@/types/core/tanstack';
import type { PaginatedResponse } from '@/types/rest/common';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';
import type { TableRowProps } from '@components/ui/table';
import type { ColumnDef, OnChangeFn, PaginationState, SortingState } from '@tanstack/react-table';
import type { ChangeEvent } from 'react';

// ! DEBUGGING:
const shouldDebug = false;

type TableDataType<T> = {
    results: T[];
    total: number;
};

type TableColumn<T> = ColumnDef<T>[];

type TranslationsDataTableProps<T> = {
    columns?: TableColumn<T>;
    data?: TableDataType<T>;
    isLoading?: boolean;
    isError?: boolean;
    isSuccess?: boolean;
    refetch?: () => void;
    error?:
        | ApiResponseOrError<PaginatedResponse<TranslationRow>>
        | (Error & Partial<ApiErrorType>)
        | ApiErrorType
        | null;
    triggerTranslationDeletion: (translation: TranslationRow) => void;
    triggerMultipleTranslationsDeletion: (translations: TranslationRow[]) => void;
    triggerAssignmentToCustomer: (translation: TranslationRow) => void;
    triggerTranslationCancellation: (translation: TranslationRow) => void;
    triggerTranslationRetry: (translation: TranslationRow) => void;
    triggerRegeneration: (translation: TranslationRow) => void;
    triggerRetranslate: (translation: TranslationRow) => void;
    triggerDownloadOriginal: (translation: TranslationRow) => void;
};

export function TranslationsTable({
    columns = [],
    data = {
        results: [],
        total: 0,
    },
    error = null,
    isError = false,
    isLoading = false,
    isSuccess = true,
    refetch = () => {
        return;
    },
    triggerAssignmentToCustomer,
    triggerMultipleTranslationsDeletion,
    triggerTranslationCancellation,
    triggerTranslationDeletion,
    triggerTranslationRetry,
    triggerRegeneration,
    triggerRetranslate,
    triggerDownloadOriginal,
}: TranslationsDataTableProps<TranslationRow>) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // * Search Params
    const queryPageIndex: number = searchParams.get('page')
        ? parseInt(searchParams.get('page') as string)
        : 1;
    const queryPageSize: number = searchParams.get('limit')
        ? parseInt(searchParams.get('limit') as string)
        : 10;
    const queryPageFilter: string | null = searchParams.get('keyword')
        ? (searchParams.get('keyword') as string)
        : '';
    const queryPageSortBy: TranslationColumn | null = searchParams.get('sortby')
        ? (searchParams.get('sortby') as TranslationColumn)
        : null;
    const queryPageSortDirection: 'asc' | 'desc' = searchParams.get('direction')
        ? (searchParams.get('direction') as 'asc' | 'desc')
        : 'asc';

    // ! PAGINATION console.infoIC:
    // Assuming queryPageIndex and queryPageSize are derived from URL parameters and are numbers
    const [{ pageIndex, pageSize }, setTranslationsPagination] = useState<PaginationState>({
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

        setTranslationsPagination(newPagination);

        const params = new URLSearchParams();

        // Update with new pagination state; adjust pageIndex for one-based index if necessary.
        if (newPagination.pageIndex !== undefined) {
            // Adjust for one-based index.
            params.set('page', String(newPagination.pageIndex + 1));
        }
        if (newPagination.pageSize) {
            params.set('limit', String(newPagination.pageSize));
        }

        // Push updated search parameters to the URL.
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    // Effect to update state based on URL changes
    useEffect(() => {
        setTranslationsPagination({
            pageIndex: queryPageIndex - 1, // Adjust for zero-based index if necessary.
            pageSize: queryPageSize,
        });
    }, [queryPageIndex, queryPageSize]);

    // ! SORTING console.infoIC:
    const [sortingState, setSortingState] = useState<SortingState>([]);

    const handleSortingChange: OnChangeFn<SortingState> = (updaterOrValue) => {
        if (shouldDebug) console.clear();

        const params = new URLSearchParams(searchParams.toString());

        if (shouldDebug) console.info('[Sorting] Current Params:', params.toString());

        const newSorting =
            typeof updaterOrValue === 'function' ? updaterOrValue(sortingState) : updaterOrValue;

        if (shouldDebug) console.info('[Sorting] New Sorting:', newSorting);

        if (newSorting.length === 0) {
            params.delete('sortby');
            params.delete('direction');

            if (shouldDebug)
                console.info('[Sorting] Sorting removed from the URL. New Params:', params.toString());
        } else {
            const sortingCriteria = newSorting[0];
            params.set('sortby', sortingCriteria.id);
            params.set('direction', sortingCriteria.desc ? 'desc' : 'asc');
            if (shouldDebug)
                console.info(['[Sorting] Updated sorting in URL. New Params:', params.toString()]);
        }

        if (shouldDebug) console.info('[Sorting] New Params:', params.toString());
        // window.history.pushState(null, "", `?${params.toString()}`)

        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    useEffect(() => {
        setSortingState(
            queryPageSortBy && queryPageSortDirection
                ? [
                      {
                          desc: queryPageSortDirection === 'desc',
                          id: queryPageSortBy,
                      },
                  ]
                : [],
        );
    }, [queryPageSortBy, queryPageSortDirection]);

    // ! GLOBAL FILTER console.infoIC:
    // Global Filter state and debounce setup
    const [translationsGlobalFilter, setTranslationsGlobalFilter] = useState<string | undefined>(
        queryPageFilter ?? '',
    );
    const [debouncedGlobalFilter] = useDebounce(translationsGlobalFilter, 300); // Debounce for 300ms (snappier UX)

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
    }, [debouncedGlobalFilter, pathname, router, searchParams]); // Only runs when debouncedGlobalFilter changes

    // Set initial global filter from URL params
    useEffect(() => {
        setTranslationsGlobalFilter(queryPageFilter);
    }, [queryPageFilter]);

    // Handle global filter change
    const handleGlobalFilterChange = (value: string) => {
        setTranslationsGlobalFilter(value);
    };

    // ! TABLE INSTANCE:
    const tableInstance = useReactTable({
        // * Newer Configuration for the table:
        columns,
        data: data.results,
        enableGlobalFilter: true,
        enableMultiRemove: false,
        enableMultiSort: false,
        enableSorting: true,
        enableSortingRemoval: false,
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
        manualSorting: true, // SERVER-SIDE sorting to get accurate data across all pages
        meta: {
            triggerAssignmentToCustomer(translation: TranslationRow) {
                triggerAssignmentToCustomer(translation);
            },
            triggerMultipleTranslationsDeletion(translations: TranslationRow[]) {
                triggerMultipleTranslationsDeletion(translations);
            },
            triggerTranslationCancellation(translation: TranslationRow) {
                triggerTranslationCancellation(translation);
            },
            triggerTranslationDeletion(translation: TranslationRow) {
                triggerTranslationDeletion(translation);
            },
            triggerTranslationRetry(translation: TranslationRow) {
                triggerTranslationRetry(translation);
            },
            triggerRegeneration(translation: TranslationRow) {
                triggerRegeneration(translation);
            },
            triggerRetranslate(translation: TranslationRow) {
                triggerRetranslate(translation);
            },
            triggerDownloadOriginal(translation: TranslationRow) {
                triggerDownloadOriginal(translation);
            },
        } as TranslationsTableMetaType,
        onGlobalFilterChange: handleGlobalFilterChange,
        onPaginationChange: handlePaginationChange,
        onSortingChange: handleSortingChange,
        pageCount: data?.total ? Math.ceil(data.total / pageSize) : 0,
        state: {
            globalFilter: translationsGlobalFilter ?? undefined,
            pagination: {
                pageIndex,
                pageSize,
            },
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
            <div className="flex h-16 w-full items-center justify-between px-0">
                <div className="relative flex size-full max-w-full flex-1 flex-row items-center justify-start gap-3 p-1">
                    <div className="relative flex size-full max-w-full min-w-52 flex-1 flex-row items-center justify-start">
                        <MagnifyingGlassIcon
                            className="text-surface-300 dark:text-surface-700 relative inset-y-0 left-0 ml-2 size-6"
                            color="currentColor"
                            weight="regular"
                        />
                        <input
                            className="text-surface-500 dark:text-surface-400 absolute inset-0 flex h-full w-auto max-w-full flex-1 flex-row items-center justify-start border-none bg-transparent pl-12 ring-0 ring-transparent outline-none focus:border-transparent focus:ring-0 focus:outline-none"
                            placeholder="Search records..."
                            type="text"
                            value={tableInstance.getState().globalFilter ?? ''}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
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

                                    const meta = tableInstance.options?.meta as TranslationsTableMetaType;

                                    meta.triggerMultipleTranslationsDeletion?.(
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
                                tableInstance.getRowModel().rows.map((row) => {
                                    let rowVariant: TableRowProps['variant'] = 'default';

                                    const originalStatus = row.original.status ?? 'queued';

                                    if (TRANSLATION_PENDING_STATUSES.includes(originalStatus)) {
                                        rowVariant = 'queued';
                                    } else if (TRANSLATION_PROCESSING_STATUSES.includes(originalStatus)) {
                                        rowVariant = 'processing';
                                    } else if (TRANSLATION_FAILED_STATUSES.includes(originalStatus)) {
                                        rowVariant = 'error';
                                    }

                                    return (
                                        <TableRow
                                            key={row.id}
                                            data-state={row.getIsSelected() && 'selected'}
                                            variant={rowVariant}
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
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length}>
                                        <TranslationsEmptyTable
                                            columns={columns}
                                            tableInstance={tableInstance}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}

                        {isError && (
                            <TranslationsErrorTable
                                columns={columns}
                                error={error}
                                refetch={refetch}
                                tableInstance={tableInstance}
                            />
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Table Pagination */}
            {tableInstance.getRowModel().rows.length > 0 && (
                <div className="mt-4 flex h-auto w-full flex-wrap items-center justify-between gap-3 p-1 text-sm">
                    <div
                        className={`text-surface-600 dark:text-surface-400 flex w-full flex-1 items-center justify-start gap-3 ${
                            tableInstance.getRowModel().rows.length < 1 ? 'hidden' : ''
                        }`}
                    >
                        Showing {tableInstance.getRowModel().rows.length} of {data?.total} entries
                    </div>
                    <div
                        className={`flex w-full flex-1 items-center justify-center gap-3 ${
                            tableInstance.getRowModel().rows.length < 1 ? 'hidden' : ''
                        }`}
                    >
                        <Pagination tableInstance={tableInstance} />
                    </div>
                    <div
                        className={`text-surface-600 dark:text-surface-400 flex w-full flex-1 items-center justify-end gap-3 ${
                            tableInstance.getRowModel().rows.length < 1 ? 'hidden' : ''
                        }`}
                    >
                        Page {tableInstance.getState().pagination.pageIndex + 1} of{' '}
                        {data?.total ? Math.ceil(data.total / pageSize) : 0}
                    </div>
                </div>
            )}
        </div>
    );
}

export default TranslationsTable;
