/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

// ! Form Components - Personal Information, Contact Information, Professional Information, Account Security.
import { useZodResolver } from '@/src/hooks/use-zod-resolver';
import { ArrowLeftIcon, FingerprintIcon, KeyIcon, SignInIcon } from '@phosphor-icons/react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@components/ui/button';
import { Checkbox } from '@components/ui/checkbox';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@components/ui/form';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Progress } from '@components/ui/progress';
import { checkPasswordStrength, cn, generateStrongPassword } from '@library/utils';
import type { RegistrationDataType } from '@/types/auth/registration';

// * Declare Schema for Personal Information Form Object:
const accountSecuritySchema = z
    .object({
        commercialEmails: z.boolean(),
        password: z
            .string()
            .min(1, 'Password is required.')
            .refine(
                (data) =>
                    checkPasswordStrength(data).label === 'Strong' ||
                    checkPasswordStrength(data).label === 'Medium',
                {
                    message: 'Password is not strong enough.',
                },
            ),
        passwordConfirmation: z.string(),
        terms: z.boolean().refine((val) => val, {
            message: 'Please read and accept the terms and conditions',
        }),
    })
    .refine((data) => data.password === data.passwordConfirmation, {
        message: 'Passwords do not match.',
        path: ['passwordConfirmation'],
    })
    .refine((data) => data.terms, {
        message: 'Please read and accept the terms and conditions',
        path: ['terms'],
    });

// * Personal Information:
export default function AccountSecurity({
    accountSecurity,
    backward,
    isLoading,
    submitAccountSecurity,
}: {
    accountSecurity: RegistrationDataType['accountSecurity'];
    submitAccountSecurity: (values: RegistrationDataType['accountSecurity']) => void;
    isLoading: boolean;
    backward: () => void;
}) {
    // * 1. Declare Form Object:
    const form = useForm<z.infer<typeof accountSecuritySchema>>({
        defaultValues: {
            commercialEmails: accountSecurity.commercialEmails,
            password: accountSecurity.password,
            passwordConfirmation: accountSecurity.passwordConfirmation,
            terms: accountSecurity.terms,
        },
        resolver: useZodResolver(accountSecuritySchema),
    });

    // ! 2. Define submit handler.
    const onSubmit = async (values: z.infer<typeof accountSecuritySchema>) => {
        // * PaperPlaneTilt Information to Parent Component:

        // ! DEBUGGING AREA:
        // Show the values of the form, in console or in a toast popup.

        // ! Send Personal Information to Parent Component.
        return submitAccountSecurity({
            commercialEmails: values.commercialEmails,
            password: values.password,
            passwordConfirmation: values.passwordConfirmation,
            terms: values.terms,
        });
    };

    return (
        <div className="flex w-full flex-col items-center justify-center gap-5">
            <div className="mb-5 flex flex-col items-center justify-center gap-3" data-testid="welcome-text">
                <div className="bg-primary-100 dark:bg-primary-900 mb-3 flex size-16 items-center justify-center rounded-full">
                    <FingerprintIcon
                        className="text-primary-500 dark:text-primary-400 size-8"
                        weight="duotone"
                    />
                </div>
                <h1 className="text-surface-900 text-center text-3xl leading-tight font-bold tracking-tight md:text-4xl dark:text-white">
                    Account Security
                </h1>
                <p className="text-surface-600 dark:text-surface-400 text-center font-medium">
                    Secure Your Account with a Strong Password.
                </p>
            </div>
            <Form {...form}>
                <form
                    className="mb-5 flex w-full flex-col items-center justify-center gap-10"
                    onSubmit={form.handleSubmit(onSubmit)}
                >
                    <div className="grid w-full grid-flow-row grid-cols-1 gap-3 md:grid-cols-1">
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <div className="flex w-full flex-row flex-wrap items-stretch justify-start gap-2 lg:flex-nowrap">
                                            <Input
                                                autoComplete="new-password"
                                                hasError={!!form.formState.errors.password?.message}
                                                id="password"
                                                placeholder="Password"
                                                shape="rounded"
                                                size="md"
                                                type="password"
                                                {...field}
                                            />
                                            <div className="flex w-full flex-row items-stretch justify-end gap-2 lg:w-fit lg:justify-start">
                                                <Button
                                                    color="secondary"
                                                    shape="rounded"
                                                    size="md"
                                                    type="button"
                                                    variant="soft"
                                                    onClick={() => {
                                                        form.setValue('password', generateStrongPassword());
                                                        form.trigger('password').then((r) => r);

                                                        form.setValue(
                                                            'passwordConfirmation',
                                                            form.getValues('password'),
                                                        );
                                                        form.trigger('passwordConfirmation').then((r) => r);
                                                    }}
                                                >
                                                    <KeyIcon
                                                        className="size-5"
                                                        color="currentColor"
                                                        weight="duotone"
                                                    />
                                                    Suggest
                                                </Button>
                                            </div>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                    <FormDescription className="py-2">
                                        Password must be 12 or more characters, and contain at least one
                                        number, one uppercase letter, one lowercase letter, and one special
                                        character.
                                    </FormDescription>
                                </FormItem>
                            )}
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
                        <FormField
                            control={form.control}
                            name="passwordConfirmation"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm Password</FormLabel>
                                    <FormControl>
                                        <Input
                                            autoComplete="new-password"
                                            hasError={!!form.formState.errors.passwordConfirmation?.message}
                                            placeholder="Confirm Password"
                                            shape="rounded"
                                            size="md"
                                            type="password"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid w-full grid-flow-row grid-cols-1 gap-6 md:grid-cols-1">
                        <FormField
                            control={form.control}
                            name="terms"
                            render={({ field }) => (
                                <FormItem className="flex flex-col items-start justify-start space-y-3">
                                    <div className="flex flex-row items-center justify-start space-y-0 space-x-1">
                                        <FormControl>
                                            <Checkbox
                                                color="default"
                                                id="terms"
                                                isSelected={field.value}
                                                onValueChange={field.onChange}
                                            />
                                        </FormControl>
                                        <Label
                                            className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            htmlFor="terms"
                                        >
                                            I agree to Verto's{' '}
                                            <Link
                                                href="/legal/terms-of-service"
                                                rel="noopener noreferrer"
                                                target="_blank"
                                            >
                                                <span className="text-primary-600 hover:underline">
                                                    Terms of Service
                                                </span>
                                            </Link>{' '}
                                            and{' '}
                                            <Link
                                                href="/legal/privacy-policy"
                                                rel="noopener noreferrer"
                                                target="_blank"
                                            >
                                                <span className="text-primary-600 hover:underline">
                                                    Privacy Policy
                                                </span>
                                            </Link>
                                            .
                                        </Label>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="commercialEmails"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex flex-row items-center justify-start space-y-0 space-x-1">
                                        <FormControl>
                                            <Checkbox
                                                color="default"
                                                id="commercialEmails"
                                                isSelected={field.value}
                                                onValueChange={field.onChange}
                                            />
                                        </FormControl>
                                        <Label
                                            className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            htmlFor="commercialEmails"
                                        >
                                            Send me occasional emails about new features, promotions, offers,
                                            and other news.
                                        </Label>
                                    </div>
                                    <FormMessage />
                                    <FormDescription>
                                        You can unsubscribe at any time. We will not share your email address
                                        with anyone.
                                    </FormDescription>
                                </FormItem>
                            )}
                        />
                    </div>
                    {isLoading ? (
                        <Button
                            className="w-full"
                            color="primary"
                            disabled={true}
                            loading={true}
                            type="button"
                            variant="soft"
                        >
                            Loading
                        </Button>
                    ) : (
                        <div
                            className={cn(
                                'flex w-full flex-col-reverse items-center justify-center gap-5',
                                'sm:flex-row sm:items-center sm:justify-between',
                            )}
                        >
                            <Button
                                className="w-full"
                                color="primary"
                                shape="rounded"
                                size="lg"
                                type="button"
                                variant="soft"
                                onClick={() => {
                                    backward();
                                }}
                            >
                                <ArrowLeftIcon className="size-5" color="currentColor" weight="duotone" />
                                Back
                            </Button>
                            <Button
                                className="w-full"
                                color="primary"
                                shape="rounded"
                                size="lg"
                                type="submit"
                                variant="solid"
                            >
                                Create Account
                                <SignInIcon className="size-5" color="currentColor" weight="duotone" />
                            </Button>
                        </div>
                    )}
                </form>
            </Form>
        </div>
    );
}
