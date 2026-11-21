/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import type { Control, FieldErrors } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@components/ui/form';
import { Input } from '@components/ui/input';
import type { AdminUserFormData } from '@/types/admin/user-forms';
import type { FieldPath } from 'react-hook-form';

interface ContactInformationFieldsProps {
    control: Control<AdminUserFormData>;
    errors: FieldErrors<AdminUserFormData>;
    baseName?: 'contactInformation';
    disabled?: boolean;
}

/**
 * Contact Information Fields Component
 *
 * Renders atomic form fields for contact information:
 * - email (email input with validation)
 * - phoneNumber (tel input with validator.js validation)
 * - address, address2 (optional) (text inputs)
 * - city, state, zipCode (text inputs in two-column grid)
 * - country (text input)
 */
export function ContactInformationFields({
    control,
    errors,
    baseName = 'contactInformation',
    disabled,
}: ContactInformationFieldsProps) {
    const getFieldName = (field: string) => `${baseName}.${field}` as FieldPath<AdminUserFormData>;

    const sectionErrors = errors[baseName];

    return (
        <div className="space-y-4 w-full">
            {/* Email */}
            <FormField
                control={control}
                name={getFieldName('email')}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Email address</FormLabel>
                        <FormControl>
                            <Input
                                autoComplete="email"
                                placeholder="john.doe@example.com"
                                type="email"
                                disabled={disabled}
                                hasError={!!sectionErrors?.email}
                                {...field}
                                value={(field.value as string) ?? ''}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* Phone Number */}
            <FormField
                control={control}
                name={getFieldName('phoneNumber')}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Phone number</FormLabel>
                        <FormControl>
                            <Input
                                autoComplete="tel"
                                placeholder="+1 (555) 123-4567"
                                type="tel"
                                disabled={disabled}
                                hasError={!!sectionErrors?.phoneNumber}
                                {...field}
                                value={(field.value as string) ?? ''}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* Address */}
            <FormField
                control={control}
                name={getFieldName('address')}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Street address</FormLabel>
                        <FormControl>
                            <Input
                                autoComplete="address-line1"
                                placeholder="123 Main Street"
                                disabled={disabled}
                                hasError={!!sectionErrors?.address}
                                {...field}
                                value={(field.value as string) ?? ''}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* Address Line 2 (Optional) */}
            <FormField
                control={control}
                name={getFieldName('address2')}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>
                            Address line 2 <span className="text-muted-foreground text-xs">(optional)</span>
                        </FormLabel>
                        <FormControl>
                            <Input
                                autoComplete="address-line2"
                                placeholder="Apt, suite, unit, building, floor, etc."
                                disabled={disabled}
                                hasError={!!sectionErrors?.address2}
                                {...field}
                                value={(field.value as string) ?? ''}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* City and State in two columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={control}
                    name={getFieldName('city')}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                                <Input
                                    autoComplete="address-level2"
                                    placeholder="New York"
                                    disabled={disabled}
                                    hasError={!!sectionErrors?.city}
                                    {...field}
                                    value={(field.value as string) ?? ''}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={control}
                    name={getFieldName('state')}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>State / Province</FormLabel>
                            <FormControl>
                                <Input
                                    autoComplete="address-level1"
                                    placeholder="NY"
                                    disabled={disabled}
                                    hasError={!!sectionErrors?.state}
                                    {...field}
                                    value={(field.value as string) ?? ''}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            {/* ZIP Code and Country in two columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={control}
                    name={getFieldName('zipCode')}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>ZIP / Postal code</FormLabel>
                            <FormControl>
                                <Input
                                    autoComplete="postal-code"
                                    placeholder="10001"
                                    disabled={disabled}
                                    hasError={!!sectionErrors?.zipCode}
                                    {...field}
                                    value={(field.value as string) ?? ''}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={control}
                    name={getFieldName('country')}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Country</FormLabel>
                            <FormControl>
                                <Input
                                    autoComplete="country-name"
                                    placeholder="United States"
                                    disabled={disabled}
                                    hasError={!!sectionErrors?.country}
                                    {...field}
                                    value={(field.value as string) ?? ''}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
    );
}
