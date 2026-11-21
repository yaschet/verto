/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { useEffect, useRef } from 'react';
import { createBrowserClient } from '@/utils/supabase/client';
import { useUserData } from '@hooks/queries/auth/use-user-data';

const useHeartbeat = ({ interval = 60 * 1000 }: { interval?: number } = {}) => {
    const logger = console; // useRef(getLogger('HOOKS:QUERIES:AUTH:USE-HEARTBEAT')).current;
    const supabase = useRef(createBrowserClient()).current;
    const { data, isLoading, isPending } = useUserData();
    const { user } = data ?? {};

    useEffect(() => {
        if (!user || isLoading || isPending) {
            logger.debug('User data is not available. Skipping heartbeat...');
            return;
        }

        const userId = user?.id ?? null;

        if (!userId) {
            logger.debug('User ID is not available. Skipping heartbeat...');
            return;
        }

        logger.debug('Starting heartbeat...');

        const heartbeatInterval = setInterval(async () => {
            try {
                const { error } = await supabase.from('user_activity').insert({
                    profile_id: userId,
                    type: 'heartbeat',
                    details: {
                        message: 'User is active.',
                    },
                });

                if (error) {
                    logger.error('Heartbeat insert error:', {
                        message: error.message,
                        details: error.details,
                        code: error.code,
                        name: error.name,
                        hint: error.hint,
                        stack: error.stack,
                    });
                }

                logger.debug('Heartbeat sent.');
            } catch (caughtError) {
                logger.error('Heartbeat error:', (caughtError as Error)?.message ?? caughtError);
            }
        }, interval);

        return () => {
            logger.debug('Stopping heartbeat...');
            clearInterval(heartbeatInterval);
        };
    }, [user?.id, interval, isLoading, isPending]);
};

export default useHeartbeat;
