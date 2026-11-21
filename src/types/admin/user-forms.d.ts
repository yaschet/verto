/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * Admin User Form Type Definitions
 *
 * Extends the registration form data types with admin-specific fields
 * and configuration options.
 */

import type { Control, FieldErrors } from 'react-hook-form';
import type { FullUserFormData, AdminUserFormData, Tag } from '@schemas/user-form-schemas';

// Re-export types from schemas for convenience
export type { AdminUserFormData, FullUserFormData, Tag };

/**
 * Context for conditional rendering in form sections
 * - 'registration': Multi-step registration wizard
 * - 'admin-create': Admin creating new user in tabbed form
 * - 'admin-edit': Admin editing existing user in tabbed form
 */
export type UserFormContext = 'registration' | 'admin-create' | 'admin-edit';

/**
 * Tab keys for admin forms (4 tabs)
 */
export type AdminFormTabKey = 'personalContact' | 'professional' | 'accountRole' | 'review';

/**
 * Tab configuration for form UI
 */
export interface AdminFormTab {
    key: AdminFormTabKey;
    label: string;
    shortLabel: string; // For mobile (abbreviated)
    description: string;
}

/**
 * Form field props that get passed from container to field components
 */
export interface FormFieldProps {
    control: Control<AdminUserFormData>;
    errors: FieldErrors<AdminUserFormData>;
    disabled?: boolean;
    isLoading?: boolean;
}

/**
 * Section component props
 * Extends form field props with section-specific options
 */
export interface FormSectionProps extends FormFieldProps {
    showHeader?: boolean;
    title?: string;
    description?: string;
}

/**
 * Tag input configuration
 */
export interface TagInputConfig {
    placeholder: string;
    helperText?: string;
    maxTags?: number;
    allowDuplicates?: boolean;
}

/**
 * Personal & Contact Information section data
 */
export interface PersonalContactData {
    firstName: string;
    lastName: string;
    day: string;
    month: string;
    year: string;
    email: string;
    phoneNumber: string;
    address: string;
    address2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}

/**
 * Professional Information section data
 */
export interface ProfessionalData {
    companyName?: string;
    translationExperience: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' | null;
    qualifications: Tag[] | null;
    professionalAffiliations: Tag[] | null;
    specializations: Tag[] | null;
    resume: string | null;
}

/**
 * Account & Role section data
 */
export interface AccountRoleData {
    role: 'ADMIN' | 'USER';
    password: string;
    passwordConfirmation: string;
    commercialEmails?: boolean;
}

/**
 * Review & Submit section data (read-only summary)
 */
export interface ReviewData {
    personalContact: PersonalContactData;
    professional: ProfessionalData;
    accountRole: AccountRoleData;
    changedFields?: string[]; // Fields changed in Edit mode
}

/**
 * Form state hook return type
 */
export interface AdminUserFormState {
    formData: Partial<AdminUserFormData>;
    completedTabs: Record<AdminFormTabKey, boolean>;
    activeTabIndex: number;
    isTabAccessible: (index: number) => boolean;
    navigateToTab: (index: number) => boolean;
    handleTabSubmit: (
        tabKey: AdminFormTabKey,
        values: Partial<PersonalContactData & ProfessionalData & AccountRoleData>,
    ) => void;
    setFormData: (data: Partial<AdminUserFormData>) => void;
    resetForm: () => void;
}

/**
 * Admin add user form props
 */
export interface AdminAddUserFormProps {
    onSuccess?: (userId: string) => void;
    onError?: (error: Error) => void;
    onCancel?: () => void;
    isLoading?: boolean;
}

/**
 * Admin edit user form props
 */
export interface AdminEditUserFormProps {
    userId: string;
    initialData?: Partial<AdminUserFormData>;
    onSuccess?: () => void;
    onError?: (error: Error) => void;
    onCancel?: () => void;
    isLoading?: boolean;
}

/**
 * API payload for creating/updating user
 */
export interface UserApiPayload {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address: string;
    address2?: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
    date_of_birth: string; // DD/MM/YYYY format
    company_name?: string;
    translation_experience?: string;
    qualifications: string[];
    professional_affiliations: string[];
    specializations: string[];
    role: 'ADMIN' | 'USER';
    password?: string;
}

/**
 * Server action response type
 */
export interface UserFormApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        message: string;
        code?: string;
        details?: Record<string, string>;
    };
}
