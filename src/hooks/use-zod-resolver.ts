/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { useCallback } from 'react';
import type { FieldValues, FieldErrors, Resolver } from 'react-hook-form';
import type { z } from 'zod';

export const useZodResolver = <T extends FieldValues>(schema: z.Schema<T>): Resolver<T> => {
    return useCallback(
        async (values) => {
            try {
                const result = schema.safeParse(values);

                if (result.success) {
                    return {
                        values: result.data,
                        errors: {},
                    };
                }

                type ErrorTree = { [key: PropertyKey]: ErrorTree | { type: string; message: string } };
                const errors: ErrorTree = {};
                const zodIssues = result.error.issues;

                for (const issue of zodIssues) {
                    const path = issue.path;
                    let current = errors;

                    for (let i = 0; i < path.length; i++) {
                        const key = path[i];

                        if (i === path.length - 1) {
                            current[key] = {
                                type: issue.code,
                                message: issue.message,
                            };
                        } else {
                            // Ensure nested object exists
                            if (!current[key]) {
                                current[key] = {};
                            }
                            current = current[key] as ErrorTree;
                        }
                    }
                }

                return {
                    values: {},
                    errors: errors as FieldErrors<T>,
                };
            } catch (error) {
                console.error('Validation error:', error);
                return {
                    values: {},
                    errors: {
                        root: {
                            type: 'manual',
                            message: 'Validation failed unexpectedly.',
                        },
                    } as FieldErrors<T>,
                };
            }
        },
        [schema],
    );
};
