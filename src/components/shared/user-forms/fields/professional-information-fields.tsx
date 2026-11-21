/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { useState } from 'react';
import type { Control, FieldErrors } from 'react-hook-form';
import { useFormContext } from 'react-hook-form';
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@components/ui/form';
import { Input } from '@components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { TagInput } from '@components/ui/tag-input';
import type { Tag } from '@components/ui/tag-input';
import type { AdminUserFormData } from '@/types/admin/user-forms';
import type { FieldPath } from 'react-hook-form';

interface ProfessionalInformationFieldsProps {
    control: Control<AdminUserFormData>;
    errors: FieldErrors<AdminUserFormData>;
    baseName?: 'professionalInformation';
    disabled?: boolean;
}

/**
 * Professional Information Fields Component
 *
 * Renders atomic form fields for professional information:
 * - companyName (optional text input)
 * - translationExperience (enum select: Beginner/Intermediate/Advanced/Expert)
 * - qualifications (TagInput for array of {id, text})
 * - professionalAffiliations (TagInput for array of {id, text})
 * - specializations (TagInput for array of {id, text})
 *
 * Note: Resume upload is omitted for MVP (complex file handling)
 */
export function ProfessionalInformationFields({
    control,
    errors,
    baseName = 'professionalInformation',
    disabled,
}: ProfessionalInformationFieldsProps) {
    const { setValue, getValues } = useFormContext<AdminUserFormData>();

    const getFieldName = (field: string) => `${baseName}.${field}` as FieldPath<AdminUserFormData>;

    const sectionErrors = errors[baseName];

    // Experience level options
    const experienceLevels = [
        { label: 'Beginner', value: 'Beginner' },
        { label: 'Intermediate', value: 'Intermediate' },
        { label: 'Advanced', value: 'Advanced' },
        { label: 'Expert', value: 'Expert' },
    ];

    // Local state for TagInputs (dual state pattern from registration form)
    const [qualifications, setQualifications] = useState<Tag[]>(
        getValues(`${baseName}.qualifications`) ?? [],
    );
    const [professionalAffiliations, setProfessionalAffiliations] = useState<Tag[]>(
        getValues(`${baseName}.professionalAffiliations`) ?? [],
    );
    const [specializations, setSpecializations] = useState<Tag[]>(
        getValues(`${baseName}.specializations`) ?? [],
    );

    return (
        <div className="space-y-4 w-full">
            {/* Company Name (optional) */}
            <FormField
                control={control}
                name={getFieldName('companyName')}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>
                            Company name <span className="text-muted-foreground text-xs">(optional)</span>
                        </FormLabel>
                        <FormControl>
                            <Input
                                autoComplete="organization"
                                placeholder="Acme Corporation"
                                disabled={disabled}
                                hasError={!!sectionErrors?.companyName}
                                {...field}
                                value={(field.value as string) ?? ''}
                            />
                        </FormControl>
                        <FormDescription>This will be displayed on the user's profile.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* Translation Experience */}
            <FormField
                control={control}
                name={getFieldName('translationExperience')}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>
                            Translation experience{' '}
                            <span className="text-muted-foreground text-xs">(optional)</span>
                        </FormLabel>
                        <Select
                            value={(field.value as string) ?? 'Beginner'}
                            onValueChange={field.onChange}
                            disabled={disabled}
                        >
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select experience level" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {experienceLevels.map((level) => (
                                    <SelectItem key={level.value} value={level.value}>
                                        {level.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormDescription>
                            How much experience does this user have in document translation?
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* Qualifications (TagInput) */}
            <FormField
                control={control}
                name={getFieldName('qualifications')}
                render={({ field }) => (
                    <FormItem className="flex flex-col items-start">
                        <FormLabel>
                            Qualifications <span className="text-muted-foreground text-xs">(optional)</span>
                        </FormLabel>
                        <FormControl>
                            <TagInput
                                ref={field.ref}
                                placeholder="Enter qualifications"
                                tags={qualifications}
                                setTags={(newTags) => {
                                    setQualifications(newTags);
                                    setValue(
                                        `${baseName}.qualifications` as const,
                                        newTags as [Tag, ...Tag[]],
                                    );
                                }}
                                value={Array.isArray(field.value) ? field.value.map((v: Tag) => v.text) : []}
                                onChange={field.onChange}
                                disabled={disabled}
                            />
                        </FormControl>
                        <FormDescription>
                            Enter qualifications separated by commas (e.g., "Bachelor of Arts, Certified
                            Translator, etc.")
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* Professional Affiliations (TagInput) */}
            <FormField
                control={control}
                name={getFieldName('professionalAffiliations')}
                render={({ field }) => (
                    <FormItem className="flex flex-col items-start">
                        <FormLabel>
                            Professional affiliations{' '}
                            <span className="text-muted-foreground text-xs">(optional)</span>
                        </FormLabel>
                        <FormControl>
                            <TagInput
                                ref={field.ref}
                                placeholder="Enter affiliations"
                                tags={professionalAffiliations}
                                setTags={(newTags) => {
                                    setProfessionalAffiliations(newTags);
                                    setValue(
                                        `${baseName}.professionalAffiliations` as const,
                                        newTags as [Tag, ...Tag[]],
                                    );
                                }}
                                value={Array.isArray(field.value) ? field.value.map((v: Tag) => v.text) : []}
                                onChange={field.onChange}
                                disabled={disabled}
                            />
                        </FormControl>
                        <FormDescription>E.g., "American Translators Association, etc."</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* Specializations (TagInput) */}
            <FormField
                control={control}
                name={getFieldName('specializations')}
                render={({ field }) => (
                    <FormItem className="flex flex-col items-start">
                        <FormLabel>
                            Specializations <span className="text-muted-foreground text-xs">(optional)</span>
                        </FormLabel>
                        <FormControl>
                            <TagInput
                                ref={field.ref}
                                placeholder="Enter specializations"
                                tags={specializations}
                                setTags={(newTags) => {
                                    setSpecializations(newTags);
                                    setValue(
                                        `${baseName}.specializations` as const,
                                        newTags as [Tag, ...Tag[]],
                                    );
                                }}
                                value={Array.isArray(field.value) ? field.value.map((v: Tag) => v.text) : []}
                                onChange={field.onChange}
                                disabled={disabled}
                            />
                        </FormControl>
                        <FormDescription>E.g., "Legal Documents, Medical, Technical, etc."</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
}
