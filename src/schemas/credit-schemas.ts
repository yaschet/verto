/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { z } from 'zod';
import { VTC_MAXIMUM_AMOUNT, VTC_MINIMUM_AMOUNT } from '@/constants/credits';
import { standardizeError } from '@errors/api-errors';

export const CreditsSchema = z.object({
    credits: z
        .number({
            error: 'Amount must be a number.',
        })
        .int({
            message: 'Amount must be an integer.',
        })
        .gte(VTC_MINIMUM_AMOUNT, {
            message: `Amount must be greater than or equal to ${VTC_MINIMUM_AMOUNT}.`,
        })
        .lte(VTC_MAXIMUM_AMOUNT, {
            message: `Amount must not exceed ${VTC_MAXIMUM_AMOUNT}.`,
        })
        .finite({
            message: 'Amount must be a finite number.',
        })
        .nonnegative({
            message: 'Amount must be a non-negative number.',
        })
        .positive({
            message: 'Amount must be a positive number.',
        }),
});

export async function validateCredits(credits: number | null): Promise<z.infer<typeof CreditsSchema>> {
    const validatedCredits = await CreditsSchema.safeParseAsync({
        credits,
    });

    if (!validatedCredits.success) {
        throw standardizeError({
            code: 'INVALID_CREDITS_AMOUNT',
            description: 'The number of credits must be a positive integer greater than 0.',
            error: true,
            message: 'Invalid credits amount.',
            status: 400,
            title: 'Invalid Credits Amount',
        });
    }

    const creditsAmount = validatedCredits?.data?.credits;

    if (!creditsAmount || creditsAmount < 1) {
        throw standardizeError({
            code: 'INVALID_CREDITS_AMOUNT',
            description: 'The number of credits must be a positive integer greater than 0.',
            error: true,
            message: 'Invalid credits amount.',
            status: 400,
            title: 'Invalid Credits Amount',
        });
    }

    return validatedCredits.data;
}

export const AmountSchema = z.object({
    amount: z
        .number({
            error: 'Amount must be a number.',
        })
        .int({
            message: 'Amount must be an integer.',
        })
        .gte(VTC_MINIMUM_AMOUNT, {
            message: `Amount must be greater than or equal to ${VTC_MINIMUM_AMOUNT}.`,
        })
        .lte(VTC_MAXIMUM_AMOUNT, {
            message: `Amount must not exceed ${VTC_MAXIMUM_AMOUNT}.`,
        })
        .finite({
            message: 'Amount must be a finite number.',
        })
        .nonnegative({
            message: 'Amount must be a non-negative number.',
        })
        .positive({
            message: 'Amount must be a positive number.',
        }),
});
