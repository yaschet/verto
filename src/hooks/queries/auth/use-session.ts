/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@utils/supabase/client';
import type { Session } from '@supabase/supabase-js';

export default function useSession() {
    const [session, setSession] = useState<Session | null>(null);

    useEffect(() => {
        const getSession = async () => {
            const supabase = createBrowserClient();
            const sessionResponse = await supabase.auth.getSession();

            if (!sessionResponse || sessionResponse.error) {
                setSession(null);
            } else {
                setSession(sessionResponse?.data?.session ?? null);
            }

            return sessionResponse?.data?.session ?? null;
        };

        getSession().then((sessionData) => sessionData);
    }, []);

    return session;
}
