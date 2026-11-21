/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import type { AdminUserFormData } from '@schemas/user-form-schemas';

/**
 * Default form values for creating a new user
 */
export const DEFAULT_FORM_VALUES: AdminUserFormData = {
    personalInformation: {
        firstName: '',
        lastName: '',
        day: '',
        month: '',
        year: '',
    },
    contactInformation: {
        email: '',
        phoneNumber: '',
        address: '',
        address2: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
    },
    professionalInformation: {
        companyName: '',
        translationExperience: 'Beginner',
        qualifications: null,
        professionalAffiliations: null,
        specializations: null,
        resume: null,
    },
    accountSecurity: {
        password: '',
        passwordConfirmation: '',
        commercialEmails: false,
        terms: false,
    },
    role: 'USER',
};
