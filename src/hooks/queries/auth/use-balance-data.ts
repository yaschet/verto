/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import useSession from '@hooks/queries/auth/use-session';
import { balanceDataQueryOptions } from '@queries/tanstack/billing-query-options';

export const useBalanceData = () => {
    const session = useSession();

    return useQuery(balanceDataQueryOptions(session?.user?.id ?? undefined));
};
