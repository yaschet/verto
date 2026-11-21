/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import type { ExtendedTableRow } from '@/types/database/database.extended';
type AdminProfileInput = Partial<
    ExtendedTableRow<'profiles'> & {
        address2: string;
        resume: string;
        commercial_emails: boolean;
        role: 'ADMIN' | 'USER' | null;
    }
>;
import validator from 'validator';
import { z } from 'zod';
import { checkPasswordStrength } from '@library/utils';

/**
 * User Form Validation Schemas
 *
 * Extracted from registration form tabs and extended for admin context.
 * Supports both registration (multi-step) and admin (single-form) flows.
 *
 * Key features:
 * - Per-tab schemas for progressive validation
 * - Parameterized account security schema (password required vs optional)
 * - Password strength validation using checkPasswordStrength utility
 * - Cross-field validation for password confirmation and terms
 * - Support for Tag inputs (arrays of {id, text} objects)
 */

// ============================================================================
// PERSONAL INFORMATION SCHEMA
// ============================================================================

export const PersonalInformationSchema = z.object({
    day: z.string().optional(),
    firstName: z.string().min(2, 'First name must be at least 2 characters long.'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters long.'),
    month: z.string().optional(),
    year: z.string().optional(),
});

export type PersonalInformation = z.infer<typeof PersonalInformationSchema>;

// ============================================================================
// CONTACT INFORMATION SCHEMA
// ============================================================================

export const ContactInformationSchema = z.object({
    address: z.string().optional(),
    address2: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    email: z.string().email({ message: 'Please enter a valid email address.' }),
    phoneNumber: z
        .string()
        .optional()
        .refine((value) => !value || validator.isMobilePhone(value), {
            message: 'Please enter a valid phone number.',
        }),
    state: z.string().optional(),
    zipCode: z.string().optional(),
});

export type ContactInformation = z.infer<typeof ContactInformationSchema>;

// ============================================================================
// PROFESSIONAL INFORMATION SCHEMA
// ============================================================================

/**
 * Tag object for arrays of qualifications, affiliations, specializations
 * Allows both id (for storage) and text (for display)
 */
export const TagSchema = z.object({
    id: z.string(),
    text: z.string(),
});

export type Tag = z.infer<typeof TagSchema>;

export const ProfessionalInformationSchema = z.object({
    companyName: z.string().optional(),
    professionalAffiliations: z.array(TagSchema).nullable().optional(),
    qualifications: z.array(TagSchema).nullable().optional(),
    resume: z.string().nullable().optional(),
    specializations: z.array(TagSchema).nullable().optional(),
    translationExperience: z
        .enum(['Beginner', 'Intermediate', 'Advanced', 'Expert'])
        .nullable()
        .default('Beginner'),
});

export type ProfessionalInformation = z.infer<typeof ProfessionalInformationSchema>;

// ============================================================================
// ACCOUNT SECURITY SCHEMA (Parameterized for Add vs Edit)
// ============================================================================

/**
 * Factory function to create account security schema with configurable requirements
 *
 * @param config - Configuration for password and terms requirements
 * @param config.passwordRequired - If true, password is required (Add mode)
 * @param config.requireConfirmation - If true, password confirmation required
 * @param config.requireTerms - If true, terms checkbox required (registration only)
 * @param config.includeCommercialEmails - If true, include commercial emails preference
 *
 * @returns Zod schema for account security fields
 */
export function createAccountSecuritySchema(config: {
    passwordRequired?: boolean;
    requireConfirmation?: boolean;
    requireTerms?: boolean;
    includeCommercialEmails?: boolean;
}) {
    const {
        passwordRequired = true,
        requireConfirmation = true,
        requireTerms = false,
        includeCommercialEmails = true,
    } = config;

    const schema = z
        .object({
            commercialEmails: includeCommercialEmails ? z.boolean().optional() : z.literal(false).optional(),
            password: passwordRequired
                ? z
                      .string()
                      .min(1, 'Password is required.')
                      .refine(
                          (data) => {
                              const strength = checkPasswordStrength(data);
                              return strength.label === 'Strong' || strength.label === 'Medium';
                          },
                          {
                              message: 'Password is not strong enough.',
                          },
                      )
                : z
                      .string()
                      .optional()
                      .refine(
                          (data) => {
                              if (!data) return true; // Password not required, skip validation if empty
                              const strength = checkPasswordStrength(data);
                              return strength.label === 'Strong' || strength.label === 'Medium';
                          },
                          {
                              message: 'Password is not strong enough.',
                          },
                      ),
            passwordConfirmation: requireConfirmation ? z.string() : z.string().optional(),
            terms: requireTerms
                ? z.boolean().refine((val) => val, {
                      message: 'Please read and accept the terms and conditions',
                  })
                : z.boolean().optional(),
        })
        .refine(
            (data) => {
                // Only validate confirmation if both password and confirmation are provided
                if (requireConfirmation && data.password && data.passwordConfirmation) {
                    return data.password === data.passwordConfirmation;
                }
                // If confirmation not required, always pass
                if (!requireConfirmation) return true;
                // If password provided, confirmation must match
                if (data.password) {
                    return data.password === data.passwordConfirmation;
                }
                return true;
            },
            {
                message: 'Passwords do not match.',
                path: ['passwordConfirmation'],
            },
        )
        .refine(
            (data) => {
                // Only validate terms if required
                if (requireTerms) {
                    return data.terms === true;
                }
                return true;
            },
            {
                message: 'Please read and accept the terms and conditions',
                path: ['terms'],
            },
        );

    return schema;
}

export const AccountSecuritySchema = createAccountSecuritySchema({
    passwordRequired: true,
    requireConfirmation: true,
    requireTerms: false,
    includeCommercialEmails: true,
});

export type AccountSecurity = z.infer<typeof AccountSecuritySchema>;

// ============================================================================
// ADMIN-SPECIFIC SCHEMAS
// ============================================================================

export const RoleSchema = z.object({
    role: z.enum(['ADMIN', 'USER']),
});

export type Role = z.infer<typeof RoleSchema>;

// ============================================================================
// COMBINED SCHEMAS
// ============================================================================

/**
 * Full user form data combining all sections
 * Used for both registration and admin forms
 */
export const FullUserFormSchema = z.object({
    personalInformation: PersonalInformationSchema,
    contactInformation: ContactInformationSchema,
    professionalInformation: ProfessionalInformationSchema,
    accountSecurity: AccountSecuritySchema,
});

export type FullUserFormData = z.infer<typeof FullUserFormSchema>;

/**
 * Admin user form schema
 * Extends full schema with admin-specific role field
 * Password requirements can vary: required for Add, optional for Edit
 */
export function createAdminUserFormSchema(isEdit: boolean = false) {
    return z.object({
        personalInformation: PersonalInformationSchema,
        contactInformation: ContactInformationSchema,
        professionalInformation: ProfessionalInformationSchema,
        accountSecurity: createAccountSecuritySchema({
            passwordRequired: !isEdit, // Required for Add, optional for Edit
            requireConfirmation: !isEdit,
            requireTerms: false, // Never required for admin
            includeCommercialEmails: true,
        }),
        role: RoleSchema.shape.role,
    });
}

export type AdminUserFormData = FullUserFormData & {
    role: 'ADMIN' | 'USER';
};

// ============================================================================
// DATA TRANSFORMATION HELPERS
// ============================================================================

/**
 * Transform admin form data to API payload format
 * Maps form field names to database column names
 */
export function transformAdminFormDataToApiPayload(data: AdminUserFormData) {
    return {
        address: data.contactInformation.address,
        address2: data.contactInformation.address2,
        city: data.contactInformation.city,
        company_name: data.professionalInformation.companyName,
        country: data.contactInformation.country,
        date_of_birth: `${data.personalInformation.day}/${data.personalInformation.month}/${data.personalInformation.year}`,
        email: data.contactInformation.email,
        first_name: data.personalInformation.firstName,
        last_name: data.personalInformation.lastName,
        password: data.accountSecurity.password,
        phone: data.contactInformation.phoneNumber,
        professional_affiliations:
            data.professionalInformation.professionalAffiliations?.map((a) => a.text).filter(Boolean) ?? [],
        qualifications: data.professionalInformation.qualifications?.map((q) => q.text).filter(Boolean) ?? [],
        role: data.role,
        specializations:
            data.professionalInformation.specializations?.map((s) => s.text).filter(Boolean) ?? [],
        state: data.contactInformation.state,
        translation_experience: data.professionalInformation.translationExperience,
        zip_code: data.contactInformation.zipCode,
    };
}

/**
 * Transform API user data to admin form data shape
 * Handles date splitting, JSONB array conversion to Tags, etc.
 */
export function transformApiDataToAdminFormData(apiData: AdminProfileInput): Partial<AdminUserFormData> {
    const [day, month, year] = apiData.date_of_birth?.split('/') ?? ['', '', ''];

    return {
        personalInformation: {
            day,
            firstName: apiData.first_name ?? '',
            lastName: apiData.last_name ?? '',
            month,
            year,
        },
        contactInformation: {
            address: apiData.address ?? '',
            address2: apiData.address2,
            city: apiData.city ?? '',
            country: apiData.country ?? '',
            email: apiData.email ?? '',
            phoneNumber: apiData.phone ?? '',
            state: apiData.state ?? '',
            zipCode: apiData.zip_code ?? '',
        },
        professionalInformation: {
            companyName: apiData.company_name ?? undefined,
            professionalAffiliations: ((apiData.professional_affiliations as string[] | null) ?? []).map(
                (text: string) => ({
                    id: text,
                    text,
                }),
            ),
            qualifications: ((apiData.qualifications as string[] | null) ?? []).map((text: string) => ({
                id: text,
                text,
            })),
            resume: apiData.resume ?? null,
            specializations: ((apiData.specializations as string[] | null) ?? []).map((text: string) => ({
                id: text,
                text,
            })),
            translationExperience:
                (apiData.translation_experience as AdminUserFormData['professionalInformation']['translationExperience']) ??
                'Beginner',
        },
        accountSecurity: {
            commercialEmails: apiData.commercial_emails ?? false,
            password: undefined, // Never pre-fill password
            passwordConfirmation: undefined,
            terms: false,
        },
        role: (apiData.role as AdminUserFormData['role']) ?? 'USER',
    };
}

/**
 * Get fields that belong to a specific tab
 * Used for per-tab validation
 */
export function getFieldsForTab(
    tabKey: 'personalInformation' | 'contactInformation' | 'professionalInformation' | 'accountSecurity',
): (keyof AdminUserFormData)[] {
    const fieldMap = {
        accountSecurity: ['accountSecurity' as const],
        contactInformation: ['contactInformation' as const],
        personalInformation: ['personalInformation' as const],
        professionalInformation: ['professionalInformation' as const],
    };

    return fieldMap[tabKey];
}
