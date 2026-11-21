/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { ArrowCounterClockwise, LinkBreak, SignIn } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { titleCase } from 'title-case';
import { standardizeError } from '@/errors/api-errors';
import ResetPasswordPageContent from '@/src/app/auth/reset-password/reset-password-page';
import { Button } from '@/src/components/ui/button';
import { createBrowserClient } from '@/src/utils/supabase/client';
import { getLogger } from '@services/logger';
import type { ApiErrorType } from '@/types/rest/errors';
import type { Icon } from '@phosphor-icons/react';
import type { ElementType } from 'react';

export default function ResetPasswordPage() {
    const logger = getLogger('PAGES:AUTH:RESET-PASSWORD-PAGE');
    const searchParams = useSearchParams();
    const [email, setEmail] = useState<string | null>(null);
    const [error, setError] = useState<ApiErrorType | Error | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            const emailParam = searchParams.get('email') ?? null;
            setEmail(emailParam);

            // Initialize the Supabase client:
            const supabase = createBrowserClient();

            // Verify if the user is authorized to reset the password:
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (!user?.id || userError) {
                if (userError) {
                    logger.error(['Error during User verification:', userError]);
                } else if (!user?.id) {
                    logger.error('User is not authenticated.');
                }

                try {
                    // We get the searchParam's Code from the URL:
                    const code: string | null = searchParams.get('code') ?? null;

                    if (!code) {
                        logger.error('Password reset code is missing.');
                        setError(userError);
                        return;
                    }

                    // Verify the Code:
                    const { data: codeData, error: codeError } =
                        await supabase.auth.exchangeCodeForSession(code);

                    if (codeError) {
                        logger.error(['Error during Code exchange:', codeError]);
                        setError(standardizeError(codeError));
                        return;
                    }

                    if (!codeData?.session.access_token) {
                        setError(
                            standardizeError({
                                code: 'NO_ACCESS_TOKEN',
                                description:
                                    'The access token was not found in the response data from the code exchange. Please try again.',
                                error: true,
                                message: 'Access Token not found in the Code Data.',
                                status: 400,
                            }),
                        );
                        return;
                    }

                    // Revalidate the session:
                    await supabase.auth.setSession({
                        access_token: codeData.session.access_token,
                        refresh_token: codeData.session.refresh_token,
                    });
                } catch (caughtError) {
                    logger.error(['Caught Error during Code exchange:', caughtError]);
                    setError(standardizeError(caughtError));
                }
            }
        };

        fetchData().then((r) => r);
    }, [logger, searchParams]);

    if (error) {
        return <ShowError email={email} error={error} icon={LinkBreak} />;
    }

    // Show the reset password page content:
    return <ResetPasswordPageContent />;
}

function ShowError({
    email = null,
    error,
    icon = LinkBreak,
}: {
    error: ApiErrorType | (Error & Partial<ApiErrorType>);
    icon: Icon;
    email?: string | null;
}) {
    const IconComponent: Icon | ElementType = icon ?? LinkBreak;

    return (
        <div className="mx-auto flex h-auto flex-col items-center justify-center gap-2 lg:py-0">
            <div className="container flex w-full max-w-xl flex-col items-center justify-center">
                <div className="flex w-full flex-col items-center justify-center gap-6">
                    <div className="flex flex-col items-center justify-center gap-3">
                        <div className="bg-primary-100 dark:bg-primary-900 mb-3 flex size-16 items-center justify-center rounded-full">
                            <IconComponent
                                className="text-primary-500 dark:text-primary-400 size-8"
                                weight="duotone"
                            />
                        </div>
                        <h1 className="text-surface-900 mb-2 text-center text-3xl leading-tight font-bold tracking-tight md:text-4xl dark:text-white">
                            {error.title ??
                                (error.message
                                    ? titleCase(error.message)
                                    : 'Email Link is Invalid or Has Expired')}
                        </h1>
                        <p className="text-surface-600 dark:text-surface-400 text-center">
                            {error.description ??
                                'The reset password link you are trying to access is either invalid or expired. Please make sure you have the correct link. You can request a new link by clicking the button below.'}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            asChild
                            className="w-full"
                            color="primary"
                            shape="rounded"
                            size="lg"
                            variant="solid"
                        >
                            <Link href={`/auth/forgot-password${email ? `?email=${email}` : ''}`}>
                                <ArrowCounterClockwise className="size-5" weight="duotone" />
                                Request New Link
                            </Link>
                        </Button>
                        <Button
                            asChild
                            className="w-full"
                            color="primary"
                            shape="rounded"
                            size="lg"
                            variant="soft"
                        >
                            <Link href="/auth/sign-in">
                                <SignIn className="size-5" weight="duotone" />
                                Log in
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
