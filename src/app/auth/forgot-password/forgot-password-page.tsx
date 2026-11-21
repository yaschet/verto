/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { useZodResolver } from '@/src/hooks/use-zod-resolver';
import {
    ArrowCounterClockwiseIcon,
    EnvelopeIcon,
    KeyholeIcon,
    PaperPlaneTiltIcon,
    TrayArrowDownIcon,
} from '@phosphor-icons/react';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Fragment, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { titleCase } from 'title-case';
import { z } from 'zod';
import { forgotPassword } from '@/src/actions/auth/forgot-password';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/src/components/ui/form';
import { env } from '@/src/env';
import { standardizeError } from '@/src/errors/api-errors';
import { cn } from '@/src/library/utils';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import type { ApiErrorType } from '@/types/rest/errors';

export default function ForgotPasswordPageContent() {
    return <ForgotPasswordForm />;
}

function ForgotPasswordForm() {
    const [isSent, setIsSent] = useState(false);

    const searchParams = useSearchParams();

    // Get the query params:
    const queryEmail = searchParams.get('email');

    // Schema for the email:
    const forgotPasswordSchema = z.object({
        email: z
            .string()
            .email({
                message: 'Email is invalid.',
            })
            .min(1, {
                message: 'Email is required.',
            }),
    });

    const resolver = useZodResolver(forgotPasswordSchema);

    // Initialize the form:
    const sendResetPasswordEmailForm = useForm<z.infer<typeof forgotPasswordSchema>>({
        defaultValues: {
            email: queryEmail ?? '',
        },
        mode: 'onSubmit',
        resolver,
    });

    // Get the challenge data:
    const mutateSendResetPasswordEmail = useMutation({
        mutationFn: async ({ email }: { email: string }) => {
            const response = await forgotPassword(email);

            if (response?.error || !response) {
                throw standardizeError(response);
            }

            return response;
        },
        onError: (caughtError: (Error & Partial<ApiErrorType>) | ApiErrorType) => {
            const errorResponse = caughtError.error ? caughtError : standardizeError(caughtError);
            setIsSent(false);
            return toast.error(errorResponse.message, {
                description: errorResponse.description,
                id: 'error-sending-email',
            });
        },
        onSuccess: async () => {
            setIsSent(true);
        },
        retry: 3,
        retryDelay: (attempt) => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000), // 30 seconds.
    });

    // Handle the form submission:
    const handleSendResetPasswordEmail = async (data: z.infer<typeof forgotPasswordSchema>) => {
        await mutateSendResetPasswordEmail.mutateAsync(data);
    };

    // If the email was sent:
    if (isSent) {
        return (
            <div className="flex w-full flex-col items-center justify-center gap-2">
                <div className="flex w-full flex-col items-center justify-center gap-6">
                    <div className="flex flex-col items-center justify-center gap-3">
                        <div className="bg-primary-100 dark:bg-primary-900 mb-3 flex size-16 items-center justify-center rounded-full">
                            <EnvelopeIcon
                                className="text-primary-500 dark:text-primary-400 size-8"
                                weight="duotone"
                            />
                        </div>
                        <h1 className="text-surface-900 mb-2 text-center text-3xl leading-tight font-bold tracking-tight md:text-4xl dark:text-white">
                            {titleCase('Password Recovery Sent')}
                        </h1>
                        <p className="text-surface-600 dark:text-surface-400 text-center">
                            Please check your inbox for the reset email, it will be there shortly.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            className="w-full"
                            color="primary"
                            shape="rounded"
                            size="lg"
                            variant="solid"
                            onClick={() => {
                                const email = sendResetPasswordEmailForm.getValues().email;
                                const emailDomain = email.split('@')[1];
                                const appDomain: string =
                                    env.NEXT_PUBLIC_APP_URL.split('://')[1].split('/')[0] ?? '';
                                const supabaseDomain: string =
                                    env.NEXT_PUBLIC_SUPABASE_URL.split('://')[1].split('/')[0] ?? '';

                                const emailProviders: Record<string, string> = {
                                    'aol.com': 'https://mail.aol.com/',
                                    'example.com': 'https://mail.google.com/',
                                    'hotmail.com': 'https://outlook.live.com/',
                                    'icloud.com': 'https://www.icloud.com/mail/',
                                    'outlook.com': 'https://outlook.live.com/',
                                    'protonmail.com': 'https://mail.protonmail.com/',
                                    'yahoo.com': 'https://mail.yahoo.com/',
                                    'yandex.com': 'https://mail.yandex.com/',
                                };

                                const emailProvidersSniperLinks: Record<string, string> = {
                                    // Gmail: Has support for all Sniper Link features by ESP.
                                    'example.com': `https://mail.google.com/mail/u/${email}/#search/from%3A${appDomain}+OR+from%3A${supabaseDomain}+in%3Aanywhere+newer_than%3A1d`,

                                    // Icloud: Only supports the Desktop Link and iOS Link.
                                    'icloud.com': `https://www.icloud.com/mail/#search/from%3A${appDomain}+OR+from%3A${supabaseDomain}`,

                                    // Outlook: Doesn't support the From Filter, Spam Piercer, and Time Frame.
                                    'outlook.com': `https://outlook.live.com/mail/inbox/search?q=from%3A${appDomain}+OR+from%3A${supabaseDomain}`,

                                    // ProtonMail: Doesn't support the Account Scope.
                                    'protonmail.com': `https://mail.protonmail.com/search?keyword=${appDomain}+OR+keyword=${supabaseDomain}`,

                                    // Yahoo: Doesn't support the Account Scope.
                                    'yahoo.com': `https://mail.yahoo.com/d/search/keyword=${appDomain}+OR+keyword=${supabaseDomain}`,
                                };

                                const emailProviderURL =
                                    emailProvidersSniperLinks[emailDomain] ?? emailProviders[emailDomain];

                                if (process.env.NODE_ENV === 'development') {
                                    // Open the InBucket in
                                    window.open(
                                        `http://verto.local:54324/m/${email.split('@')[0]}`,
                                        '_blank',
                                    );
                                } else if (emailProviderURL) {
                                    // Open the email provider link:
                                    window.open(emailProviderURL, '_blank');
                                }
                            }}
                        >
                            <TrayArrowDownIcon className="size-5" weight="duotone" />
                            Open Email
                        </Button>
                        <Button
                            className="w-full"
                            color="primary"
                            shape="rounded"
                            size="lg"
                            variant="soft"
                            onClick={() => {
                                setIsSent(false);
                            }}
                        >
                            <ArrowCounterClockwiseIcon className="size-5" weight="duotone" />
                            Resend
                        </Button>
                    </div>
                    <div className="text-center">
                        <Link
                            className="text-muted dark:text-muted text-sm font-medium hover:underline"
                            href="/auth/sign-in"
                        >
                            Back to login
                        </Link>
                        <span className="text-muted dark:text-muted text-sm font-medium"> or </span>
                        <Link
                            className="text-muted dark:text-muted text-sm font-medium hover:underline"
                            href="/auth/sign-up"
                        >
                            Create an account
                        </Link>
                        <span className="text-muted dark:text-muted text-sm font-medium">.</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex w-full flex-col items-center justify-center gap-2">
            <div className="flex w-full flex-col items-center justify-center gap-5">
                <div className="mb-5 flex flex-col items-center justify-center gap-3">
                    <div className="bg-primary-100 dark:bg-primary-900 mb-3 flex size-16 items-center justify-center rounded-full">
                        <KeyholeIcon
                            className="text-primary-500 dark:text-primary-400 size-8"
                            weight="duotone"
                        />
                    </div>
                    <h1 className="text-surface-900 mb-2 text-center text-3xl leading-tight font-bold tracking-tight md:text-4xl dark:text-white">
                        {titleCase('Forgot your password?')}
                    </h1>
                    <p className="text-surface-600 dark:text-surface-400 text-center">
                        No worries! Enter your email, and we'll send you a reset code to get back into your
                        account.
                    </p>
                </div>

                <FormProvider {...sendResetPasswordEmailForm}>
                    <form
                        className={cn('grid w-full items-center gap-4')}
                        onSubmit={sendResetPasswordEmailForm.handleSubmit(handleSendResetPasswordEmail)}
                    >
                        <FormField
                            control={sendResetPasswordEmailForm.control}
                            name="email"
                            render={({ field }) => {
                                return (
                                    <FormItem className="w-full">
                                        <FormLabel htmlFor="pin">Email</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                className="w-full"
                                                id="email"
                                                placeholder="sample@example.com"
                                                type="text"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                );
                            }}
                        />
                        <Button
                            className="w-full"
                            color="primary"
                            loading={mutateSendResetPasswordEmail.isPending}
                            shape="rounded"
                            size="lg"
                            type="submit"
                            variant={mutateSendResetPasswordEmail.isPending ? 'soft' : 'solid'}
                        >
                            {!mutateSendResetPasswordEmail.isPending ? (
                                <Fragment>
                                    <PaperPlaneTiltIcon
                                        className="size-5"
                                        color="currentColor"
                                        weight="duotone"
                                    />
                                    <span>Send Password Recovery</span>
                                </Fragment>
                            ) : (
                                'Sending Email'
                            )}
                        </Button>
                    </form>
                </FormProvider>

                <div className="text-center">
                    <Link
                        className="text-muted dark:text-muted text-sm font-medium hover:underline"
                        href="/auth/sign-in"
                    >
                        Back to login
                    </Link>
                    <span className="text-muted dark:text-muted text-sm font-medium"> or </span>
                    <Link
                        className="text-muted dark:text-muted text-sm font-medium hover:underline"
                        href="/auth/sign-up"
                    >
                        Create an account
                    </Link>
                    <span className="text-muted dark:text-muted text-sm font-medium">.</span>
                </div>
            </div>
        </div>
    );
}
