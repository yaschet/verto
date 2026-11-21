/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import {
    ArrowDownIcon,
    ArrowsCounterClockwiseIcon,
    BroomIcon,
    EmptyIcon,
    FadersHorizontalIcon,
    ShoppingCartIcon,
    WarningIcon,
} from '@phosphor-icons/react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import Link from 'next/link';
import React, { Fragment, useCallback, useMemo, useRef } from 'react';
import { CREDITS_TRANSACTIONS_COLUMNS } from '@/app/(protected)/account/billing/components/partials/credits-transactions-columns';
import { useFilteringStore } from '@components/providers/filtering-store-provider';
import { Button } from '@components/ui/button';
import { Skeleton } from '@components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { useUserData } from '@hooks/queries/auth/use-user-data';
import { creditsTransactionsQueryOptions } from '@queries/tanstack/billing-query-options';
import type { CreditsTransaction } from '@/types/core/billing';
import type { ApiErrorType } from '@/types/rest/errors';
import type {
    CreditsTransactionsQueryData,
    CreditsTransactionsQueryResponse,
} from '@actions/billing/credits/get-infinite-credits-transactions';
import type { ColumnDef } from '@tanstack/react-table';
import type { RefObject } from 'react';

import { adminCreditsTransactionsQueryOptions } from '@/src/queries/tanstack/admin/users-query-options';

export function CreditsTransactionTable({
    userId: propUserId,
    isAdmin = false,
}: {
    userId?: string;
    isAdmin?: boolean;
}) {
    const observer = useRef<IntersectionObserver>(undefined) as RefObject<IntersectionObserver>;

    const { data: profileData } = useUserData();
    const { profile } = profileData ?? {};
    const currentUserId = profile?.id;

    // Use propUserId if provided (admin mode), otherwise fall back to current user
    const targetUserId = propUserId ?? currentUserId;

    const transactionsHistoryFilters = useFilteringStore((state) => state.transactionsHistory);

    // Select the correct query options based on isAdmin flag
    const queryOptions =
        isAdmin && targetUserId
            ? adminCreditsTransactionsQueryOptions(targetUserId, transactionsHistoryFilters)
            : creditsTransactionsQueryOptions(targetUserId, transactionsHistoryFilters);

    const { data, error, fetchNextPage, hasNextPage, isError, isFetching, isFetchingNextPage, isLoading } =
        useInfiniteQuery<
            CreditsTransactionsQueryResponse,
            ApiErrorType,
            {
                pages: CreditsTransactionsQueryData[];
                pageParams: number[];
            }
        >(queryOptions);

    const transactions = useMemo(() => {
        if (!data) return [];
        const newTransactions = data.pages.flatMap((page) => page.data ?? []);
        // Deduplicate by ensuring that we only add unique transactions
        return newTransactions.filter(
            (transaction, index, self) => self.findIndex((t) => t.id === transaction.id) === index,
        );
    }, [data]);

    const columns = useMemo<ColumnDef<CreditsTransaction>[]>(() => CREDITS_TRANSACTIONS_COLUMNS, []);

    const table = useReactTable({
        columns,
        data: transactions,
        getCoreRowModel: getCoreRowModel(),
    });

    const { rows } = table.getRowModel();

    const lastElementRef = useCallback(
        (node: HTMLDivElement) => {
            if (isLoading) return;

            if (observer.current) observer.current.disconnect();

            observer.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && hasNextPage && !isFetching) {
                    fetchNextPage().then((r) => r);
                }
            });

            if (node) observer.current.observe(node);
        },
        [fetchNextPage, hasNextPage, isFetching, isLoading],
    );

    const renderTransactions = rows.map((row) => (
        <TableRow key={row.id} ref={lastElementRef as (node: HTMLTableRowElement) => void}>
            {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
            ))}
        </TableRow>
    ));

    return (
        <div className="flex w-full flex-col items-center justify-center gap-3">
            <Table className="relative w-full">
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <TableHead key={header.id}>
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(header.column.columnDef.header, header.getContext())}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>

                {isLoading && (
                    <TableBody>
                        {Array.from({ length: 3 }).map((_, index) => (
                            <CreditsTransactionLoadingRow
                                key={index}
                                columns={CREDITS_TRANSACTIONS_COLUMNS}
                                index={index}
                            />
                        ))}
                    </TableBody>
                )}
                {!isError &&
                    !isLoading &&
                    (rows?.length > 0 ? (
                        <TableBody>
                            {renderTransactions.map((renderedTransaction, index) => (
                                <Fragment key={index}>{renderedTransaction}</Fragment>
                            ))}
                            {isFetching &&
                                !isLoading &&
                                Array.from({ length: 10 }).map((_, loadingIndex) => (
                                    <CreditsTransactionLoadingRow
                                        key={loadingIndex}
                                        columns={CREDITS_TRANSACTIONS_COLUMNS}
                                        index={loadingIndex}
                                    />
                                ))}
                        </TableBody>
                    ) : (
                        <TableBody>
                            <TableRow>
                                <TableCell
                                    className="text-center"
                                    colSpan={CREDITS_TRANSACTIONS_COLUMNS?.length}
                                >
                                    <EmptyTableMessage />
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    ))}
                {isError && (
                    <TableBody>
                        <TableCell className="text-center" colSpan={CREDITS_TRANSACTIONS_COLUMNS?.length}>
                            <ErrorRow error={error} />
                        </TableCell>
                    </TableBody>
                )}
            </Table>
            {hasNextPage && !isError && !isLoading && !!data && transactions.length > 0 && (
                <Button
                    color="primary"
                    disabled={isFetchingNextPage}
                    loading={isFetchingNextPage}
                    shape="pill"
                    size="md"
                    variant="solid"
                    onClick={() => fetchNextPage()}
                >
                    {!isFetchingNextPage && (
                        <>
                            <ArrowDownIcon />
                            <span>Load More</span>
                        </>
                    )}
                    {isFetchingNextPage && <span>Loading</span>}
                </Button>
            )}
        </div>
    );
}

function EmptyTableMessage() {
    const resetTransactionsHistoryFilter = useFilteringStore(
        (state) => state.transactionsHistoryActions.resetTransactionsHistoryFilter,
    );
    const isFilterApplied = useFilteringStore((state) => state.transactionsHistoryState.isFilterApplied);
    const count = useFilteringStore((state) => state.transactionsHistoryState.appliedFiltersCount);

    return (
        <>
            <div className="mb-5 flex flex-col items-center justify-center gap-3">
                <div className="bg-primary-100 dark:bg-primary-900 mb-3 flex size-16 items-center justify-center rounded-full">
                    {isFilterApplied && (
                        <FadersHorizontalIcon className="text-primary-500 dark:text-primary-400 size-8" />
                    )}
                    {!isFilterApplied && (
                        <EmptyIcon
                            className="text-primary-500 dark:text-primary-400 size-8"
                            weight="duotone"
                        />
                    )}
                </div>
                <h1 className="text-surface-900 dark:text-surface-100 text-2xl font-black tracking-tighter sm:text-2xl">
                    {isFilterApplied && 'No Transactions Match Your Filters'}
                    {!isFilterApplied && 'No Transactions Found'}
                </h1>
                <p className="text-surface-600 dark:text-surface-500 text-sm leading-7">
                    {/*It looks like you haven't made any transactions yet. Get started by purchasing credits.*/}
                    {isFilterApplied && (
                        <>
                            {`No transactions match your filters, you have ${count} filters applied.`} <br />
                            Clear all filters to see all transactions.
                        </>
                    )}
                    {!isFilterApplied && 'It looks like you haven’t made any transactions yet.'}
                </p>
            </div>
            <div className="flex items-center justify-center gap-2">
                {isFilterApplied && (
                    <Button
                        className="flex items-center justify-center font-bold"
                        color="primary"
                        shape="pill"
                        size="lg"
                        variant="solid"
                        onClick={() => resetTransactionsHistoryFilter()}
                    >
                        <BroomIcon className="size-5" color="currentColor" weight="duotone" />
                        <span>Clear Filters</span>
                    </Button>
                )}

                {!isFilterApplied && (
                    <Button
                        asChild
                        className="flex items-center justify-center font-bold"
                        color="primary"
                        shape="pill"
                        size="lg"
                        variant="solid"
                    >
                        <Link href="/account/credits/top-up">
                            <ShoppingCartIcon className="size-5" color="currentColor" weight="duotone" />
                            <span>Top Up Credits</span>
                        </Link>
                    </Button>
                )}
            </div>
        </>
    );
}

function ErrorRow({ error }: { error: ApiErrorType }) {
    return (
        <div className="flex flex-col items-center justify-center gap-3">
            <div className="bg-destructive-100 dark:bg-destructive-900 mb-3 flex size-16 items-center justify-center rounded-full">
                <WarningIcon
                    className="text-destructive-500 dark:text-destructive-400 size-8"
                    weight="duotone"
                />
            </div>
            <h1 className="text-surface-900 dark:text-surface-100 text-2xl font-black tracking-tighter sm:text-2xl">
                {error?.title ?? error?.message ?? 'An error occurred'}
            </h1>
            <p className="text-surface-600 dark:text-surface-500 text-sm leading-7">
                {error?.description ?? 'An unexpected error occurred. Please try again later.'}
            </p>

            <Button
                className="flex items-center justify-center font-bold"
                color="destructive"
                shape="pill"
                size="lg"
                variant="solid"
            >
                <ArrowsCounterClockwiseIcon className="size-5" color="currentColor" weight="duotone" />
                <span>Retry</span>
            </Button>
        </div>
    );
}

export function CreditsTransactionLoadingRow({
    columns,
    index,
}: {
    index: number;
    columns: ColumnDef<CreditsTransaction>[];
}) {
    return (
        <TableRow key={index} className="pointer-events-none">
            {columns.map((column, columnIndex) => {
                switch (column.id) {
                    case 'type':
                        return (
                            <TableCell key={columnIndex}>
                                <Skeleton className="h-6 w-20" />
                            </TableCell>
                        );
                    case 'credits-added':
                        return (
                            <TableCell key={columnIndex}>
                                <Skeleton className="h-4 w-16" />
                            </TableCell>
                        );
                    case 'credits-used':
                        return (
                            <TableCell key={columnIndex}>
                                <Skeleton className="h-4 w-16" />
                            </TableCell>
                        );
                    case 'description':
                        return (
                            <TableCell key={columnIndex}>
                                <Skeleton className="h-4 w-40" />
                            </TableCell>
                        );
                    case 'date':
                        return (
                            <TableCell key={columnIndex}>
                                <Skeleton className="h-4 w-24" />
                            </TableCell>
                        );
                    case 'actions':
                        return (
                            <TableCell key={columnIndex}>
                                <Skeleton className="aspect-square h-8 w-auto" />
                            </TableCell>
                        );
                    default:
                        return (
                            <TableCell key={columnIndex}>
                                <div className="flex flex-row items-center justify-end gap-2">
                                    <Skeleton className="h-4 w-40" />
                                </div>
                            </TableCell>
                        );
                }
            })}
        </TableRow>
    );
}
