/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { useZodResolver } from '@/src/hooks/use-zod-resolver';
import {
    ArrowCounterClockwiseIcon,
    ArrowsCounterClockwiseIcon,
    CheckIcon,
    EnvelopeIcon,
    TrayArrowDownIcon,
} from '@phosphor-icons/react';
import { Confetti, LinkBreak } from '@phosphor-icons/react/dist/ssr';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Fragment, use, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { titleCase } from 'title-case';
import { z } from 'zod';
import { resendConfirmationEmail } from '@/src/actions/auth/resend-confirmation-email';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/src/components/ui/form';
import { Input } from '@/src/components/ui/input';
import { env } from '@/src/env';
import { standardizeError } from '@/src/errors/api-errors';
import { Button } from '@components/ui/button';
import type { SearchParams } from '@/types/rest/common';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';

export default function ConfirmSignupPage(props: { searchParams: Promise<SearchParams> }) {
    const searchParams = use(props.searchParams);
    // Get the confirmation URL from the URL:
    const encodedRecoveryUrl: string | null = (searchParams?.redirectUrl as string | null) ?? null;
    const redirectUrl = encodedRecoveryUrl ? decodeURIComponent(encodedRecoveryUrl) : null;

    // Parse the recovery URL to extract its parameters
    const url = new URL(redirectUrl ?? '');
    const urlParams = new URLSearchParams(url.search);

    // Required parameters
    const requiredParams: string[] = ['token', 'type'];

    // Check for missing parameters and add them if they are present in the searchParams
    let isValid = true;
    requiredParams.forEach((param) => {
        if (!urlParams.has(param)) {
            if (searchParams[param]) {
                urlParams.set(param, searchParams[param] as string);
            } else {
                isValid = false;
            }
        }
    });

    // Reconstruct the recovery URL with the updated parameters
    const updatedRedirectUrl = `${url.origin}${url.pathname}?${urlParams.toString()}`;

    if (!isValid) {
        return <InvalidLinkCase />;
    }

    return (
        <div className="mx-auto flex h-auto flex-col items-center justify-center gap-2 lg:py-0">
            <div className="flex w-full flex-col items-center justify-center gap-5">
                <div className="flex flex-col items-center justify-center gap-3">
                    <div className="bg-primary-100 dark:bg-primary-900 mb-3 flex size-16 items-center justify-center rounded-full">
                        <Confetti
                            className="text-primary-500 dark:text-primary-400 size-8"
                            weight="duotone"
                        />
                    </div>
                    <h1 className="text-surface-900 mb-2 text-center text-3xl leading-tight font-bold tracking-tight md:text-4xl dark:text-white">
                        {titleCase('Confirm your Signup!')}
                    </h1>
                    <p className="text-surface-600 dark:text-surface-400 text-center">
                        Welcome to <span className="font-bold">Verto</span>, the leading platform for
                        professional translators.
                    </p>
                    <p className="text-surface-600 dark:text-surface-400 text-center">
                        Thank you for joining us. To complete your registration, please click the button
                        below. This extra step ensures your account's security and helps us verify your email
                        address.
                    </p>
                </div>
                <div className="mt-3 flex w-full flex-col items-center justify-center gap-2">
                    <Button
                        asChild
                        className="w-full"
                        color="default"
                        size="lg"
                        type="submit"
                        variant="solid"
                    >
                        <Link href={updatedRedirectUrl}>
                            <CheckIcon className="size-5" color="currentColor" weight="duotone" />
                            Confirm Signup
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}

function InvalidLinkCase() {
    // Get Search Params:
    const searchParams = useSearchParams();

    // Optional: Check if the user's email is present in the URL:
    const email: string | null = searchParams.get('email')?.toString() ?? null;

    // State for the confirmation email:
    const [isSent, setIsSent] = useState(false);

    // Mutation to resend the confirmation email:
    const mutateConfirmationResend = useMutation({
        mutationFn: async ({ email: emailConcerned }: { email: string }) => {
            // Send the confirmation email:
            const response = await resendConfirmationEmail(emailConcerned, 'signup');

            // Check if there is an error:
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
        onSuccess: (data: ApiResponseOrError) => {
            toast.success(data.message ?? 'Confirmation email sent successfully', {
                description: data.description ?? 'You can now check your email for the confirmation link.',
                id: 'confirmation-email-sent',
            });
        },
    });

    // Schema for the email:
    const emailSchema = z.object({
        email: z
            .string()
            .email({
                message: 'Email is invalid.',
            })
            .min(1, {
                message: 'Email is required.',
            }),
    });

    const resolver = useZodResolver(emailSchema);

    // Form for the email:
    const emailForm = useForm<z.infer<typeof emailSchema>>({
        defaultValues: {
            email: email ?? '',
        },
        mode: 'onSubmit',
        resolver,
    });

    const handleResendConfirmation = async () => {
        mutateConfirmationResend.mutate({ email: email ?? '' });
    };

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
                            {titleCase('Confirmation Email Sent')}
                        </h1>
                        <p className="text-surface-600 dark:text-surface-400 text-center">
                            We have sent a confirmation email to <span className="font-bold">{email}</span>.
                            Please check your inbox and follow the instructions to complete your registration.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {email && (
                            <Button
                                className="w-full"
                                color="primary"
                                shape="rounded"
                                size="lg"
                                variant="solid"
                                onClick={() => {
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
                        )}
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
        <div className="mx-auto flex h-auto flex-col items-center justify-center gap-2 lg:py-0">
            <div className="container flex w-full max-w-xl flex-col items-center justify-center">
                <div className="flex w-full flex-col items-center justify-center gap-3">
                    <div className="bg-primary-100 dark:bg-primary-900 mb-3 flex size-16 items-center justify-center rounded-full">
                        <LinkBreak
                            className="text-primary-500 dark:text-primary-400 size-8"
                            weight="duotone"
                        />
                    </div>
                    <h1 className="text-surface-900 mb-2 text-center text-3xl leading-tight font-bold tracking-tight md:text-4xl dark:text-white">
                        {titleCase('Confirmation Link is Expired or Invalid')}
                    </h1>
                    <p className="text-surface-600 dark:text-surface-400 text-center">
                        The confirmation link you are trying to access is either invalid or expired. Please
                        make sure you have the correct link. You can request a new link by clicking the button
                        below.
                    </p>
                </div>
                <div className="mt-3 flex w-full flex-col items-center justify-center gap-2">
                    <FormProvider {...emailForm}>
                        <form
                            className="flex w-full flex-col items-center justify-center gap-4"
                            onSubmit={emailForm.handleSubmit(handleResendConfirmation)}
                        >
                            <div className="flex w-full flex-col items-center justify-center gap-2">
                                {!emailSchema.safeParse({ email })?.success && (
                                    <FormField
                                        control={emailForm.control}
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
                                )}
                            </div>
                            <Button
                                className="w-full"
                                color="primary"
                                loading={mutateConfirmationResend.isPending}
                                size="lg"
                                type="submit"
                                variant="solid"
                            >
                                {!mutateConfirmationResend.isPending && (
                                    <Fragment>
                                        <ArrowsCounterClockwiseIcon
                                            className="size-5"
                                            color="currentColor"
                                            weight="duotone"
                                        />
                                        Resend Confirmation
                                    </Fragment>
                                )}
                                {mutateConfirmationResend.isPending && 'Sending Confirmation'}
                            </Button>
                        </form>
                    </FormProvider>
                </div>
            </div>
        </div>
    );
}
