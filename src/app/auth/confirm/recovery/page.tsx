/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { useZodResolver } from '@/src/hooks/use-zod-resolver';
import {
    ArrowCounterClockwiseIcon,
    ArrowsCounterClockwiseIcon,
    EnvelopeIcon,
    LockLaminatedOpenIcon,
    PasswordIcon,
    TrayArrowDownIcon,
} from '@phosphor-icons/react';
import { LinkBreak } from '@phosphor-icons/react/dist/ssr';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Fragment, use, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { titleCase } from 'title-case';
import { z } from 'zod';
import { forgotPassword } from '@/src/actions/auth/forgot-password';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/src/components/ui/form';
import { Input } from '@/src/components/ui/input';
import { standardizeError } from '@/src/errors/api-errors';
import { Button } from '@components/ui/button';
import { getEmailProviderURL } from '@library/utils';
import type { SearchParams } from '@/types/rest/common';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';

export default function RecoveryMiddlewarePage(props: { searchParams: Promise<SearchParams> }) {
    const searchParams = use(props.searchParams);
    // Get the confirmation URL from the URL:
    const encodedRecoveryUrl: string | null = (searchParams?.redirectUrl as string | null) ?? null;
    const redirectUrl = encodedRecoveryUrl ? decodeURIComponent(encodedRecoveryUrl) : null;

    // Check if redirectUrl is valid
    if (!redirectUrl) {
        return <InvalidLinkCase />;
    }

    // Parse the recovery URL to extract its parameters
    let url: URL;
    try {
        url = new URL(redirectUrl);
    } catch {
        return <InvalidLinkCase />;
    }

    const urlParams = new URLSearchParams(url.search);

    // Required parameters for the recovery URL:
    const requiredParams = ['token', 'type', 'redirect_to'];

    // Check for missing parameters and add them if they are present in the searchParams
    let isValid = true;
    requiredParams.forEach((param) => {
        if (!urlParams.has(param)) {
            if (searchParams[param]) {
                urlParams.set(param, searchParams[param] as string);
            } else {
                isValid = false;
            }
        } else if (param === 'token' && searchParams[param]) {
            // Ensure the token parameter is not duplicated
            urlParams.set(param, searchParams[param] as string);
        }
    });

    // Reconstruct the recovery URL with the updated parameters
    const updatedRedirectUrl = `${url.origin}${url.pathname}?${urlParams.toString()}`;

    if (!isValid) {
        return <InvalidLinkCase />;
    }

    return (
        <div className="mx-auto flex h-auto max-w-full flex-col items-center justify-center gap-2 overflow-hidden lg:py-0">
            <div className="flex w-full max-w-full flex-col items-center justify-center gap-5">
                <div className="flex w-full max-w-full flex-col items-center justify-center gap-3">
                    <div className="bg-primary-100 dark:bg-primary-900 mb-3 flex size-16 items-center justify-center rounded-full">
                        <LockLaminatedOpenIcon
                            className="text-primary-500 dark:text-primary-400 size-8"
                            weight="duotone"
                        />
                    </div>
                    <h1 className="text-surface-900 mb-2 w-full text-center text-3xl leading-tight font-bold tracking-tight md:text-4xl dark:text-white">
                        Recover Your Account
                    </h1>
                    <p className="text-surface-600 dark:text-surface-400 w-full text-center">
                        To reset your password, please click the button below. You will be redirected to a
                        secure page where you can create a new password.
                    </p>
                    <p className="text-surface-600 dark:text-surface-400 w-full text-center">
                        If you did not request a password reset, please ignore this message or contact our
                        support team for assistance.
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
                            <PasswordIcon className="size-5" color="currentColor" weight="duotone" />
                            Reset Your Password
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
            const response = await forgotPassword(emailConcerned);

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
            toast.success(data.message ?? 'Recovery email sent successfully.', {
                description: data.description ?? 'Please check your inbox, it may take a few moments.',
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
        mutateConfirmationResend.mutate({ email: email ?? emailForm.getValues().email ?? '' });
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
                            {titleCase('Recovery Email Sent')}
                        </h1>
                        <p className="text-surface-600 dark:text-surface-400 text-center">
                            We have sent a recovery email to <span className="font-bold">{email}</span>.
                            Please check your inbox and follow the instructions to reset your password.
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
                                    const emailProviderURL = getEmailProviderURL(email);

                                    if (emailProviderURL) {
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
                        {titleCase('Recovery Link is Expired or Invalid')}
                    </h1>
                    <p className="text-surface-600 dark:text-surface-400 text-center">
                        The recovery link you are trying to access is either invalid or expired. Please make
                        sure you have the correct link. You can request a new link by clicking the button
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
                                                            placeholder="person@example.com"
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
                                        Resend Recovery Email
                                    </Fragment>
                                )}
                                {mutateConfirmationResend.isPending && 'Sending Email'}
                            </Button>
                        </form>
                    </FormProvider>
                </div>
            </div>
        </div>
    );
}
