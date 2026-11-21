/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { useZodResolver } from '@/src/hooks/use-zod-resolver';
import { ArrowsClockwiseIcon } from '@phosphor-icons/react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next-nprogress-bar';
import { Fragment } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { standardizeError } from '@/errors/api-errors';
import { changeUserPassword, setUserPassword } from '@/src/actions/auth/change-user-password';
import { signOut } from '@/src/actions/auth/sign-out';
import { PanelSection } from '@app/(protected)/account/components/shared/panel-section';
import { Button } from '@components/ui/button';
import { FormDescription, FormField, FormItem, FormMessage } from '@components/ui/form';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Progress } from '@components/ui/progress';
import Spinner from '@components/ui/spinner';
import { useUserData } from '@hooks/queries/auth/use-user-data';
import { checkPasswordStrength, generateStrongPassword } from '@library/utils';
import { ChangePasswordSchema, SetPasswordSchema } from '@schemas/auth-schemas';
import type { ApiError } from '@/errors/api-errors';
import type { JSX } from 'react';
import type { z } from 'zod';

export default function ChangePasswordPanel({ hasPassword = true }: { hasPassword?: boolean }) {
    return (
        <Fragment>
            {' '}
            <PanelSection description="You can change your password here." title="Password">
                {/* Password Content */}
                <div className="flex w-full flex-col gap-4">
                    <div className="flex w-full flex-row gap-6">
                        <div className="flex w-full flex-col gap-3">
                            {hasPassword ? <ChangeCurrentPasswordForm /> : <SetUserPasswordForm />}
                        </div>
                    </div>
                </div>
            </PanelSection>
        </Fragment>
    );
}

/**
 * ### Change the Current Password Form.
 *
 * This form allows the user to change their current password, which requires him to enter the `valid` current>
 * Password, and then enter a `strong` new password. The form also includes a password strength indicator to help the
 * User> Understand the strength of the new password. Please note that the user must be signed in to change the
 * Password, and he must have set a password before.
 *
 * @returns {JSX.Element}
 */
function ChangeCurrentPasswordForm(): JSX.Element {
    const router = useRouter();

    // Global State:
    const { data: userData } = useUserData();
    const { user } = userData ?? {};

    // * - Change Password Form Schema:
    const zodSchema = ChangePasswordSchema;

    const form = useForm<z.infer<typeof zodSchema>>({
        defaultValues: {
            confirmPassword: '',
            currentPassword: '',
            newPassword: '',
        },
        mode: 'all',
        resolver: useZodResolver(zodSchema),
    });

    const passwordMutation = useMutation({
        mutationFn: async ({
            currentPassword,
            newPassword,
        }: {
            currentPassword: string;
            newPassword: string;
        }) => {
            // Attempt to Change the Password:
            const response = await changeUserPassword(currentPassword, newPassword);

            // Handle the Response:
            if (response?.error || !response) {
                throw standardizeError(response);
            }

            return response;
        },
        onError: (error: ApiError) => {
            if (error.code === 'INCORRECT_PASSWORD') {
                return form.setError('currentPassword', {
                    message: error.description,
                    type: 'manual',
                });
            } else if (error.code === 'EMPTY_PASSWORD') {
                return form.setError('newPassword', {
                    message: error.description,
                    type: 'manual',
                });
            } else if (error.code === 'WEAK_PASSWORD') {
                return form.setError('newPassword', {
                    message: error.description,
                    type: 'manual',
                });
            }

            // Show an Error Toast:
            return toast.error(error.title ?? error.message ?? 'Unexpected error.', {
                description: error.description ?? 'Oops, please try again later.',
            });
        },
        onSuccess: async (data) => {
            // Show a Success Toast:
            toast.success(data.message ?? 'Your password has been updated.', {
                description:
                    data.description ??
                    'To continue using your account, please sign in again with your new password.',
            });

            // Sign out the user after changing the password:
            await signOut();

            // Reset the Form:
            form.reset();

            return router.push('/auth/sign-in');
        },
    });

    const handleSubmit = form.handleSubmit(({ currentPassword, newPassword }) => {
        passwordMutation.mutate({ currentPassword, newPassword });
    });

    return (
        <FormProvider {...form}>
            <form className="flex w-full flex-col gap-2" onSubmit={handleSubmit}>
                {/* Hidden Form Input with the Email - to help the browser change the current user's password. */}
                <input autoComplete="email" name="email" type="hidden" value={user?.email ?? ''} />
                <input autoComplete="username" name="username" type="hidden" value={user?.email ?? ''} />

                {/* Current Password */}
                <FormField
                    control={form.control}
                    name="currentPassword"
                    render={({ field }) => {
                        return (
                            <FormItem className="w-full">
                                <Label
                                    className="text-foreground text-sm font-medium"
                                    htmlFor="current_password"
                                >
                                    Current Password
                                </Label>
                                <div className="w-full">
                                    <Input
                                        autoComplete="current-password"
                                        hasError={!!form.formState.errors.currentPassword}
                                        id="current_password"
                                        placeholder="Your current password"
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
                {/* Divider */}
                <hr className="bg-surface-200 dark:bg-surface-800 my-6 h-px border-0" />

                {/* !SECTION: Area to Update Password */}
                <div className="flex w-full flex-col gap-2">
                    {/* New Password */}
                    <FormField
                        control={form.control}
                        name="newPassword"
                        render={({ field }) => {
                            return (
                                <FormItem className="w-full">
                                    <Label
                                        className="text-foreground text-sm font-medium"
                                        htmlFor="current_password"
                                    >
                                        New Password
                                    </Label>
                                    <div className="flex w-full flex-row flex-wrap items-stretch justify-start gap-2 lg:flex-nowrap">
                                        <Input
                                            autoComplete="new-password"
                                            hasError={!!form.formState.errors.newPassword}
                                            id="new_password"
                                            placeholder="Your new password"
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
                                                    form.setValue('newPassword', generateStrongPassword());
                                                    form.trigger('newPassword').then((r) => r);

                                                    form.setValue(
                                                        'confirmPassword',
                                                        form.getValues('newPassword'),
                                                    );
                                                    form.trigger('confirmPassword').then((r) => r);
                                                }}
                                            >
                                                Suggest Password
                                            </Button>
                                        </div>
                                    </div>
                                    <FormMessage />
                                    <FormDescription>
                                        Password must be 8 or more characters, and contain at least one
                                        number, one uppercase letter, one lowercase letter, and one special
                                        character.
                                    </FormDescription>
                                </FormItem>
                            );
                        }}
                    />
                    {/* - Password Strength Display: */}
                    {form.watch('newPassword') && (
                        <div className="mb-3 flex w-full flex-col items-center justify-start gap-2">
                            <Label className="flex w-full flex-row items-center justify-start gap-2">
                                <span className="text-muted text-sm">Password Strength:</span>
                                <span className="text-foreground text-sm font-semibold">
                                    {checkPasswordStrength(form.watch('newPassword')).label}
                                </span>
                            </Label>
                            <Progress
                                color={checkPasswordStrength(form.watch('newPassword')).color}
                                value={(checkPasswordStrength(form.watch('newPassword')).value / 4) * 100}
                            />
                        </div>
                    )}

                    {/* Confirm Password */}
                    <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => {
                            return (
                                <FormItem className="w-full">
                                    <Label
                                        className="text-foreground text-sm font-medium"
                                        htmlFor="confirmPassword"
                                    >
                                        Confirm Password
                                    </Label>
                                    <div className="w-full">
                                        <Input
                                            autoComplete="newPassword"
                                            hasError={!!form.formState.errors.confirmPassword}
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

                    {/* Update Password Button */}
                    <div className="mt-2 flex w-full flex-row items-stretch justify-end gap-2 lg:justify-start">
                        {/* Save Button */}
                        {!passwordMutation.isPending && (
                            <Button color="primary" size="md" type="submit" variant="solid">
                                <ArrowsClockwiseIcon
                                    className="size-5"
                                    color="currentColor"
                                    weight="duotone"
                                />
                                <span>Update Password</span>
                            </Button>
                        )}
                        {/* Loading Button */}
                        {passwordMutation.isPending && (
                            <Button disabled color="primary" shape="rounded" size="md" variant="soft">
                                <span>Updating Password</span>
                                <Spinner className="size-5 text-current" />
                            </Button>
                        )}
                    </div>
                </div>
            </form>
        </FormProvider>
    );
}

/**
 * ### Set User Password.
 *
 * This component allows the user to set a password for their account. This is useful for users who have signed up using
 * a social provider, and now want to set a password for their account.
 *
 * @returns {JSX.Element}
 */
function SetUserPasswordForm(): JSX.Element {
    const router = useRouter();

    // Global State:
    const { data: userData } = useUserData();
    const { user } = userData ?? {};

    // * - Change Password Form Schema:
    const zodSchema = SetPasswordSchema;

    const form = useForm<z.infer<typeof zodSchema>>({
        defaultValues: {
            confirmPassword: '',
            password: '',
        },
        mode: 'all',
        resolver: useZodResolver(zodSchema),
    });

    const setPasswordMutation = useMutation({
        mutationFn: async () => {
            // Get the Form Values:
            const { password } = form.getValues();

            // Attempt to Change the Password:
            const response = await setUserPassword(password);

            // Handle the Response:
            if (response?.error || !response) {
                throw standardizeError(response);
            }

            return response;
        },
        onError: (error: ApiError) => {
            if (error.code === 'EMPTY_PASSWORD') {
                return form.setError('password', {
                    message: error.description,
                    type: 'manual',
                });
            } else if (error.code === 'WEAK_PASSWORD') {
                return form.setError('password', {
                    message: error.description,
                    type: 'manual',
                });
            } else if (error.code === 'PASSWORDS_DO_NOT_MATCH') {
                return form.setError('confirmPassword', {
                    message: error.description,
                    type: 'manual',
                });
            }

            // Show an Error Toast:
            return toast.error(error.title ?? error.message ?? 'Unexpected error.', {
                description: error.description ?? 'Oops, please try again later.',
            });
        },
        onSuccess: async (data) => {
            // Show a Success Toast:
            toast.success(data.message ?? 'Your password has been set.', {
                description:
                    data.description ??
                    'To continue using your account, please sign in again with your new password.',
            });

            // Sign out the user after changing the password:
            await signOut();

            // Reset the Form:
            form.reset();

            return router.push('/auth/sign-in');
        },
    });

    const handleSubmit = form.handleSubmit(() => {
        setPasswordMutation.mutate();
    });

    return (
        <FormProvider {...form}>
            <form className="flex w-full flex-col gap-2" onSubmit={handleSubmit}>
                {/* Hidden Form Input with the Email - to help the browser change the current user's password. */}
                <input autoComplete="email" name="email" type="hidden" value={user?.email ?? ''} />
                <input autoComplete="username" name="username" type="hidden" value={user?.email ?? ''} />

                <p className="text-muted text-sm">
                    You have not set a password for your account yet. To set a password, please enter a new
                    password below.
                </p>

                <p className="text-muted text-sm">You will need to sign in again with your new password.</p>

                <hr className="bg-surface-200 dark:bg-surface-800 my-6 h-px border-0" />

                {/* !SECTION: Area to Update Password */}
                <div className="flex w-full flex-col gap-2">
                    {/* New Password */}
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => {
                            return (
                                <FormItem className="w-full">
                                    <Label className="text-foreground text-sm font-medium" htmlFor="password">
                                        New Password
                                    </Label>
                                    <div className="flex w-full flex-row flex-wrap items-stretch justify-start gap-2 lg:flex-nowrap">
                                        <Input
                                            autoComplete="new-password"
                                            hasError={!!form.formState.errors.password}
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
                                                    form.setValue('password', generateStrongPassword());
                                                    form.trigger('password').then((r) => r);
                                                }}
                                            >
                                                Suggest Password
                                            </Button>
                                        </div>
                                    </div>
                                    <FormMessage />
                                    <FormDescription>
                                        Password must be 12 or more characters, and contain at least one
                                        number, one uppercase letter, one lowercase letter, and one special
                                        character.
                                    </FormDescription>
                                </FormItem>
                            );
                        }}
                    />
                    {/* Password Strength Display */}
                    {form.watch('password') && (
                        <div className="mb-3 flex w-full flex-col items-center justify-start gap-2">
                            <Label className="flex w-full flex-row items-center justify-start gap-2">
                                <span className="text-muted text-sm">Password Strength:</span>
                                <span className="text-foreground text-sm font-semibold">
                                    {checkPasswordStrength(form.watch('password')).label}
                                </span>
                            </Label>
                            <Progress
                                color={checkPasswordStrength(form.watch('password')).color}
                                value={(checkPasswordStrength(form.watch('password')).value / 4) * 100}
                            />
                        </div>
                    )}

                    {/* Confirm Password */}
                    <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => {
                            return (
                                <FormItem className="w-full">
                                    <Label
                                        className="text-foreground text-sm font-medium"
                                        htmlFor="confirmPassword"
                                    >
                                        Confirm Password
                                    </Label>
                                    <div className="w-full">
                                        <Input
                                            autoComplete="newPassword"
                                            hasError={!!form.formState.errors.confirmPassword}
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

                    {/* Update Password Button */}
                    <div className="mt-2 flex w-full flex-row items-stretch justify-end gap-2 lg:justify-start">
                        {/* Save Button */}
                        {!setPasswordMutation.isPending && (
                            <Button color="primary" size="md" type="submit" variant="solid">
                                <ArrowsClockwiseIcon
                                    className="size-5"
                                    color="currentColor"
                                    weight="duotone"
                                />
                                <span>Set Password</span>
                            </Button>
                        )}
                        {/* Loading Button */}
                        {setPasswordMutation.isPending && (
                            <Button disabled color="primary" shape="rounded" size="md" variant="soft">
                                <span>Setting Password</span>
                                <Spinner className="size-5 text-current" />
                            </Button>
                        )}
                    </div>
                </div>
            </form>
        </FormProvider>
    );
}
