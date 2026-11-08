/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { revalidatePath } from 'next/cache';
import { validateUser } from '@/helpers/validate-user';
import { isApiError, standardizeError } from '@/src/errors/api-errors';
import { createServerClient } from '@/src/utils/supabase/server';
import { getLogger } from '@services/logger';
import type { Tables } from '@/types/database/database';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';

/**
 * Adjusts credits for a user via database trigger.
 * The sync_credits trigger automatically updates the credits balance
 * when a transaction is inserted into credits_transactions.
 */
export async function adjustCredits({
    amount,
    description,
    userId,
    type = 'bonus',
}: {
    userId: string;
    amount: number;
    description: string;
    type?: 'bonus' | 'penalty' | 'refund';
}): Promise<ApiResponseOrError<Tables<'credits'>[]>> {
    const logger = getLogger('ACTIONS:ADMIN:USERS:ADJUST_CREDITS');

    try {
        const { user: currentUser } = await validateUser({ requiredRole: 'ADMIN' });

        if (!userId) {
            const errorResponse = standardizeError({
                description: 'User ID is required but missing.',
                message: 'Missing User ID.',
                status: 400,
                success: false,
                title: 'User ID Missing',
            });

            logger.error(['User ID is required but missing.', errorResponse]);
            return errorResponse;
        }

        const supabase = await createServerClient();

        // 1. Ensure credits row exists (for new users with no credits)
        await supabase
            .from('credits')
            .upsert({ profile_id: userId, amount: 0 }, { onConflict: 'profile_id', ignoreDuplicates: true });

        // 2. Get current balance for validation and audit logging
        const { data: currentCredits, error: fetchError } = await supabase
            .from('credits')
            .select('amount')
            .eq('profile_id', userId)
            .single();

        if (fetchError) {
            const errorResponse = standardizeError(fetchError);
            logger.error(['Error fetching current credits:', errorResponse]);
            return errorResponse;
        }

        const currentAmount = currentCredits?.amount ?? 0;

        // 3. For penalty, validate sufficient balance
        if (type === 'penalty' && currentAmount < amount) {
            const errorResponse = standardizeError({
                description: `Cannot apply penalty of ${amount} credits. Current balance is only ${currentAmount}.`,
                message: 'Insufficient balance for penalty.',
                status: 400,
                success: false,
                title: 'Insufficient Balance',
            });

            logger.error(['Insufficient balance for penalty:', errorResponse]);
            return errorResponse;
        }

        // 4. Insert transaction - the sync_credits trigger handles the balance update
        const { error: transactionError } = await supabase.from('credits_transactions').insert({
            profile_id: userId,
            credits: amount,
            type: type,
            description: description,
            details: {
                admin_id: currentUser.id,
            },
        });

        if (transactionError) {
            const errorResponse = standardizeError(transactionError);
            logger.error(['Error inserting credit transaction:', errorResponse]);
            return errorResponse;
        }

        // 5. Fetch final balance after trigger has updated it
        const { data: finalCredits, error: finalFetchError } = await supabase
            .from('credits')
            .select('*')
            .eq('profile_id', userId)
            .single();

        if (finalFetchError) {
            const errorResponse = standardizeError(finalFetchError);
            logger.error(['Error fetching final credits:', errorResponse]);
            return errorResponse;
        }

        const newAmount = finalCredits?.amount ?? 0;

        // 6. Log to audit_log_entries
        await supabase.from('audit_log_entries').insert({
            id: crypto.randomUUID(),
            payload: {
                action: 'ADJUST_CREDITS',
                actor_id: currentUser.id,
                target_id: userId,
                changes: {
                    amount,
                    type,
                    description,
                    previous_amount: currentAmount,
                    new_amount: newAmount,
                },
                timestamp: new Date().toISOString(),
            },
            ip_address: '0.0.0.0',
        });

        revalidatePath('/admin/users');

        return {
            data: finalCredits ? [finalCredits] : [],
            description: `Credits have been successfully adjusted. New balance: ${newAmount}.`,
            message: 'Credits adjusted successfully.',
            status: 200,
            success: true,
            title: 'Credits Adjusted',
        };
    } catch (error) {
        const errorResponse: ApiErrorType = isApiError(error)
            ? (error as ApiErrorType)
            : standardizeError(error);
        logger.error(['Error adjusting credits:', errorResponse]);
        return errorResponse;
    }
}
