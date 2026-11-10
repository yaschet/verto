/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { useZodResolver } from '@/src/hooks/use-zod-resolver';
import {
    ArrowCounterClockwiseIcon,
    ArrowsCounterClockwiseIcon,
    HouseIcon,
    UserCircleCheckIcon,
    UserCircleDashedIcon,
} from '@phosphor-icons/react';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next-nprogress-bar';
import { Fragment, useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { titleCase } from 'title-case';
import { z } from 'zod';
import { resetPassword } from '@/src/actions/auth/reset-password';
import { FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/src/components/ui/form';
import { standardizeError } from '@/src/errors/api-errors';
import { checkPasswordStrength, cn, generateStrongPassword } from '@/src/library/utils';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Progress } from '@components/ui/progress';
import type { ApiErrorType } from '@/types/rest/errors';

export default function ResetPasswordPageContent() {
    return <ResetPasswordForm />;
}

function ResetPasswordForm() {
    const router = useRouter();
    const [isPasswordReset, setIsPasswordReset] = useState(false);
    const [redirectionCount, setRedirectionCount] = useState(5);

    useEffect(() => {
        if (isPasswordReset) {
            const timer = setInterval(() => {
                setRedirectionCount((prevCount) => (prevCount <= 0 ? 0 : prevCount - 1));
            }, 1000);

            return () => {
                clearInterval(timer);
            };
        }
    }, [isPasswordReset]);

    useEffect(() => {
        if (redirectionCount === 0) {
            // Redirect or handle the event when the timer finishes
            router.push('/');
        }
    }, [redirectionCount, router]);

    // Schema for the email:
    const resetPasswordSchema = z.object({
        newPassword: z
            .string()
            .min(1, {
                message: 'New password is required.',
            })
            .refine(
                (data) =>
                    checkPasswordStrength(data).label === 'Strong' ||
                    checkPasswordStrength(data).label === 'Medium',
                {
                    message: 'Password is not strong enough.',
                },
            ),
        newPasswordConfirmation: z.string().min(1, {
            message: 'Password confirmation is required.',
        }),
    });

    const resolver = useZodResolver(resetPasswordSchema);

    // Initialize the form:
    const resetPasswordForm = useForm<z.infer<typeof resetPasswordSchema>>({
        defaultValues: {
            newPassword: '',
            newPasswordConfirmation: '',
        },
        mode: 'onSubmit',
        resolver,
    });

    // Get the challenge data:
    const mutatePasswordReset = useMutation({
        mutationFn: async ({
            newPassword,
            newPasswordConfirmation: _,
        }: z.infer<typeof resetPasswordSchema>) => {
            // Attempt to Change the Password:
            const response = await resetPassword(newPassword);

            // Handle the Response:
            if (response?.error || !response) {
                throw standardizeError(response);
            }

            return response;
        },
        onError: (caughtError: (Error & Partial<ApiErrorType>) | ApiErrorType) => {
            const errorResponse = caughtError.error ? caughtError : standardizeError(caughtError);
            setIsPasswordReset(false);
            return toast.error(errorResponse.message, {
                description: errorResponse.description,
                id: 'error-resetting-password',
            });
        },
        onSuccess: async () => {
            setIsPasswordReset(true);
        },
    });

    // Handle the form submission:
    const handlePasswordReset = async (data: z.infer<typeof resetPasswordSchema>) => {
        await mutatePasswordReset.mutateAsync(data);
    };

    if (isPasswordReset) {
        return (
            <div className="flex w-full flex-col items-center justify-center gap-2">
                <div className="flex w-full flex-col items-center justify-center gap-6">
                    <div className="flex flex-col items-center justify-center gap-3">
                        <div className="bg-primary-100 dark:bg-primary-900 mb-3 flex size-16 items-center justify-center rounded-full">
                            <UserCircleCheckIcon
                                className="text-primary-500 dark:text-primary-400 size-8"
                                weight="duotone"
                            />
                        </div>
                        <h1 className="text-surface-900 mb-2 text-center text-3xl leading-tight font-bold tracking-tight md:text-4xl dark:text-white">
                            Password Reset Successful!
                        </h1>
                        <p className="text-surface-600 dark:text-surface-400 text-center">
                            Your password has been successfully reset. You can now sign in with your new
                            password.
                        </p>
                        <p className="text-surface-600 dark:text-surface-400 text-center">
                            You will be redirected to the home page in{' '}
                            <span className="font-semibold">{redirectionCount} seconds</span>.
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
                                router.push('/');
                            }}
                        >
                            <HouseIcon className="size-5" weight="duotone" />
                            {titleCase('Return Home')}
                        </Button>
                        <Button
                            className="w-full"
                            color="primary"
                            shape="rounded"
                            size="lg"
                            variant="soft"
                            onClick={() => {
                                setIsPasswordReset(false);
                            }}
                        >
                            <UserCircleDashedIcon className="size-5" weight="duotone" />
                            {titleCase('Manage your Account')}
                        </Button>
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
                        <ArrowsCounterClockwiseIcon
                            className="text-primary-500 dark:text-primary-400 size-8"
                            weight="duotone"
                        />
                    </div>
                    <h1 className="text-surface-900 mb-2 text-center text-3xl leading-tight font-bold tracking-tight md:text-4xl dark:text-white">
                        Reset Password
                    </h1>
                    <p className="text-surface-600 dark:text-surface-400 text-center">
                        Enter a new password to regain access. You will need to sign in again. Save your new
                        password securely.
                    </p>
                </div>

                <FormProvider {...resetPasswordForm}>
                    <form
                        className={cn('grid w-full items-center gap-4')}
                        onSubmit={resetPasswordForm.handleSubmit(handlePasswordReset)}
                    >
                        {/* New Password */}
                        <FormField
                            control={resetPasswordForm.control}
                            name="newPassword"
                            render={({ field }) => {
                                return (
                                    <FormItem className="w-full">
                                        <FormLabel
                                            className="text-foreground text-sm font-medium"
                                            htmlFor="password"
                                        >
                                            New Password
                                        </FormLabel>
                                        <div className="flex w-full flex-row flex-wrap items-stretch justify-start gap-2 lg:flex-nowrap">
                                            <Input
                                                autoComplete="new-password"
                                                hasError={!!resetPasswordForm.formState.errors.newPassword}
                                                id="password"
                                                placeholder="Set a new password"
                                                shape="rounded"
                                                size="md"
                                                type="password"
                                                {...field}
                                            />
                                            <div className="flex w-full flex-row items-stretch justify-end gap-2 lg:w-fit lg:justify-start">
                                                <Button
                                                    color="secondary"
                                                    size="sm"
                                                    type="button"
                                                    variant="soft"
                                                    onClick={() => {
                                                        resetPasswordForm.setValue(
                                                            'newPassword',
                                                            generateStrongPassword(),
                                                        );
                                                        resetPasswordForm
                                                            .trigger('newPassword')
                                                            .then((r) => r);

                                                        resetPasswordForm.setValue(
                                                            'newPasswordConfirmation',
                                                            resetPasswordForm.getValues('newPassword'),
                                                        );
                                                        resetPasswordForm
                                                            .trigger('newPasswordConfirmation')
                                                            .then((r) => r);
                                                    }}
                                                >
                                                    Suggest Password
                                                </Button>
                                            </div>
                                        </div>
                                        <FormMessage />
                                        <FormDescription>
                                            Password must be 12 or more characters, and contain at least one
                                            number, one uppercase letter, one lowercase letter, and one
                                            special character.
                                        </FormDescription>
                                    </FormItem>
                                );
                            }}
                        />
                        {/* Password Strength Display */}
                        {resetPasswordForm.watch('newPassword') && (
                            <div className="mb-3 flex w-full flex-col items-center justify-start gap-2">
                                <Label className="flex w-full flex-row items-center justify-start gap-2">
                                    <span className="text-muted text-sm">New Password Strength:</span>
                                    <span className="text-foreground text-sm font-semibold">
                                        {checkPasswordStrength(resetPasswordForm.watch('newPassword')).label}
                                    </span>
                                </Label>
                                <Progress
                                    color={
                                        checkPasswordStrength(resetPasswordForm.watch('newPassword')).color
                                    }
                                    value={
                                        (checkPasswordStrength(resetPasswordForm.watch('newPassword')).value /
                                            4) *
                                        100
                                    }
                                />
                            </div>
                        )}

                        {/* Confirm Password */}
                        <FormField
                            control={resetPasswordForm.control}
                            name="newPasswordConfirmation"
                            render={({ field }) => {
                                return (
                                    <FormItem className="w-full">
                                        <FormLabel
                                            className="text-foreground text-sm font-medium"
                                            htmlFor="confirmPassword"
                                        >
                                            Confirm Password
                                        </FormLabel>
                                        <div className="w-full">
                                            <Input
                                                autoComplete="newPassword"
                                                hasError={
                                                    !!resetPasswordForm.formState.errors
                                                        .newPasswordConfirmation
                                                }
                                                id="confirmPassword"
                                                placeholder="Confirm your new password"
                                                shape="rounded"
                                                size="md"
                                                type="password"
                                                {...field}
                                            />
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                );
                            }}
                        />
                        <Button
                            className="w-full"
                            color="primary"
                            loading={mutatePasswordReset.isPending}
                            shape="rounded"
                            size="lg"
                            type="submit"
                            variant={mutatePasswordReset.isPending ? 'soft' : 'solid'}
                        >
                            {!mutatePasswordReset.isPending ? (
                                <Fragment>
                                    <ArrowCounterClockwiseIcon
                                        className="size-5"
                                        color="currentColor"
                                        weight="duotone"
                                    />
                                    <span>Reset Password</span>
                                </Fragment>
                            ) : (
                                'Resetting Password'
                            )}
                        </Button>
                    </form>
                </FormProvider>

                <div className="text-center">
                    <Link
                        className="text-muted dark:text-muted text-sm font-medium hover:underline"
                        href="/auth/sign-in"
                    >
                        Log in
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
