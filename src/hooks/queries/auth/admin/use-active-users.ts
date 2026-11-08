/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import useSession from '@hooks/queries/auth/use-session';
import { activeUsersQueryOptions } from '@queries/tanstack/admin/users-query-options';
import { getQueryClient } from '@queries/tanstack/query-client';
import { createBrowserClient } from '@utils/supabase/client';

export const useActiveUsers = () => {
    const session = useSession();
    const userId = session?.user?.id ?? undefined;
    const queryClient = getQueryClient();

    const supabase = createBrowserClient();

    const query = useQuery(activeUsersQueryOptions(userId));

    useEffect(() => {
        if (!session?.user?.id) return;

        const realtimeChannel = supabase
            .channel('realtime:public')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'active_users' },
                async (_payload) => {
                    await queryClient.invalidateQueries({
                        queryKey: ['active-users-count'],
                    });
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(realtimeChannel).then((r) => console.log('Channel removed!', r));
        };
    }, [queryClient, userId, session?.user?.id, supabase]);

    return query;
};
