/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * Credit Management Utilities for Supabase
 *
 * This module provides functions for managing user credits for translations.
 * Deduction uses a database RPC. Ledger inserts project balance changes through
 * the database trigger; privileged writes remain subject to caller authorization.
 */

import { calculateCreditsRequired } from '@constants/credits';
import { safeSingle } from '@utils/supabase/safe-single';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Result of credit deduction operation
 */
export type DeductCreditsResult = {
    success: boolean;
    previous_balance?: number;
    new_balance?: number;
    credits_deducted?: number;
    transaction_id?: string;
    message?: string;
    error?: string;
    error_code?: string;
    required?: number;
    available?: number;
};

/**
 * Result of credit balance check
 */
export type CreditBalanceCheck = {
    sufficient: boolean;
    currentBalance: number;
    required: number;
};

/**
 * Deduct credits for a translation using atomic database transaction.
 *
 * This function calls the Supabase RPC `deduct_credits_for_translation` which:
 * - Locks the user's profile row to prevent race conditions
 * - Validates sufficient credit balance
 * - Deducts credits atomically
 * - Creates an audit trail in credit_transactions table
 *
 * @param supabase - Supabase client instance (must be authenticated or service role)
 * @param params - Deduction parameters
 * @returns Promise resolving to DeductCreditsResult with success status and details
 *
 * @example
 * ```typescript
 * const result = await deductCreditsForTranslation(supabase, {
 *   userId: 'uuid-here',
 *   translationId: 'translation-uuid',
 *   pageCount: 15,
 *   documentName: 'contract.pdf'
 * });
 *
 * if (result.success) {
 *   console.log(`Deducted ${result.credits_deducted} credits`);
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export async function deductCreditsForTranslation(
    supabase: SupabaseClient,
    params: {
        userId: string;
        translationId: string;
        pageCount: number;
        documentName: string;
    },
): Promise<DeductCreditsResult> {
    // Calculate credits required based on page count
    const creditsRequired = calculateCreditsRequired(params.pageCount);

    // Call database RPC function for atomic credit deduction
    const { data, error } = await supabase.rpc('deduct_credits_for_translation', {
        p_user_id: params.userId,
        p_translation_id: params.translationId,
        p_credits_required: creditsRequired,
        p_document_name: params.documentName,
        p_page_count: params.pageCount,
    });

    // Handle RPC call errors
    if (error) {
        return {
            success: false,
            error: error.message,
            error_code: 'RPC_ERROR',
        };
    }

    return data as DeductCreditsResult;
}

/**
 * Check if user has sufficient credits for a translation.
 *
 * This is a lightweight check that can be done before attempting the actual deduction.
 * Use this for UI feedback (e.g., showing warnings before upload).
 *
 * Note: Always perform actual deduction using `deductCreditsForTranslation()` as
 * balance could change between check and deduction. This function is for UX only.
 *
 * @param supabase - Supabase client instance
 * @param userId - User's profile ID
 * @param requiredCredits - Number of credits required
 * @returns Promise resolving to CreditBalanceCheck with sufficiency status
 *
 * @example
 * ```typescript
 * const check = await checkCreditBalance(supabase, userId, 5);
 * if (!check.sufficient) {
 *   alert(`You need ${check.required} credits but only have ${check.currentBalance}`);
 * }
 * ```
 */
export async function checkCreditBalance(
    supabase: SupabaseClient,
    userId: string,
    requiredCredits: number,
): Promise<CreditBalanceCheck> {
    const { data, error } = await safeSingle(
        await supabase.from('profiles').select('credits').eq('id', userId).single(),
    );

    if (error || !data) {
        throw new Error(
            `Failed to fetch credit balance: ${error?.message || 'User not found or creating profile'}`,
        );
    }

    return {
        sufficient: data.credits >= requiredCredits,
        currentBalance: data.credits,
        required: requiredCredits,
    };
}

/**
 * Get user's current credit balance.
 *
 * @param supabase - Supabase client instance
 * @param userId - User's profile ID
 * @returns Promise resolving to credit balance number
 *
 * @throws {Error} If user not found or query fails
 */
export async function getUserCreditBalance(supabase: SupabaseClient, userId: string): Promise<number> {
    const { data, error } = await safeSingle(
        await supabase.from('credits').select('amount').eq('profile_id', userId).single(),
    );

    if (error || !data) {
        throw new Error(`Failed to fetch credit balance: ${error?.message || 'User not found'}`);
    }

    return data.amount;
}

/**
 * Refund credits for a failed translation.
 *
 * This function adds credits back to the user's account when a translation fails,
 * ensuring users are not charged for incomplete services.
 *
 * @param supabase - Supabase client instance (must be service role for refunds)
 * @param params - Refund parameters
 * @returns Promise resolving to refund success status
 *
 * @example
 * ```typescript
 * const result = await refundCreditsForFailedTranslation(supabase, {
 *   userId: 'uuid-here',
 *   translationId: 'translation-uuid',
 *   creditsToRefund: 5,
 *   reason: 'Google Cloud billing error'
 * });
 * ```
 */
export async function refundCreditsForFailedTranslation(
    supabase: SupabaseClient,
    params: {
        userId: string;
        translationId: string;
        creditsToRefund: number;
        reason: string;
    },
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
    try {
        // Read the balance used for the response estimate.
        const { data: creditData, error: fetchError } = await safeSingle(
            await supabase.from('credits').select('amount').eq('profile_id', params.userId).single(),
        );

        if (fetchError || !creditData) {
            return {
                success: false,
                error: `Failed to fetch credit balance: ${fetchError?.message || 'User not found'}`,
            };
        }

        // Check if already refunded to prevent double-refunds on task retries
        const { data: existingRefund } = await supabase
            .from('credits_transactions')
            .select('id')
            .eq('translation_id', params.translationId)
            .eq('type', 'refund')
            .maybeSingle();

        if (existingRefund) {
            return {
                success: true,
                newBalance: creditData.amount,
            };
        }

        const newBalance = creditData.amount + params.creditsToRefund;

        // The ledger trigger applies the refund; do not update the balance separately.
        const { error: transactionError } = await supabase.from('credits_transactions').insert({
            profile_id: params.userId,
            translation_id: params.translationId,
            credits: params.creditsToRefund,
            type: 'refund',
            description: 'Credit refund for failed translation',
            details: {
                reason: params.reason,
                refunded_at: new Date().toISOString(),
            },
        });

        if (transactionError) {
            return {
                success: false,
                error: `Failed to record refund: ${transactionError.message}`,
            };
        }

        return {
            success: true,
            newBalance,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? (error as Error).message : 'Unknown error during refund',
        };
    }
}
