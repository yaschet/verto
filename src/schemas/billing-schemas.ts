/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { z } from 'zod';
import type { Profile } from '@/types/auth/user';
import type { TypeOf } from 'zod';

export const UserShippingAddressSchema = z.object({
    address: z.string().min(1),
    city: z.string().min(1),
    country: z.string().min(1),
    email: z.string().email(),
    full_name: z.string().min(1),
    phone: z.string().min(1),
    state: z.string().min(1),
    zip_code: z.string().min(1),
});

export async function validateShippingAddress(
    profile: Profile | null,
): Promise<TypeOf<typeof UserShippingAddressSchema> | null> {
    const validatedCustomerShippingAddress = await UserShippingAddressSchema.safeParseAsync({
        address: profile?.address,
        city: profile?.city,
        country: profile?.country,
        email: profile?.email,
        full_name: profile?.full_name,
        phone: profile?.phone,
        state: profile?.state,
        zip_code: profile?.zip_code,
    });

    if (!validatedCustomerShippingAddress.success) {
        return null;
    }

    return validatedCustomerShippingAddress.data;
}

// Schema for the Transactions History Table:
export const transactionsHistoryFilterSchema = z.object({
    transactionType: z
        .object({
            purchase: z.boolean().optional(),
            consumption: z.boolean().optional(),
            bonus: z.boolean().optional(),
            penalty: z.boolean().optional(),
            refund: z.boolean().optional(),
        })
        .refine((data) => Object.values(data).some((value) => value === true), {
            message: 'Please select at least one transaction type.',
        }),
    amountRange: z
        .object({
            min: z.number().min(0, { message: 'Please enter a valid minimum amount.' }).optional(),
            max: z.number().min(0, { message: 'Please enter a valid maximum amount.' }).optional(),
        })
        .refine((data) => (data.min && data.max ? data.max >= data.min : true), {
            message: 'Maximum amount must be greater than or equal to minimum amount.',
        }),
    dateRange: z
        .object({
            start: z.preprocess(
                (arg) => (typeof arg === 'string' ? new Date(arg) : arg),
                z.date({ message: 'Please enter a valid start date.' }).optional(),
            ),
            end: z.preprocess(
                (arg) => (typeof arg === 'string' ? new Date(arg) : arg),
                z.date({ message: 'Please enter a valid end date.' }).optional(),
            ),
        })
        .refine((data) => (data.start && data.end ? data.end >= data.start : true), {
            message: 'End date must be after start date.',
        }),
});
