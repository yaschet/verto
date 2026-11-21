/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { getLogger } from '@services/logger';
import { createServerClient } from '@utils/supabase/server';
import type { ApiErrorType } from '@/types/rest/errors';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const tokenHash = searchParams.get('token_hash');
    const type = searchParams.get('type') as EmailOtpType | null;
    const next = searchParams.get('next') ?? '/';

    const logger = getLogger('AUTH:API:CONFIRM');

    const redirectTo = request.nextUrl.clone();
    redirectTo.pathname = next;
    let thrownError: (Error & Partial<ApiErrorType> & { error_code?: string }) | null = null;

    if (tokenHash && type) {
        const supabase = await createServerClient();

        const {
            data: { session, user },
            error,
        } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type,
        });

        if (error) {
            thrownError = error;
        } else if (session) {
            // The token was successfully verified - Remove the token hash and type from the URL:
            redirectTo.searchParams.delete('token_hash');
            redirectTo.searchParams.delete('type');
            redirectTo.searchParams.delete('next');

            // Log 'sign-in' activity:
            if (session?.user?.id || user?.id) {
                await supabase.from('user_activity').insert({
                    profile_id: user?.id ?? session?.user.id,
                    type: 'sign_in',
                    details: { method: 'callback' },
                });
            } else {
                logger.error(['User not found after verifying OTP.', { type: type?.toString() }]);
            }

            // Redirect the user to the next page:
            return NextResponse.redirect(redirectTo);
        }
    }

    redirectTo.pathname = '/auth/error';

    if (thrownError) {
        redirectTo.searchParams.delete('token_hash');
        redirectTo.searchParams.delete('type');

        if (thrownError.code) {
            redirectTo.searchParams.set('code', thrownError.code ?? thrownError.error_code ?? 'UNKNOWN');
        }

        if (thrownError.message) {
            redirectTo.searchParams.set('message', thrownError.message);
        }

        if (thrownError.description) {
            redirectTo.searchParams.set('description', thrownError.description);
        }

        if (thrownError.name) {
            redirectTo.searchParams.set('details', thrownError.name);
        }
    }

    return NextResponse.redirect(redirectTo);
}
