/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

export type PaginatedQueryParams<T = string> = {
    page: number;
    pageSize: number;
    pageFilter?: string | null;
    pageSortBy?: T | null;
    pageSortOrder: 'asc' | 'desc';
};

export type PaginatedResponse<T> = {
    results: T[];
    total: number;
    pagination?: {
        pageIndex: number;
        pageSize: number;
        pagesCount: number;
        nextPage: number | null;
        prevPage: number | null;
    };
};

export type SearchParams = Record<string, string | string[] | undefined>;
