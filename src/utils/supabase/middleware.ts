/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { env } from '@/env';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@utils/supabase/server';
import { safeSingle } from '@utils/supabase/safe-single';
import { isMatch } from 'matcher';
import { type NextRequest, NextResponse } from 'next/server';
import { getUserRole } from '@/helpers/user';
import {
    AUTH_MFA_CHALLENGE_ROUTE,
    DEFAULT_ADMIN_REDIRECT,
    DEFAULT_USER_REDIRECT,
    accountRoutes,
    adminRoutes,
    nonAdminAccountRoutes,
    protectedRoutes,
    publicRoutes,
    sharedRoutes,
    userRoutes,
} from '@library/auth';
import { getLogger } from '@services/logger';
import type { ExtendedDatabase } from '@/types/database/database.extended';
import type { CookieOptions } from '@supabase/ssr';

/**
 * Middleware to update session and handle route access control.
 *
 *
 * @param request - Next.js request object.
 * @returns response - Next.js response object.
 *
 * @category Middleware
 *
 * @see {@link https://supabase.io/docs/guides/auth#session-management | Supabase Session Management}
 */
export async function updateSession(request: NextRequest) {
    const logger = getLogger('MIDDLEWARE:UPDATE_SESSION');
    const shouldDebug = process.env.NODE_ENV === 'development';

    // Generate nonce and CSP header:
    const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
    const cspHeader = `
        default-src 'self' https://accounts.google.com/gsi/;
        script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://accounts.google.com/gsi/client;
        style-src 'self' 'nonce-${nonce}' https://accounts.google.com/gsi/style;
        img-src 'self' blob: data:;
        font-src 'self';
        object-src 'none';
        base-uri 'self';
        form-action 'self';
        frame-ancestors 'none';
        upgrade-insecure-requests;
        connect-src https://accounts.google.com/gsi/;
        frame-src https://accounts.google.com/gsi/;
    `
        .replace(/\s{2,}/g, ' ')
        .trim();

    // Set request headers:
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-nonce', nonce);
    requestHeaders.set('Content-Security-Policy', cspHeader);

    // Add Next.js Pathname to headers, for use in the layout component:
    const headersPathname = request.nextUrl.pathname;
    requestHeaders.set('next-url', headersPathname);

    // Initial response setup:
    const supabaseResponse = NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });

    // Initialize Supabase client:
    const supabase = createServerClient<ExtendedDatabase>(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    supabaseResponse.cookies.set(name, value, options);
                },
                remove(name: string, options: CookieOptions) {
                    supabaseResponse.cookies.set(name, '', { ...options, maxAge: 0 });
                },
            },
        },
    );

    // 1. Refresh session for SSR (and keep cookies in sync):
    // This is critical for MFA logic to see the latest session state (e.g. after verification).
    await supabase.auth.getSession();

    // 2. Fetch user data with error handling (Safe & Secure):
    let user;
    try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        user = userData.user;
    } catch (error) {
        if (shouldDebug) {
            logger.error([
                'Failed to fetch user data:',
                error instanceof Error ? (error as Error).message : 'Unknown error',
            ]);
        }
        user = null; // Fallback to anonymous access
    }

    const url = request.nextUrl.clone();

    // Construct base URL for absolute URL redirection:
    const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;

    const pathname = request.nextUrl.pathname;

    const _isProduction = process.env.NODE_ENV === 'production';

    // Fetch user role with error handling:
    let userRole;
    try {
        userRole = await getUserRole(user?.id);
    } catch (error) {
        if (shouldDebug) {
            logger.error([
                'Failed to fetch user role:',
                error instanceof Error ? (error as Error).message : 'Unknown error',
            ]);
        }
        userRole = null; // Fallback to no role
    }

    if (shouldDebug) logger.info(['User Role:', userRole]);

    // Fetch user status with error handling:
    let userStatus;
    try {
        if (user) {
            // Use admin client to avoid "insecure session" warnings for database queries in middleware
            const { data: profile } = await safeSingle(
                await (await createAdminClient())
                    .from('profiles')
                    .select('account_status')
                    .eq('id', user.id)
                    .single(),
            );
            userStatus = profile?.account_status;
        } else {
            userStatus = null;
        }
    } catch (error) {
        if (shouldDebug) {
            logger.error([
                'Failed to fetch user status in middleware:',
                error instanceof Error ? (error as Error).message : 'Unknown error',
            ]);
        }
        userStatus = null;
    }

    if (shouldDebug && user) logger.info(['User Status:', userStatus]);

    // Handle Suspended Users:
    if (user && userStatus === 'SUSPENDED' && pathname !== '/auth/suspended') {
        if (shouldDebug)
            logger.warn([
                'Suspended user detected, redirecting to /auth/suspended and signing out:',
                user.id,
            ]);

        // Force sign out to clear session cookies
        await supabase.auth.signOut();

        return NextResponse.redirect(`${baseUrl}/auth/suspended`);
    }

    // 3. Enforce MFA (AAL2) checks:
    if (user) {
        try {
            // Check Assurance Level
            const { data: aalData, error: aalError } =
                await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

            if (aalError) {
                if (shouldDebug) logger.error(['Error during Assurance Level check:', aalError]);
            } else {
                const currentLevel = aalData?.currentLevel ?? 'aal1';
                const nextLevel = aalData?.nextLevel ?? 'aal1';
                const needsMfa = currentLevel !== 'aal2' && nextLevel === 'aal2';
                const isMfaRoute = pathname === AUTH_MFA_CHALLENGE_ROUTE;

                // Scenario A: User needs MFA but is NOT on the challenge page -> Redirect to Challenge
                if (needsMfa && !isMfaRoute) {
                    if (shouldDebug)
                        logger.info(['AAL2 Assurance Level required, redirecting to MFA challenge.']);

                    url.pathname = AUTH_MFA_CHALLENGE_ROUTE;
                    const callbackPathname =
                        request.nextUrl.pathname ??
                        (userRole === 'ADMIN' ? DEFAULT_ADMIN_REDIRECT : DEFAULT_USER_REDIRECT);

                    if (
                        callbackPathname &&
                        callbackPathname !== AUTH_MFA_CHALLENGE_ROUTE &&
                        !callbackPathname.startsWith('/auth')
                    ) {
                        url.searchParams.set('callback', callbackPathname);
                    }
                    return NextResponse.redirect(url.toString());
                }

                // Scenario B: User satisfies MFA (or doesn't need it) but IS on the challenge page -> Redirect to Dashboard
                // (Prevents getting stuck on challenge page if you are already verified)
                if (!needsMfa && isMfaRoute) {
                    const callbackPathname =
                        request.nextUrl.searchParams.get('callback') ?? DEFAULT_USER_REDIRECT;
                    url.pathname =
                        callbackPathname &&
                        callbackPathname !== AUTH_MFA_CHALLENGE_ROUTE &&
                        !callbackPathname.startsWith('/auth')
                            ? callbackPathname
                            : userRole === 'ADMIN'
                              ? DEFAULT_ADMIN_REDIRECT
                              : DEFAULT_USER_REDIRECT;
                    url.searchParams.delete('callback');
                    return NextResponse.redirect(url.toString());
                }

                // Scenario C: User needs MFA and IS on the challenge page -> Allow access (Do nothing, let request proceed)
            }
        } catch (e) {
            if (shouldDebug) logger.error(['Error during AAL Check:', e]);
        }
    }

    // # Route handling logic starts here:

    // 1. Handle Public Routes:
    if (isMatch(pathname, publicRoutes)) {
        if (user) {
            if (isMatch(pathname, sharedRoutes)) {
                return supabaseResponse; // Authenticated user accessing shared route.
            }
            if (shouldDebug)
                logger.info(['Authenticated user accessing public route, redirecting to dashboard.']);
            return NextResponse.redirect(
                `${baseUrl}${userRole === 'ADMIN' ? DEFAULT_ADMIN_REDIRECT : DEFAULT_USER_REDIRECT}`,
            ); // Redirect authenticated user from public route to dashboard.
        }
        if (shouldDebug) logger.info(['Public route, allowing access.']);
        return supabaseResponse; // Unauthenticated user accessing public route.
    }

    // 2. Handle Protected Routes:
    if (isMatch(pathname, protectedRoutes)) {
        if (user) {
            // 2.a. Handle Account Routes (Accessible by both USER and ADMIN):
            if (isMatch(pathname, accountRoutes)) {
                if (userRole === 'USER') {
                    if (shouldDebug)
                        logger.info(['User or Admin accessing account route:', pathname, 'Role:', userRole]);
                    return supabaseResponse; // Allow USER and ADMIN access.
                } else if (userRole === 'ADMIN') {
                    if (isMatch(pathname, nonAdminAccountRoutes)) {
                        if (shouldDebug)
                            logger.warn([
                                'Non-admin user attempted to access non-admin account route:',
                                pathname,
                                'Role:',
                                userRole,
                            ]);
                        return NextResponse.redirect(`${baseUrl}${DEFAULT_ADMIN_REDIRECT}`);
                    } else {
                        if (shouldDebug)
                            logger.info(['Admin accessing account route:', pathname, 'Role:', userRole]);
                        return supabaseResponse; // Admin accessing account route.
                    }
                } else {
                    if (shouldDebug)
                        logger.warn([
                            'Unauthorized role attempted to access account route:',
                            pathname,
                            'Role:',
                            userRole,
                        ]);
                    return NextResponse.redirect(`${baseUrl}/auth/sign-in`); // Or another appropriate redirect.
                }
            }

            // 2.b. Handle Admin Routes (Accessible only by ADMIN):
            if (isMatch(pathname, adminRoutes)) {
                if (userRole === 'ADMIN') {
                    if (shouldDebug) logger.info(['Admin accessing admin route:', pathname]);
                    return supabaseResponse; // Admin accessing admin route.
                } else {
                    if (shouldDebug)
                        logger.warn(['Non-admin user attempted to access admin route:', pathname]);
                    return NextResponse.redirect(`${baseUrl}${DEFAULT_USER_REDIRECT}`); // Non-admin accessing admin route.
                }
            }

            // 2.c. Handle User Routes (Accessible only by USER)
            if (isMatch(pathname, userRoutes)) {
                if (userRole === 'USER') {
                    if (shouldDebug) logger.info(['User accessing user route:', pathname, 'Role:', userRole]);
                    return supabaseResponse; // Allow USER access
                } else {
                    if (shouldDebug)
                        logger.warn([
                            'Unauthorized role attempted to access user route:',
                            pathname,
                            'Role:',
                            userRole,
                        ]);
                    return NextResponse.redirect(`${baseUrl}${DEFAULT_ADMIN_REDIRECT}`);
                }
            }

            // 2.d. Handle Other Protected Routes (if any):
            return supabaseResponse; // Authenticated user accessing other protected routes.
        }
        if (shouldDebug) logger.info(['Unauthenticated access to protected route:', pathname]);
        return NextResponse.redirect(`${baseUrl}/auth/sign-in`); // Unauthenticated user accessing protected route
    }

    // 3. Handle Shared Routes:
    if (isMatch(pathname, sharedRoutes)) {
        return supabaseResponse; // Shared routes accessible to all
    }

    // 4. Default Allow:
    return supabaseResponse;
}
