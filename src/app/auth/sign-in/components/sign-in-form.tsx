/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { HandWavingIcon, SignInIcon } from '@phosphor-icons/react';
import Link from 'next/link';
import { useRouter } from 'next-nprogress-bar';
import { FormProvider } from 'react-hook-form';
import { OAuthComponent } from '@/src/app/auth/oauth/oauth-component';
import AlertSection from '@app/auth/sign-in/components/alert-section';
import SignInFormFields from '@app/auth/sign-in/components/sign-in-form-fields';
import { Button } from '@components/ui/button';
import { Checkbox } from '@components/ui/checkbox';
import { Label } from '@components/ui/label';
import { useSignIn } from '@hooks/queries/auth/use-sign-in';

const forgotPasswordUrl = '/auth/forgot-password';

function SignInForm() {
    const router = useRouter();

    const {
        errorAlert,
        formMethods,
        handleFinalSubmit,
        isPending,
        onClose,
        resolvedForgotPasswordUrl,
        successAlert,
    } = useSignIn({
        router,
        forgotPasswordUrl,
    });

    const { handleSubmit } = formMethods;

    return (
        <div className="flex w-full flex-col items-center justify-center gap-2">
            <div className="flex w-full flex-col items-center justify-center gap-5">
                <div className="mb-5 flex flex-col items-center justify-center gap-3">
                    <div className="bg-primary-100 dark:bg-primary-900 mb-3 flex size-16 items-center justify-center rounded-full">
                        <HandWavingIcon
                            className="text-primary-500 dark:text-primary-400 size-8"
                            weight="duotone"
                        />
                    </div>
                    <h1 className="text-surface-900 text-center text-3xl leading-tight font-bold tracking-tight md:text-4xl dark:text-white">
                        Welcome back!
                    </h1>
                    <p className="text-surface-600 dark:text-surface-400 text-center font-medium">
                        Sign In to Your Account to Continue.
                    </p>
                </div>
                <FormProvider {...formMethods}>
                    <form
                        className="mb-5 flex w-full flex-col items-center justify-center gap-5"
                        onSubmit={handleSubmit(handleFinalSubmit)}
                    >
                        {/* Alert Section */}
                        <AlertSection errorAlert={errorAlert} successAlert={successAlert} onClose={onClose} />

                        {/* Form Fields */}
                        <SignInFormFields
                            control={formMethods.control}
                            errors={formMethods.formState.errors}
                            touchedFields={formMethods.formState.touchedFields}
                        />

                        {/* Remember Me and Forgot Password */}
                        <div className="flex w-full items-center justify-between">
                            <div className="flex items-center justify-start">
                                <Checkbox color="primary" required={false} />
                                <Label
                                    className="text-foreground ml-2 text-sm font-medium"
                                    htmlFor="remember"
                                >
                                    Keep me signed in on this device
                                </Label>
                            </div>
                            <Link
                                className="text-primary-500 dark:text-primary-500 cursor-pointer text-sm font-medium hover:underline"
                                href={resolvedForgotPasswordUrl}
                            >
                                Forgot password?
                            </Link>
                        </div>

                        {/* Submit Button */}
                        <div className="mt-2 flex w-full flex-row items-stretch justify-end gap-2">
                            <Button
                                className="w-full"
                                color="primary"
                                disabled={isPending}
                                loading={isPending}
                                shape="rounded"
                                size="lg"
                                type="submit"
                                variant="solid"
                            >
                                {isPending ? (
                                    'Signing In'
                                ) : (
                                    <>
                                        <SignInIcon className="size-5" weight="duotone" /> Sign in
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </FormProvider>
                {/* Social Buttons */}
                <OAuthComponent page="sign-in" />
            </div>
        </div>
    );
}

export default SignInForm;
