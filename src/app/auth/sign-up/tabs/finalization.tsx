/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

// ! Form Components - Personal Information, Contact Information, Professional Information, Account Security, Done.
import {
    ArrowUUpLeftIcon,
    ArrowsCounterClockwiseIcon,
    CloudWarningIcon,
    EnvelopeIcon,
    SignInIcon,
    TrayArrowDownIcon,
} from '@phosphor-icons/react';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { Fragment, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { titleCase } from 'title-case';
import { resendConfirmationEmail } from '@/src/actions/auth/resend-confirmation-email';
import Spinner from '@/src/components/ui/spinner';
import { standardizeError } from '@/src/errors/api-errors';
import { Button } from '@components/ui/button';
import { getEmailProviderURL } from '@library/utils';
import type { RegistrationDataType } from '@/types/auth/registration';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponse, ApiResponseOrError } from '@/types/rest/response';

// * Done Screen:
// This is the last screen of the sign up process. It will display a welcome message and a button to go to the dashboard.
export default function Finalization({
    backward,
    error,
    information,
    isError,
    isLoading,
    isSuccess,
    success: _,
}: {
    isLoading: boolean;
    information: RegistrationDataType;
    isSuccess: boolean;
    success?: ApiResponse | null;
    successButtonText?: string;
    successButtonAction?: () => void;
    isError: boolean;
    error?: ApiErrorType | ApiResponse | null;
    backward: () => void;
}) {
    const [emailProvider, setEmailProvider] = useState<string | null>(null);

    useEffect(() => {
        if (information) {
            setEmailProvider(getEmailProviderURL(information?.contactInformation?.email?.toString()));
        }
    }, [information]);

    return (
        <div className="flex w-full flex-col items-center justify-center gap-2">
            <div className="flex w-full flex-col items-center justify-center gap-5">
                {isLoading && (
                    <div className="mb-5 flex flex-col items-center justify-center gap-3">
                        <div className="bg-primary-100 dark:bg-primary-900 mb-3 flex size-16 items-center justify-center rounded-full">
                            <Spinner
                                className="text-primary-500 dark:text-primary-400 size-8"
                                color="primary"
                                size="md"
                            />
                        </div>
                        <h1 className="text-surface-900 text-center text-3xl leading-tight font-bold tracking-tight md:text-4xl dark:text-white">
                            Almost There!
                        </h1>
                        <p className="text-surface-600 dark:text-surface-400 text-center font-medium">
                            Please wait while we finalize your account registration.
                        </p>
                    </div>
                )}
                {!isLoading && isSuccess && !isError && (
                    <Fragment>
                        <div className="mb-5 flex flex-col items-center justify-center gap-3">
                            <div className="bg-primary-100 dark:bg-primary-900 mb-3 flex size-16 items-center justify-center rounded-full">
                                <EnvelopeIcon
                                    className="text-primary-500 dark:text-primary-400 size-8"
                                    weight="duotone"
                                />
                            </div>
                            <h1 className="text-surface-900 text-center text-3xl leading-tight font-bold tracking-tight md:text-4xl dark:text-white">
                                Verify Your Email
                            </h1>
                            <p className="text-surface-600 dark:text-surface-400 text-center font-medium">
                                To complete your registration, please check your inbox and confirm your email
                                address.
                            </p>
                        </div>
                        {
                            // Button to open the email client:
                            emailProvider && (
                                <div className="flex w-full flex-col items-center justify-center gap-5">
                                    <Button
                                        asChild
                                        className="w-full"
                                        color="primary"
                                        size="lg"
                                        type="button"
                                        variant="solid"
                                    >
                                        <a href={emailProvider} rel="noreferrer" target="_blank">
                                            <TrayArrowDownIcon
                                                className="size-5"
                                                color="currentColor"
                                                weight="duotone"
                                            />
                                            <span>Open Email Client</span>
                                        </a>
                                    </Button>
                                </div>
                            )
                        }
                        <div className="flex w-full flex-col items-center justify-center gap-5">
                            <p className="text-surface-600 dark:text-surface-400 text-center text-sm">
                                Didn't receive an email? Or has the verification link expired?
                                <br />
                                No worries! Click the button below to resend the email.
                            </p>
                            <div className="flex w-full flex-col items-center justify-center gap-5">
                                <ResendEmailButton email={information.contactInformation.email.toString()} />
                            </div>
                        </div>
                    </Fragment>
                )}
                {((!isLoading && isError && !isSuccess) || (!isLoading && !isSuccess && !isError)) && (
                    <Fragment>
                        <div className="mb-5 flex flex-col items-center justify-center gap-3">
                            <div className="bg-primary-100 dark:bg-primary-900 mb-3 flex size-16 items-center justify-center rounded-full">
                                <CloudWarningIcon
                                    className="text-primary-500 dark:text-primary-400 size-8"
                                    weight="duotone"
                                />
                            </div>
                            <h1 className="text-surface-900 text-center text-3xl leading-tight font-bold tracking-tight md:text-4xl dark:text-white">
                                {titleCase(
                                    error?.message.replace(/\.$/, '') ?? 'Account Registration Failed',
                                )}
                            </h1>
                            <p className="text-surface-600 dark:text-surface-400 text-center font-medium">
                                {error?.description ?? 'An error occurred while registering your account.'}
                            </p>
                        </div>
                        <div className="mb-5 flex w-full flex-col items-center justify-center gap-2">
                            <Button
                                className="w-full"
                                color="primary"
                                shape="rounded"
                                size="lg"
                                type="button"
                                variant="soft"
                                onClick={backward}
                            >
                                <ArrowUUpLeftIcon className="size-5" color="currentColor" weight="duotone" />
                                <span>Try Again</span>
                            </Button>
                            {error?.code === 'EMAIL_EXISTS' && (
                                <Button
                                    asChild
                                    className="w-full"
                                    color="primary"
                                    shape="rounded"
                                    size="lg"
                                    type="button"
                                    variant="solid"
                                >
                                    <Link href="/auth/sign-in">
                                        <SignInIcon
                                            className="size-5"
                                            color="currentColor"
                                            weight="duotone"
                                        />
                                        <span>Login Instead</span>
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </Fragment>
                )}
            </div>
        </div>
    );
}

function ResendEmailButton({ email }: { email: string }) {
    // Mutation to resend the confirmation email:
    const mutateConfirmationResend = useMutation({
        mutationFn: async ({ email: resendToEmail }: { email: string }) => {
            // Send the confirmation email:
            const response = await resendConfirmationEmail(resendToEmail, 'signup');

            // Check if there is an error:
            if (response?.error || !response) {
                throw standardizeError(response);
            }

            return response;
        },
        onError: (caughtError: (Error & Partial<ApiErrorType>) | ApiErrorType) => {
            const errorResponse = caughtError.error ? caughtError : standardizeError(caughtError);
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

    const handleResendConfirmation = async () => {
        mutateConfirmationResend.mutate({ email: email ?? '' });
    };

    return (
        <Button
            className="w-full"
            color="default"
            loading={mutateConfirmationResend.isPending}
            size="lg"
            type="submit"
            variant="soft"
            onClick={handleResendConfirmation}
        >
            {!mutateConfirmationResend.isPending && (
                <Fragment>
                    <ArrowsCounterClockwiseIcon className="size-5" color="currentColor" weight="duotone" />
                    Resend Confirmation
                </Fragment>
            )}
            {mutateConfirmationResend.isPending && 'Sending Confirmation'}
        </Button>
    );
}
