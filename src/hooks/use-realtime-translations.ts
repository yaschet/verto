/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { useEffect } from 'react';
import { createBrowserClient } from '@utils/supabase/client';
import type { TranslationRow } from '@/src/schemas/translation-schemas';
import type { PaginatedResponse } from '@/types/rest/common';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { QueryObserverResult, RefetchOptions } from '@tanstack/react-query';

type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE';

export type RealtimeTranslationPayload = {
    eventType: RealtimeEvent;
    payload: RealtimePostgresChangesPayload<TranslationRow>;
};

export const useRealtimeTranslations = ({
    onDelete,
    onInsert,
    onUpdate,
    refetch,
    userId,
}: {
    userId: string;
    refetch?: (
        options?: RefetchOptions,
    ) => Promise<QueryObserverResult<PaginatedResponse<TranslationRow>, Error>>;
    onInsert?: (translation: TranslationRow) => void;
    onUpdate?: (translation: TranslationRow) => void;
    onDelete?: (translationId: string) => void;
}) => {
    const supabase = createBrowserClient();

    useEffect(() => {
        if (!userId) {
            console.warn('User ID is missing. Cannot subscribe to realtime translations.');
            return;
        }

        const channel = supabase
            .channel('realtime-translations')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    filter: `profile_id=eq.${userId}`,
                    schema: 'public',
                    table: 'translations',
                },
                (payload: RealtimePostgresChangesPayload<TranslationRow>) => {
                    // Handle different event types with specific callbacks
                    switch (payload.eventType) {
                        case 'INSERT':
                            onInsert?.(payload.new as TranslationRow);
                            break;
                        case 'UPDATE':
                            onUpdate?.(payload.new as TranslationRow);
                            break;
                        case 'DELETE':
                            if (payload.old.id) {
                                onDelete?.(payload.old.id);
                            }
                            break;
                    }
                },
            )
            .subscribe();

        console.log('Subscribed to realtime translations.');

        return () => {
            supabase.removeChannel(channel).then((r) => r);
        };
    }, [userId, refetch, onInsert, onUpdate, onDelete, supabase]);
};
