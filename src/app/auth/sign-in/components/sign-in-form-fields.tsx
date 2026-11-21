/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import React from 'react';
import { FormField, FormItem, FormMessage } from '@components/ui/form';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import type { PasswordSignInSchema } from '@schemas/auth-schemas';
import type { Control, FieldErrors } from 'react-hook-form';
import type { z } from 'zod';

type SignInFormFieldsProps = {
    control: Control<z.infer<typeof PasswordSignInSchema>>;
    errors: FieldErrors;
    touchedFields: Record<string, boolean>;
};

const SignInFormFields: React.FC<SignInFormFieldsProps> = ({ control, errors, touchedFields }) => {
    return (
        <>
            <FormField
                control={control}
                name="email"
                render={({ field }) => (
                    <FormItem className="w-full">
                        <Label className="text-foreground text-sm font-medium" htmlFor="email">
                            Email
                        </Label>
                        <div className="w-full">
                            <Input
                                autoFocus
                                autoComplete="email"
                                hasError={!!(errors.email?.message && touchedFields.email)}
                                id="email"
                                placeholder="you@example.com"
                                type="email"
                                {...field}
                            />
                        </div>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={control}
                name="password"
                render={({ field }) => (
                    <FormItem className="w-full">
                        <Label className="text-foreground text-sm font-medium" htmlFor="password">
                            Password
                        </Label>
                        <div className="w-full">
                            <Input
                                autoComplete="current-password"
                                hasError={!!(errors.password?.message && touchedFields.password)}
                                id="password"
                                placeholder="••••••••"
                                type="password"
                                {...field}
                            />
                        </div>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </>
    );
};

export default SignInFormFields;
