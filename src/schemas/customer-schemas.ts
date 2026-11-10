/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { z } from 'zod';
import type { Tables } from '@/types/database/database';

// Extract the keys of 'extended_customer_view' dynamically:
export type CustomerColumn = keyof Tables<'extended_customer_view'>;

// Utility function to create an enum from a union type
function createEnum<T extends string>(keys: T[]): { [K in T]: K } {
    return keys.reduce((acc, key) => {
        acc[key] = key;
        return acc;
    }, Object.create(null));
}

// Convert the object to a Zod Enum compatible array:
export const CustomerColumnsArray = Object.keys({} as Tables<'extended_customer_view'>) as [
    CustomerColumn,
    ...CustomerColumn[],
];

// Create the enum dynamically from the CustomerColumn type
export const CustomerColumnEnumObject = createEnum<CustomerColumn>(CustomerColumnsArray);

// Make an object out of the original type to use it in the Zod schema:
export const CustomerColumnObject = CustomerColumnsArray.reduce(
    (acc, key) => {
        acc[key] = z.string();
        return acc;
    },
    {} as Record<CustomerColumn, z.ZodString>,
);

export const CustomerPublicColumnsArray: [CustomerColumn, ...CustomerColumn[]] = [
    'display_name',
    'email',
    'phone',
    'number_of_translations',
];

// Define the Zod schema for the customer query parameters
export const CustomerColumnSchema = z.enum(CustomerColumnsArray, {
    error: `The page sort by field is invalid, and must be one of the following: ${CustomerColumnsArray.join(', ')}.`,
});

export type CustomerRow = Tables<'extended_customer_view'>;

export type RawCustomerRow = Tables<'customers'>;
