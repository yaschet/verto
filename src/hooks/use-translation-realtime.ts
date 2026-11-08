/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { createBrowserClient } from '@utils/supabase/client';
import type { TranslationRow } from '@/src/schemas/translation-schemas';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

/**
 * Hook for subscribing to realtime updates for a single translation.
 * Uses Supabase Realtime postgres_changes to receive instant updates
 * when the translation row is modified (status, progress, details).
 *
 * @param translationId - UUID of the translation to subscribe to
 * @param initialData - Initial translation data (from SSR or query cache, can be null)
 * @returns Current translation state (updates in realtime), null if no data
 */
export function useTranslationRealtime(
    translationId: string,
    initialData: TranslationRow | null,
): TranslationRow | null {
    const [translation, setTranslation] = useState<TranslationRow | null>(initialData);
    const [supabase] = useState(() => createBrowserClient());

    // Memoize the update handler
    const handleUpdate = useCallback((payload: RealtimePostgresChangesPayload<TranslationRow>) => {
        if (payload.new && payload.eventType === 'UPDATE') {
            setTranslation(payload.new as TranslationRow);
        }
    }, []);

    useEffect(() => {
        if (!translationId) {
            console.warn('[useTranslationRealtime] Translation ID is missing.');
            return;
        }

        // Subscribe to changes on this specific translation
        const channel = supabase
            .channel(`translation:${translationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'translations',
                    filter: `id=eq.${translationId}`,
                },
                handleUpdate,
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log(
                        `[useTranslationRealtime] Subscribed to translation ${translationId.slice(0, 8)}...`,
                    );
                }
            });

        return () => {
            supabase.removeChannel(channel).then(() => {
                console.log(
                    `[useTranslationRealtime] Unsubscribed from translation ${translationId.slice(0, 8)}...`,
                );
            });
        };
    }, [translationId, supabase, handleUpdate]);

    // Update state if initialData changes (e.g., from query refetch)
    useEffect(() => {
        if (initialData) {
            setTranslation((prev) => {
                if (JSON.stringify(prev) === JSON.stringify(initialData)) return prev;
                return initialData;
            });
        }
    }, [initialData]);

    return translation;
}
