/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import * as z from 'zod';
import { checkPasswordStrength } from '@library/utils';

export const ChangePasswordSchema = z
    .object({
        confirmPassword: z.string().min(1, {
            message: 'Password confirmation is required.',
        }),
        currentPassword: z.string().min(1, 'Current password is required.'),
        newPassword: z
            .string()
            .min(1, {
                message: 'New password is required.',
            })
            .refine(
                (data) =>
                    checkPasswordStrength(data).label === 'Strong' ||
                    checkPasswordStrength(data).label === 'Medium',
                {
                    message: 'Password is not strong enough.',
                },
            ),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: 'Passwords do not match.',
        path: ['confirmPassword'],
    })
    .refine((data) => data.currentPassword !== data.newPassword, {
        message: 'New password cannot be the same as the current password.',
        path: ['newPassword'],
    });

export const SetPasswordSchema = z
    .object({
        confirmPassword: z.string().min(1, {
            message: 'Password confirmation is required.',
        }),
        password: z
            .string()
            .min(1, {
                message: 'The password is required.',
            })
            .refine(
                (data) =>
                    checkPasswordStrength(data).label === 'Strong' ||
                    checkPasswordStrength(data).label === 'Medium',
                {
                    message: 'Password is not strong enough.',
                },
            ),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match.',
        path: ['confirmPassword'],
    });

export const PasswordSignInSchema = z.object({
    email: z
        .string()
        .email({
            message: 'Email is invalid.',
        })
        .min(1, {
            message: 'Email is required.',
        }),
    password: z.string().min(1, {
        message: 'Password is required.',
    }),
});

export const RegisterSchema = z.object({
    accountSecurity: z.object({
        commercialEmails: z.boolean(),
        password: z.string(),
        passwordConfirmation: z.string(),
        terms: z.boolean(),
    }),
    contactInformation: z.object({
        address: z.string(),
        address2: z.string().optional(),
        city: z.string(),
        country: z.string(),
        email: z.string().email().min(1, {
            message: 'Email is required',
        }),
        phoneNumber: z.string().optional(),
        state: z.string(),
        zipCode: z.string(),
    }),
    personalInformation: z.object({
        dateOfBirth: z.string().min(1, {
            message: 'Date of birth is required',
        }),
        firstName: z.string().min(1, {
            message: 'First name is required',
        }),
        lastName: z.string().min(1, {
            message: 'Last name is required',
        }),
    }),
    professionalInformation: z.object({
        companyName: z.string().nullable().optional(),
        professionalAffiliations: z.array(z.string()).nullable().optional(),
        qualifications: z.array(z.string()).nullable().optional(),
        resume: z.string().nullable().optional(),
        specializations: z.array(z.string()).nullable().optional(),
        translationExperience: z
            .enum(['Beginner', 'Intermediate', 'Advanced', 'Expert'])
            .nullable()
            .optional()
            .default('Beginner'),
    }),
});
