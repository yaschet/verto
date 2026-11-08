/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { env } from '@/env';
import { NextResponse } from 'next/server';
import { createServerClient } from '@/utils/supabase/server';
import { getLogger } from '@services/logger';

export async function GET(request: Request) {
    const logger = getLogger('AUTH:CALLBACK');

    const { origin, searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/';

    if (code) {
        const supabase = await createServerClient();
        const {
            data: { session, user },
            error,
        } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            const isLocalEnv = process.env.NODE_ENV === 'development';
            let redirectUrl;

            if (isLocalEnv) {
                redirectUrl = new URL(`${env.NEXT_PUBLIC_APP_URL}${next}`);
            } else {
                redirectUrl = new URL(`${env.NEXT_PUBLIC_APP_URL}${next}`);
            }

            // Log 'sign-in' activity:
            if (session?.user.id || user?.id) {
                await supabase.from('user_activity').insert({
                    profile_id: user?.id ?? session?.user.id,
                    type: 'sign_in',
                    details: { method: 'callback' },
                });
            } else {
                logger.error(['User not found after exchanging code for session.']);
            }

            return NextResponse.redirect(redirectUrl.toString());
        } else {
            logger.error(['An error occurred while exchanging code for session.']);
            const errorUrl = new URL(
                `${origin}/auth/error?error_code=${error.code}&error_message=${error.message}`,
            );
            return NextResponse.redirect(errorUrl.toString());
        }
    }

    logger.error(['An error occurred while exchanging code for session.']);
    const errorUrl = new URL(
        `${origin}/auth/error?error_code=UNEXPECTED_FAILURE&error_message=Unexpected%20Failure&`,
    );
    return NextResponse.redirect(errorUrl.toString());
}
