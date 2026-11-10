/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactQueryStreamedHydration } from '@tanstack/react-query-next-experimental';
import React from 'react';
import { env } from '@/src/env';
import { getQueryClient } from '@/src/queries/tanstack/query-client';
import type { QueryClientProviderProps } from '@tanstack/react-query';

export default function TanstackQueryProvider({
    children,
    ...props
}: { children: React.ReactNode } & Omit<QueryClientProviderProps, 'client'>) {
    const queryClient = getQueryClient();
    const isReactQueryDevtoolsEnabled = Boolean(env.NEXT_PUBLIC_ENABLE_REACT_QUERY_DEVTOOLS);

    return (
        <QueryClientProvider client={queryClient} {...props}>
            <ReactQueryStreamedHydration queryClient={queryClient}>{children}</ReactQueryStreamedHydration>
            {isReactQueryDevtoolsEnabled ? (
                <ReactQueryDevtools buttonPosition="bottom-right" initialIsOpen={false} position="right" />
            ) : null}
        </QueryClientProvider>
    );
}
