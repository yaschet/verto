/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { useState } from 'react';
import type { Control, FieldErrors, FieldPath } from 'react-hook-form';
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@components/ui/form';
import { Input } from '@components/ui/input';
import { Checkbox } from '@components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { checkPasswordStrength } from '@library/utils';
import type { AdminUserFormData } from '@/types/admin/user-forms';

interface AccountSecurityFieldsProps {
    control: Control<AdminUserFormData>;
    errors: FieldErrors<AdminUserFormData>;
    baseName?: 'accountSecurity';
    disabled?: boolean;
    /**
     * Whether password is required (true for Add mode, false for Edit mode)
     */
    passwordRequired?: boolean;
    /**
     * Whether to show role field (admin-only)
     */
    showRoleField?: boolean;
}

/**
 * Account Security Fields Component
 *
 * Renders atomic form fields for account security:
 * - role (ADMIN/USER select, only if showRoleField=true)
 * - password (with strength indicator)
 * - passwordConfirmation
 * - commercialEmails (checkbox)
 *
 * Password is required for Add mode, optional for Edit mode.
 * The password strength is validated using the checkPasswordStrength utility.
 */
export function AccountSecurityFields({
    control,
    errors,
    baseName = 'accountSecurity',
    disabled,
    passwordRequired = true,
    showRoleField = true,
}: AccountSecurityFieldsProps) {
    const [passwordValue, setPasswordValue] = useState('');
    const passwordStrength = passwordValue ? checkPasswordStrength(passwordValue) : null;

    // Role options
    const roleOptions = [
        { label: 'User', value: 'USER' },
        { label: 'Administrator', value: 'ADMIN' },
    ];

    // Helper to build field names with baseName prefix
    const getFieldName = (field: string) => `${baseName}.${field}` as FieldPath<AdminUserFormData>;

    const sectionErrors = errors[baseName];

    return (
        <div className="space-y-4 w-full">
            {/* Role Select (Admin only) */}
            {showRoleField && (
                <FormField
                    control={control}
                    name="role"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {roleOptions.map((role) => (
                                        <SelectItem key={role.value} value={role.value}>
                                            {role.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                Administrators have full access to the admin panel.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            )}

            {/* Password */}
            <FormField
                control={control}
                name={getFieldName('password')}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>
                            Password{' '}
                            {!passwordRequired && (
                                <span className="text-muted-foreground text-xs">
                                    (leave blank to keep current)
                                </span>
                            )}
                        </FormLabel>
                        <FormControl>
                            <Input
                                autoComplete="new-password"
                                placeholder={
                                    passwordRequired ? 'Enter password' : 'Enter new password (optional)'
                                }
                                type="password"
                                disabled={disabled}
                                hasError={!!sectionErrors?.password}
                                {...field}
                                value={(field.value as string) ?? ''}
                                onChange={(e) => {
                                    field.onChange(e);
                                    setPasswordValue(e.target.value);
                                }}
                            />
                        </FormControl>
                        {passwordStrength && (
                            <div className="flex items-center gap-2 mt-1">
                                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-300 ${
                                            passwordStrength.label === 'Weak'
                                                ? 'bg-destructive w-1/4'
                                                : passwordStrength.label === 'Medium'
                                                  ? 'bg-warning w-2/4'
                                                  : passwordStrength.label === 'Strong'
                                                    ? 'bg-success w-3/4'
                                                    : 'bg-success w-full'
                                        }`}
                                    />
                                </div>
                                <span
                                    className={`text-xs font-medium ${
                                        passwordStrength.label === 'Weak'
                                            ? 'text-destructive'
                                            : passwordStrength.label === 'Medium'
                                              ? 'text-warning'
                                              : 'text-success'
                                    }`}
                                >
                                    {passwordStrength.label}
                                </span>
                            </div>
                        )}
                        <FormDescription>
                            {passwordRequired
                                ? 'Must be at least medium strength.'
                                : 'Leave blank to keep the current password.'}
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* Password Confirmation */}
            <FormField
                control={control}
                name={getFieldName('passwordConfirmation')}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>
                            Confirm password{' '}
                            {!passwordRequired && (
                                <span className="text-muted-foreground text-xs">(optional)</span>
                            )}
                        </FormLabel>
                        <FormControl>
                            <Input
                                autoComplete="new-password"
                                placeholder="Confirm password"
                                type="password"
                                disabled={disabled}
                                hasError={!!sectionErrors?.passwordConfirmation}
                                {...field}
                                value={(field.value as string) ?? ''}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* Commercial Emails Checkbox */}
            <FormField
                control={control}
                name="accountSecurity.commercialEmails"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl bg-surface-200/50 dark:bg-surface-800 p-4">
                        <FormControl>
                            <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={disabled}
                            />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                            <FormLabel>Marketing emails</FormLabel>
                            <FormDescription>
                                Receive emails about new features, tips, and promotional offers.
                            </FormDescription>
                        </div>
                    </FormItem>
                )}
            />
        </div>
    );
}
