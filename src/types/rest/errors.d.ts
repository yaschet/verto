/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Unbound transport envelopes carry heterogeneous provider payloads; endpoint contracts bind T.
export type ApiErrorType<T = any> = {
    error: boolean;
    success?: boolean;
    code: string;
    name?: string;
    title?: string;
    message: string;
    description?: string;
    solution?: string;
    status: number;
    traceId?: string;
    stack?: Error['stack'];
    data?: T;
    timestamp?: string;
};

/** The error codes for the API. */
export type ApiErrorCodes = CustomErrorCodes & SupabaseErrorCodes & HttpErrorCodes;

export type CustomErrorCodes = {
    ACCESS_DENIED: ApiErrorType;
    EMAIL_NOT_VERIFIED: ApiErrorType;
    EMPTY_PASSWORD: ApiErrorType;
    FAILED_TO_FETCH: ApiErrorType;
    INCORRECT_PASSWORD: ApiErrorType;
    INVALID_CREDENTIALS: ApiErrorType;
    INVALID_FACTOR_ID: ApiErrorType;
    INVALID_FIELDS: ApiErrorType;
    METHOD_NOT_ALLOWED: ApiErrorType;
    MFA_ENROLLMENT_REQUIRED: ApiErrorType;
    MFA_INVALID_CODE: ApiErrorType;
    NETWORK_FAILURE: ApiErrorType;
    NOT_IMPLEMENTED: ApiErrorType;
    OAUTH_FLOW: ApiErrorType;
    OAUTH_SCOPE_ERROR: ApiErrorType;
    PASSWORD_ANOMALY: ApiErrorType;
    PASSWORD_CHANGE_FAILED: ApiErrorType;
    PASSWORD_CONFIRMATION_MISMATCH: ApiErrorType;
    PASSWORD_INVALID: ApiErrorType;
    PASSWORD_MINIMUM_LENGTH: ApiErrorType;
    PASSWORD_MINIMUM_LOWERCASE: ApiErrorType;
    PASSWORD_MINIMUM_NUMERIC: ApiErrorType;
    PASSWORD_MINIMUM_SYMBOLS: ApiErrorType;
    PASSWORD_MINIMUM_UPPERCASE: ApiErrorType;
    PASSWORD_LEAK_DETECTED: ApiErrorType;
    PASSWORD_RESET_EXPIRED: ApiErrorType;
    PASSWORD_RESET_INVALID: ApiErrorType;
    PROVIDER_TOKEN_NOT_FOUND: ApiErrorType;
    PROVIDER_UNLINK_NOT_ALLOWED: ApiErrorType;
    RATE_LIMIT: ApiErrorType;
    REFRESH_TOKEN_EXPIRED: ApiErrorType;
    REFRESH_TOKEN_NOT_FOUND: ApiErrorType;
    UNAUTHENTICATED: ApiErrorType;
    USER_NOT_CONFIRMED: ApiErrorType;
    USER_SUSPENDED: ApiErrorType;
};

export type SupabaseErrorCodes = {
    BAD_CODE_VERIFIER: ApiErrorType;
    BAD_JSON: ApiErrorType;
    BAD_JWT: ApiErrorType;
    BAD_OAUTH_CALLBACK: ApiErrorType;
    BAD_OAUTH_STATE: ApiErrorType;
    CAPTCHA_FAILED: ApiErrorType;
    CONFLICT: ApiErrorType;
    EMAIL_CONFLICT_IDENTITY_NOT_DELETABLE: ApiErrorType;
    EMAIL_EXISTS: ApiErrorType;
    EMAIL_NOT_CONFIRMED: ApiErrorType;
    EMAIL_PROVIDER_DISABLED: ApiErrorType;
    FLOW_STATE_EXPIRED: ApiErrorType;
    FLOW_STATE_NOT_FOUND: ApiErrorType;
    IDENTITY_ALREADY_EXISTS: ApiErrorType;
    IDENTITY_NOT_FOUND: ApiErrorType;
    INSUFFICIENT_AAL: ApiErrorType;
    INVITE_NOT_FOUND: ApiErrorType;
    MANUAL_LINKING_DISABLED: ApiErrorType;
    MFA_CHALLENGE_EXPIRED: ApiErrorType;
    MFA_FACTOR_NAME_CONFLICT: ApiErrorType;
    MFA_FACTOR_NOT_FOUND: ApiErrorType;
    MFA_IP_ADDRESS_MISMATCH: ApiErrorType;
    MFA_VERIFICATION_FAILED: ApiErrorType;
    MFA_VERIFICATION_REJECTED: ApiErrorType;
    NO_AUTHORIZATION: ApiErrorType;
    NOT_ADMIN: ApiErrorType;
    OAUTH_PROVIDER_NOT_SUPPORTED: ApiErrorType;
    OTP_DISABLED: ApiErrorType;
    OTP_EXPIRED: ApiErrorType;
    OVER_EMAIL_SEND_RATE_LIMIT: ApiErrorType;
    OVER_REQUEST_RATE_LIMIT: ApiErrorType;
    OVER_SMS_SEND_RATE_LIMIT: ApiErrorType;
    PHONE_EXISTS: ApiErrorType;
    PHONE_NOT_CONFIRMED: ApiErrorType;
    PHONE_PROVIDER_DISABLED: ApiErrorType;
    PROVIDER_DISABLED: ApiErrorType;
    PROVIDER_EMAIL_NEEDS_VERIFICATION: ApiErrorType;
    REAUTHENTICATION_NEEDED: ApiErrorType;
    REAUTHENTICATION_NOT_VALID: ApiErrorType;
    SAME_PASSWORD: ApiErrorType;
    SAML_ASSERTION_NO_EMAIL: ApiErrorType;
    SAML_ASSERTION_NO_USER_ID: ApiErrorType;
    SAML_ENTITY_ID_MISMATCH: ApiErrorType;
    SAML_IDP_ALREADY_EXISTS: ApiErrorType;
    SAML_IDP_NOT_FOUND: ApiErrorType;
    SAML_METADATA_FETCH_FAILED: ApiErrorType;
    SAML_PROVIDER_DISABLED: ApiErrorType;
    SAML_RELAY_STATE_EXPIRED: ApiErrorType;
    SAML_RELAY_STATE_NOT_FOUND: ApiErrorType;
    SESSION_NOT_FOUND: ApiErrorType;
    SIGNUP_DISABLED: ApiErrorType;
    SINGLE_IDENTITY_NOT_DELETABLE: ApiErrorType;
    SMS_SEND_FAILED: ApiErrorType;
    SSO_DOMAIN_ALREADY_EXISTS: ApiErrorType;
    SSO_PROVIDER_NOT_FOUND: ApiErrorType;
    TOO_MANY_ENROLLED_MFA_FACTORS: ApiErrorType;
    UNEXPECTED_FAILURE: ApiErrorType;
    USER_ALREADY_EXISTS: ApiErrorType;
    USER_BANNED: ApiErrorType;
    USER_NOT_FOUND: ApiErrorType;
    USER_SSO_MANAGED: ApiErrorType;
    VALIDATION_FAILED: ApiErrorType;
    WEAK_PASSWORD: ApiErrorType;
};

export type HttpErrorCodes = {
    400: ApiErrorType;

    401: ApiErrorType;

    403: ApiErrorType;

    404: ApiErrorType;

    405: ApiErrorType;

    406: ApiErrorType;

    409: ApiErrorType;

    415: ApiErrorType;

    422: ApiErrorType;

    429: ApiErrorType;

    500: ApiErrorType;

    501: ApiErrorType;

    502: ApiErrorType;

    503: ApiErrorType;

    504: ApiErrorType;

    505: ApiErrorType;

    507: ApiErrorType;

    511: ApiErrorType;
};
