/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * An array of routes that are used for authentication. These routes will redirect logged-in users to /app/dashboard.
 *
 * @type {string[]}
 */
export const publicAuthRoutes: string[] = [
    '/auth/sign-in',
    '/auth/sign-up',
    '/auth/error',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/verify-email',
];

/**
 * An array of routes that are accessible to the public. These routes do not require authentication.
 *
 * @type {string[]}
 */
export const publicRoutes: string[] = [
    '/',
    '/features',
    '/pricing',
    '/terms-of-service',
    '/privacy-policy',
    '/legal/**',
    ...publicAuthRoutes,
];

/**
 * An array of routes that are accessible only to admin users.
 * These routes require admin privileges.
 *
 * @type {string[]}
 */
export const adminRoutes: string[] = [
    '/admin',
    '/admin/**',
    '/admin/dashboard',
    '/admin/dashboard/**',
    '/admin/users',
    '/admin/users/**',
];

/**
 * An array of routes that are accessible only to regular users.
 * These routes require user privileges.
 *
 * @type {string[]}
 */
export const userRoutes: string[] = ['/app', '/app/**'];

/**
 * An array of routes that are accessible by both regular users and admin users.
 * These routes are used for account management purposes.
 *
 * @type {string[]}
 */
export const accountRoutes: string[] = ['/account', '/account/**'];

/**
 * Non-Admin Account Routes.
 *
 * @type {string[]}
 */
export const nonAdminAccountRoutes: string[] = [
    '/account/billing',
    '/account/billing/**',
    '/account/settings',
    '/account/settings/**',
    '/account/credits/**',
];

/**
 * An array of routes that are protected. These routes require authentication.
 * This includes both userRoutes and adminRoutes.
 *
 * @type {string[]}
 */
export const protectedRoutes: string[] = [
    ...userRoutes,
    ...adminRoutes,
    ...accountRoutes,
    '/auth/mfa/challenge',
];

/**
 * An array of routes that are shared. These routes are accessible to both public and authenticated users.
 *
 * @type {string[]}
 */
export const sharedRoutes: string[] = [
    '/home',
    '/error',
    '/auth/error',
    '/404',
    '/500',
    '/contact',
    '/privacy',
    '/terms',
    '/auth/confirm',
    '/auth/callback',
    '/auth/reset-password',
];

/**
 * The route for the MFA challenge.
 *
 * Currently set to '/auth/mfa/challenge'.
 *
 */
export const AUTH_MFA_CHALLENGE_ROUTE = '/auth/mfa/challenge';

/**
 * The default redirect path for the user.
 *
 * Currently set to '/app/dashboard'.
 *
 */
export const DEFAULT_USER_REDIRECT = '/app/dashboard';

/**
 * The default redirect path for the admin.
 *
 * Currently set to '/admin/dashboard'.
 *
 */
export const DEFAULT_ADMIN_REDIRECT = '/admin/dashboard';
