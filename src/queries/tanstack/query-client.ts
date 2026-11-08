/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { QueryClient, defaultShouldDehydrateQuery, isServer } from '@tanstack/react-query';

/**
 * Create a new query client with default options:
 * - Dehydrate pending queries
 * - Set global query options
 * @returns {QueryClient}
 * @see https://tanstack.com/query/latest/docs/reference/QueryClient
 */
function makeQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: {
            dehydrate: {
                // Include pending queries in dehydration:
                shouldDehydrateQuery: (query) =>
                    defaultShouldDehydrateQuery(query) || query.state.status === 'pending',
            },
            queries: {
                gcTime: 5 * 60 * 1000,
                refetchOnMount: false,
                refetchOnWindowFocus: false,
                retry: 1,
                staleTime: 60 * 1000,
            },
        },
    });
}

let browserQueryClient: QueryClient;

/**
 * Get the query client for the current environment.
 *
 * @returns {QueryClient}
 */
export function getQueryClient(): QueryClient {
    if (isServer) {
        // Server: always make a new query client.
        return makeQueryClient();
    } else {
        // Browser: make a new query client if we don't already have one
        // This is very important, so we don't re-make a new client if React
        // suspends during the initial render. This may not be needed if we
        // have a suspense boundary BELOW the creation of the query client.
        if (!browserQueryClient) browserQueryClient = makeQueryClient();
        return browserQueryClient;
    }
}
