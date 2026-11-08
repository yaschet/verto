/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { CaretLeftIcon, CaretRightIcon, DotsThreeIcon } from '@phosphor-icons/react';
import * as React from 'react';
import { Button, type ButtonProps } from '@components/ui/button';
import { cn } from '@library/utils';
import type { TableMetaType } from '@/types/core/tanstack';
import type { Table } from '@tanstack/react-table';

// --- Pagination Primitives (Shadcn-like) ---

function PaginationRoot({ className, ...props }: React.ComponentProps<'nav'>) {
    return (
        <nav
            aria-label="pagination"
            className={cn('mx-auto flex w-full justify-center', className)}
            role="navigation"
            {...props}
        />
    );
}
PaginationRoot.displayName = 'PaginationRoot';

const PaginationContent = React.forwardRef<HTMLUListElement, React.ComponentProps<'ul'>>(
    ({ className, ...props }, ref) => (
        <ul ref={ref} className={cn('flex flex-row items-center gap-2', className)} {...props} />
    ),
);
PaginationContent.displayName = 'PaginationContent';

const PaginationItem = React.forwardRef<HTMLLIElement, React.ComponentProps<'li'>>(
    ({ className, ...props }, ref) => <li ref={ref} className={cn('', className)} {...props} />,
);
PaginationItem.displayName = 'PaginationItem';

type PaginationLinkProps = {
    isActive?: boolean;
} & ButtonProps;

function PaginationLink({
    children,
    className,
    color = 'default',
    isActive,
    size = 'icon-md',
    variant = 'plain',
    ...props
}: PaginationLinkProps) {
    return (
        <Button
            aria-current={isActive ? 'page' : undefined}
            className={cn('size-9 p-0', className)}
            color={isActive ? 'primary' : color}
            size={size}
            variant={isActive ? 'solid' : variant}
            {...props}
        >
            {children}
        </Button>
    );
}
PaginationLink.displayName = 'PaginationLink';

function PaginationPrevious({ className, ...props }: React.ComponentProps<typeof PaginationLink>) {
    return (
        <PaginationLink
            aria-label="Go to previous page"
            className={cn('', className)}
            size="icon-md"
            {...props}
        >
            <CaretLeftIcon className="size-4" />
        </PaginationLink>
    );
}
PaginationPrevious.displayName = 'PaginationPrevious';

function PaginationNext({ className, ...props }: React.ComponentProps<typeof PaginationLink>) {
    return (
        <PaginationLink aria-label="Go to next page" className={cn('', className)} size="icon-md" {...props}>
            <CaretRightIcon className="size-4" />
        </PaginationLink>
    );
}
PaginationNext.displayName = 'PaginationNext';

function PaginationEllipsis({ className, ...props }: React.ComponentProps<'span'>) {
    return (
        <span aria-hidden className={cn('flex size-9 items-center justify-center', className)} {...props}>
            <DotsThreeIcon className="size-4" />
            <span className="sr-only">More pages</span>
        </span>
    );
}
PaginationEllipsis.displayName = 'PaginationEllipsis';

// --- Helper for Pagination Logic ---

function getPaginationRange(currentPage: number, totalPages: number, siblingCount = 1) {
    const totalPageNumbers = siblingCount + 5;

    if (totalPageNumbers >= totalPages) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

    const firstPageIndex = 1;
    const lastPageIndex = totalPages;

    if (!shouldShowLeftDots && shouldShowRightDots) {
        const leftItemCount = 3 + 2 * siblingCount;
        const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
        return [...leftRange, '...', totalPages];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
        const rightItemCount = 3 + 2 * siblingCount;
        const rightRange = Array.from(
            { length: rightItemCount },
            (_, i) => totalPages - rightItemCount + i + 1,
        );
        return [firstPageIndex, '...', ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
        const middleRange = Array.from(
            { length: rightSiblingIndex - leftSiblingIndex + 1 },
            (_, i) => leftSiblingIndex + i,
        );
        return [firstPageIndex, '...', ...middleRange, '...', lastPageIndex];
    }

    return [];
}

// --- Main Export (Replacement) ---

export function Pagination<TData>({ tableInstance }: { tableInstance: Table<TData> }) {
    const { pagination } = tableInstance.getState();
    const pageIndex = pagination.pageIndex;
    const pageCount = tableInstance.getPageCount();

    const meta = tableInstance.options?.meta as TableMetaType;
    const isPlaceholderData = meta?.isPlaceholderData ?? false;

    // Convert 0-based index to 1-based page number for display
    const currentPage = pageIndex + 1;

    const pages = getPaginationRange(currentPage, pageCount);

    if (pageCount <= 1) return null;

    return (
        <PaginationRoot>
            <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious
                        disabled={isPlaceholderData || !tableInstance.getCanPreviousPage()}
                        onClick={() => tableInstance.previousPage()}
                    >
                        Previous
                    </PaginationPrevious>
                </PaginationItem>

                {pages.map((page, i) => {
                    if (page === '...') {
                        return (
                            <PaginationItem key={`ellipsis-${i}`}>
                                <PaginationEllipsis />
                            </PaginationItem>
                        );
                    }

                    return (
                        <PaginationItem key={page}>
                            <PaginationLink
                                disabled={isPlaceholderData}
                                isActive={page === currentPage}
                                onClick={() => tableInstance.setPageIndex((page as number) - 1)}
                            >
                                {page}
                            </PaginationLink>
                        </PaginationItem>
                    );
                })}

                <PaginationItem>
                    <PaginationNext
                        disabled={isPlaceholderData || !tableInstance.getCanNextPage()}
                        onClick={() => tableInstance.nextPage()}
                    >
                        Next
                    </PaginationNext>
                </PaginationItem>
            </PaginationContent>
        </PaginationRoot>
    );
}

export default Pagination;

export {
    PaginationRoot,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
    PaginationEllipsis,
};
