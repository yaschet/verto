/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

export type RegistrationDataType = {
    personalInformation: PersonalInformation;
    contactInformation: ContactInformation;
    professionalInformation: ProfessionalInformation;
    accountSecurity: AccountSecurity;
};

export type PersonalInformation = {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
};

export type ContactInformation = {
    email: string;
    phoneNumber: string;
    address: string;
    address2: string | undefined;
    city: string;
    state: string;
    zipCode: string;
    country: string;
};

export type ProfessionalInformation = {
    companyName: string | null | undefined;
    translationExperience: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' | null;
    qualifications: string[] | null | undefined;
    professionalAffiliations: string[] | null | undefined;
    specializations: string[] | null | undefined;
    resume: string | null;
};

export type AccountSecurity = {
    password: string;
    passwordConfirmation: string;
    terms: boolean;
    commercialEmails: boolean;
};

export type FileType = {
    file: File;
    name: string;
    size: number;
    type: string;
    preview: string;
};
