/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import type { API_ERROR_CODES } from '@/src/errors/error-codes';

export const SPECIFIC_ERROR_MAPPINGS: Record<string, keyof typeof API_ERROR_CODES> = {
    'AAL2 required': 'INSUFFICIENT_AAL',
    'AAL2 required to enroll a new factor': 'INSUFFICIENT_AAL',
    'AAL2 required to perform this action': 'INSUFFICIENT_AAL',
    AuthRetryableFetchError: 'FAILED_TO_FETCH',
    AuthSessionMissingError: 'UNAUTHENTICATED',
    'Email already exists': 'EMAIL_EXISTS',
    'Email not confirmed': 'EMAIL_NOT_VERIFIED',
    'Email provider disabled': 'EMAIL_PROVIDER_DISABLED',
    'Failed to fetch': 'FAILED_TO_FETCH',
    'Fetch failed': 'FAILED_TO_FETCH',
    'Identity not found': 'IDENTITY_NOT_FOUND',
    'Invalid TOTP code entered': 'MFA_INVALID_CODE',
    'Invalid login credentials': 'INVALID_CREDENTIALS',
    'MFA challenge expired': 'MFA_CHALLENGE_EXPIRED',
    'MFA enrollment required': 'MFA_ENROLLMENT_REQUIRED',
    'MFA verification failed': 'MFA_VERIFICATION_FAILED',
    'MFA verification rejected': 'MFA_VERIFICATION_REJECTED',
    'Manual linking disabled': 'MANUAL_LINKING_DISABLED',
    'OTP disabled': 'OTP_DISABLED',
    'OTP expired': 'OTP_EXPIRED',
    'Phone number already exists': 'PHONE_EXISTS',
    'Phone provider disabled': 'PHONE_PROVIDER_DISABLED',
    'Provider disabled': 'PROVIDER_DISABLED',
    'Reauthentication failed': 'REAUTHENTICATION_NOT_VALID',
    'Reauthentication needed': 'REAUTHENTICATION_NEEDED',
    'Sign out error': 'UNEXPECTED_FAILURE',
    'Token has expired or is invalid': 'OTP_EXPIRED',
    'Unauthenticated request': 'UNAUTHENTICATED',
    'User already exists': 'USER_ALREADY_EXISTS',
    'User already linked': 'IDENTITY_ALREADY_EXISTS',
    'User already registered': 'USER_ALREADY_EXISTS',
    'User is suspended': 'USER_SUSPENDED',
    'User not found': 'USER_NOT_FOUND',
    'factor_id must be an UUID': 'INVALID_FACTOR_ID',
};
