/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { useZodResolver } from '@/src/hooks/use-zod-resolver';
import { PasswordIcon, ShieldChevronIcon, SignOutIcon } from '@phosphor-icons/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next-nprogress-bar';
import { useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { titleCase } from 'title-case';
import { z } from 'zod';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError, standardizeError } from '@/errors/api-errors';
import { cn } from '@/library/utils';
import { createAndVerifyMfaChallenge, listMfaFactors } from '@/src/actions/auth/multi-factor-authentication';
import { signOut } from '@/src/actions/auth/sign-out';
import { useGlobalStore } from '@/src/components/providers/global-store-provider';
import { Button } from '@components/ui/button';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';
import type { Factor } from '@supabase/supabase-js';

export function MFaChallengeForm({ callbackPathname: _ = '/app/dashboard' }: { callbackPathname?: string }) {
    const router = useRouter();
    const showConfetti = useGlobalStore((store) => store.showConfetti);

    // Local State:
    const [isSigningOut, setSigningOut] = useState<boolean>(false);
    const [selectedFactor, setSelectedFactor] = useState<Factor | null>(null);

    const {
        data: factors,
        error,
        isError,
        isLoading,
        refetch,
    } = useQuery<
        ApiResponseOrError<{ factors: Factor[] }>,
        ApiResponseOrError<{ factors: Factor[] }>,
        Factor[]
    >({
        queryFn: async () => {
            const response = await listMfaFactors();

            if (response?.error || !response) {
                throw response;
            }

            return response;
        },
        queryKey: ['mfa-factors'],
        select: (data) => data.data?.factors ?? [],
    });

    const enrolledFactors = useMemo(
        () =>
            ((factors?.length ?? 0) > 0 ? factors?.filter((factor) => factor.status === 'verified') : []) ??
            [],
        [factors],
    );

    useEffect(() => {
        if (enrolledFactors.length > 0 && !selectedFactor) {
            setSelectedFactor(enrolledFactors[0]);
        }
    }, [factors, enrolledFactors, selectedFactor]);

    // Handle the sign-out action:
    const handleSignOut = async () => {
        try {
            setSigningOut(true);
            await signOut();
            router.push('/auth/sign-in', { scroll: false });
        } catch (caughtError) {
            console.error('Failed to sign out:', caughtError);
            toast.error('Failed to sign out.', {
                description: 'An unexpected error occurred while signing out, try clearing your cookies.',
            });
        } finally {
            setSigningOut(false);
        }
    };

    // Code schema for verification of the TOTP:
    const TOTPSchema = z.object({
        pin: z
            .string()
            .min(6, 'TOTP must be at least 6 characters.')
            .max(6, 'TOTP must be at most 6 characters.'),
    });

    const resolver = useZodResolver(TOTPSchema);

    // Form for the verification code:
    const TOTPForm = useForm<z.infer<typeof TOTPSchema>>({
        mode: 'onSubmit',
        resolver,
    });

    // Get the challenge data:
    const { isPending: isVerifying, mutateAsync: mutateVerification } = useMutation({
        mutationFn: async ({ factorId, pin }: { factorId: string; pin: string }) => {
            if (!factorId) {
                await refetch();

                throw new ApiError('Failed to verify TOTP! Factor ID is missing.', {
                    code: 'MFA_INVALID_FACTOR_ID',
                    description: 'The factor ID is missing, please refresh the page and try again.',
                });
            }

            const response = await createAndVerifyMfaChallenge(factorId, pin);
            if (response?.error || !response) {
                throw standardizeError(response);
            }
            return response;
        },
        onError: (caughtError: (Error & Partial<ApiErrorType>) | ApiErrorType) => {
            console.error('Failed to verify TOTP:', caughtError);

            if (caughtError.code === 'MFA_INVALID_CODE') {
                return TOTPForm.setError('pin', {
                    message: 'Invalid code, please try again.',
                    type: 'manual',
                });
            }

            return toast.error(caughtError.message, {
                description: caughtError.description,
                id: 'mfa-verification-failed',
            });
        },
        onMutate: () => {
            TOTPForm.clearErrors('pin');
            toast.dismiss('mfa-verification-failed');
        },
        onSuccess: () => {
            showConfetti();
            router.refresh();
        },
    });

    const handleVerification = async ({ pin }: { pin: string }) => {
        return mutateVerification({
            factorId: selectedFactor?.id ?? '',
            pin,
        });
    };

    if (isLoading) {
        return (
            <div className="flex w-full flex-col items-center justify-center gap-2">
                <div className="flex w-full flex-col items-center justify-center gap-5">
                    <div className="mb-5 flex flex-col items-center justify-center gap-3">
                        <Skeleton className="mb-3 flex size-16 items-center justify-center rounded-full" />
                        <div className="flex w-full flex-col gap-6">
                            <Skeleton className="h-5 w-96 max-w-full" />
                            <div className="flex w-full flex-col items-center justify-center gap-3">
                                <Skeleton className="h-4 w-5/6 max-w-full" />
                                <Skeleton className="h-4 w-5/6 max-w-full" />
                                <Skeleton className="h-4 w-5/6 max-w-full" />
                            </div>
                            <div className="my-4 flex h-auto max-h-full w-full flex-row gap-4">
                                {/* Simulation of 6 slots OTP input as Skeletons: */}
                                <Skeleton className="aspect-square h-auto w-full flex-1" />
                                <Skeleton className="aspect-square h-auto w-full flex-1" />
                                <Skeleton className="aspect-square h-auto w-full flex-1" />
                                <Skeleton className="aspect-square h-auto w-full flex-1" />
                                <Skeleton className="aspect-square h-auto w-full flex-1" />
                                <Skeleton className="aspect-square h-auto w-full flex-1" />
                            </div>
                            <div className="flex w-full flex-row gap-4">
                                <Skeleton className="h-12 w-full flex-1" />
                                <Skeleton className="h-12 w-full flex-1" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (isError) {
        toast.error('Failed to fetch MFA factors.', {
            description: 'An unexpected error occurred while fetching MFA factors.',
        });

        return (
            <div className="flex w-full flex-col items-center justify-center gap-2">
                <div className="flex w-full flex-col items-center justify-center gap-5">
                    <div className="mb-5 flex flex-col items-center justify-center gap-3">
                        <div className="bg-primary-100 dark:bg-primary-900 mb-3 flex size-16 items-center justify-center rounded-full">
                            <ShieldChevronIcon
                                className="text-primary-500 dark:text-primary-400 size-8"
                                weight="duotone"
                            />
                        </div>
                        <h1 className="text-surface-900 text-center text-3xl leading-tight font-bold tracking-tight md:text-4xl dark:text-white">
                            {titleCase(error.title ?? error.message ?? 'Failed to fetch MFA factors')}
                        </h1>
                        <p className="text-surface-600 dark:text-surface-400 text-center font-medium">
                            {error.description ?? 'An unexpected error occurred while fetching MFA factors.'}
                        </p>

                        <div className="flex w-full flex-col gap-4">
                            <Button
                                className="w-full flex-1"
                                color="default"
                                shape="rounded"
                                size="lg"
                                type="button"
                                variant="soft"
                                onClick={() => refetch()}
                            >
                                <span>Retry</span>
                            </Button>
                            <Button
                                className="w-full flex-1"
                                color="default"
                                shape="rounded"
                                size="lg"
                                type="button"
                                variant="soft"
                                onClick={handleSignOut}
                            >
                                <span>Sign out</span>
                            </Button>
                        </div>
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
                        <ShieldChevronIcon
                            className="text-primary-500 dark:text-primary-400 size-8"
                            weight="duotone"
                        />
                    </div>
                    <h1 className="text-surface-900 text-center text-3xl leading-tight font-bold tracking-tight md:text-4xl dark:text-white">
                        Two-factor Authentication
                    </h1>
                    <p className="text-surface-600 dark:text-surface-400 text-center font-medium">
                        To enhance the security of your account, we require two-factor authentication. Please
                        open your authenticator app and enter the 6-digit verification code displayed. This
                        extra step confirms your identity and secures your access.
                    </p>

                    {isLoading && (
                        <div className="flex w-full flex-col gap-4">
                            <Skeleton className="h-4 w-48" />
                            <div className="flex w-full flex-row items-center justify-between gap-4">
                                <Skeleton className="aspect-square h-auto w-full" />
                                <Skeleton className="aspect-square h-auto w-full" />
                                <Skeleton className="aspect-square h-auto w-full" />
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="aspect-square h-auto w-full" />
                                <Skeleton className="aspect-square h-auto w-full" />
                                <Skeleton className="aspect-square h-auto w-full" />
                            </div>
                        </div>
                    )}

                    {!isLoading && (
                        <div className="flex w-full flex-col gap-4">
                            <FormProvider {...TOTPForm}>
                                <form
                                    className={cn('grid items-center gap-4')}
                                    onSubmit={TOTPForm.handleSubmit(handleVerification)}
                                >
                                    <FormField
                                        control={TOTPForm.control}
                                        name="pin"
                                        render={({ field }) => {
                                            const slotClassName = cn(
                                                'first:rounded-l-3xl first:border-l last:rounded-r-3xl',
                                            );

                                            return (
                                                <FormItem className="py-8">
                                                    <FormLabel className="mb-2" htmlFor="pin">
                                                        Code generated by{' '}
                                                        {selectedFactor?.friendly_name ??
                                                            'your authenticator app'}
                                                    </FormLabel>
                                                    <FormControl>
                                                        <InputOTP
                                                            autoFocus
                                                            maxLength={6}
                                                            onComplete={() => {
                                                                TOTPForm.handleSubmit(handleVerification)();
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    TOTPForm.handleSubmit(
                                                                        handleVerification,
                                                                    )();
                                                                }
                                                            }}
                                                            {...field}
                                                        >
                                                            <InputOTPGroup>
                                                                <InputOTPSlot
                                                                    className={slotClassName}
                                                                    index={0}
                                                                />
                                                                <InputOTPSlot
                                                                    className={slotClassName}
                                                                    index={1}
                                                                />
                                                                <InputOTPSlot
                                                                    className={slotClassName}
                                                                    index={2}
                                                                />
                                                            </InputOTPGroup>
                                                            <InputOTPSeparator />
                                                            <InputOTPGroup>
                                                                <InputOTPSlot
                                                                    className={slotClassName}
                                                                    index={3}
                                                                />
                                                                <InputOTPSlot
                                                                    className={slotClassName}
                                                                    index={4}
                                                                />
                                                                <InputOTPSlot
                                                                    className={slotClassName}
                                                                    index={5}
                                                                />
                                                            </InputOTPGroup>
                                                        </InputOTP>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            );
                                        }}
                                    />
                                    <div className="flex w-full flex-row gap-4">
                                        {isSigningOut && (
                                            <Button
                                                disabled
                                                className="w-full flex-1"
                                                color="default"
                                                loading={isSigningOut}
                                                shape="rounded"
                                                size="lg"
                                                variant="soft"
                                            >
                                                <span>Signing out</span>
                                            </Button>
                                        )}
                                        {!isSigningOut && (
                                            <Button
                                                className="w-full flex-1"
                                                color="default"
                                                shape="rounded"
                                                size="lg"
                                                type="button"
                                                variant="soft"
                                                onClick={handleSignOut}
                                            >
                                                <SignOutIcon
                                                    aria-hidden="true"
                                                    className="size-5"
                                                    color="currentColor"
                                                    weight="duotone"
                                                />
                                                Sign out
                                            </Button>
                                        )}
                                        {!isVerifying && (
                                            <Button
                                                className="w-full flex-1"
                                                color="default"
                                                shape="rounded"
                                                size="lg"
                                                type="submit"
                                                variant="solid"
                                            >
                                                <PasswordIcon
                                                    aria-hidden="true"
                                                    className="size-5"
                                                    color="currentColor"
                                                    weight="duotone"
                                                />
                                                Verify Code
                                            </Button>
                                        )}
                                        {isVerifying && (
                                            <Button
                                                disabled
                                                className="w-full flex-1"
                                                color="primary"
                                                loading={true}
                                                shape="rounded"
                                                size="lg"
                                                variant="soft"
                                            >
                                                <span>Verifying</span>
                                            </Button>
                                        )}
                                    </div>
                                </form>
                            </FormProvider>
                        </div>
                    )}
                </div>

                <div className="text-muted w-full text-start text-sm font-medium">
                    Unable to sign in?
                    <ul
                        className="text-surface-500 marker:text-foreground list-disc space-y-1 px-4 py-2 text-start text-sm marker:font-bold"
                        role="list"
                    >
                        {!isLoading &&
                            enrolledFactors.length > 1 &&
                            enrolledFactors.map(
                                (factor) =>
                                    factor.id !== selectedFactor?.id && (
                                        <li
                                            key={factor.id}
                                            className="text-foreground text-sm font-medium hover:cursor-pointer hover:underline"
                                        >
                                            <span
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setSelectedFactor(factor);
                                                }}
                                            >
                                                Authenticate using <b>{factor.friendly_name}</b>?
                                            </span>
                                        </li>
                                    ),
                            )}

                        <li className="text-foreground text-sm font-medium hover:underline">
                            {' '}
                            <a
                                href="mailto:sample@example.com?subject=Need help with MFA&body=Hi Verto Team,%0D%0A%0D%0AI need help with my MFA setup. Could you please assist me?%0D%0A%0D%0ARegards,%0D%0A%0D%0A"
                                rel="noreferrer"
                                target="_blank"
                            >
                                Reach out to us via support.
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
