/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { refundCreditsForFailedTranslation } from '../src/utils/supabase/credits';

function ledger(options: { existing?: boolean; insertError?: boolean } = {}) {
    let balance = 10;
    const update = vi.fn(() => {
        throw new Error('Only ledger events may change the balance.');
    });
    const insert = vi.fn(async () => {
        if (options.insertError) return { error: { message: 'Write rejected' } };
        balance += 3;
        return { error: null };
    });
    const accountQuery = {
        select: () => accountQuery,
        eq: () => accountQuery,
        single: async () => ({ data: { amount: balance }, error: null }),
        update,
    };
    const historyQuery = {
        select: () => historyQuery,
        eq: () => historyQuery,
        maybeSingle: async () => ({
            data: options.existing ? { id: 'synthetic-refund' } : null,
            error: null,
        }),
        insert,
    };
    const client = {
        from: (table: string) => (table === 'credits' ? accountQuery : historyQuery),
    } as unknown as SupabaseClient;
    return { client, update, insert, balance: () => balance };
}
const request = {
    userId: 'synthetic-account',
    translationId: 'synthetic-document',
    creditsToRefund: 3,
    reason: 'Synthetic processing failure',
};

describe('credit refunds', () => {
    it('restores credits once through the ledger event', async () => {
        const store = ledger();
        const result = await refundCreditsForFailedTranslation(store.client, request);
        expect(result).toEqual({ success: true, newBalance: 13 });
        expect(store.balance()).toBe(13);
        expect(store.update).not.toHaveBeenCalled();
        expect(store.insert).toHaveBeenCalledOnce();
    });
    it('does not apply a refund already present in the ledger', async () => {
        const store = ledger({ existing: true });
        expect(await refundCreditsForFailedTranslation(store.client, request)).toEqual({
            success: true,
            newBalance: 10,
        });
        expect(store.balance()).toBe(10);
        expect(store.insert).not.toHaveBeenCalled();
    });
    it('reports a failed ledger write without claiming a restored balance', async () => {
        const store = ledger({ insertError: true });
        const result = await refundCreditsForFailedTranslation(store.client, request);
        expect(result.success).toBe(false);
        expect(result.newBalance).toBeUndefined();
        expect(store.balance()).toBe(10);
    });
});
