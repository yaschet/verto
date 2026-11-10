/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { useZodResolver } from '@/src/hooks/use-zod-resolver';
import {
    CheckIcon,
    ClipboardIcon,
    ClipboardTextIcon,
    ImageBrokenIcon,
    QrCodeIcon,
    ScanIcon,
    XIcon,
} from '@phosphor-icons/react';
import { useMutation } from '@tanstack/react-query';
import Image from 'next/image';
import { Fragment, type ReactNode, useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { titleCase } from 'title-case';
import { z } from 'zod';
import {
    EnrollMFAFormLayout,
    EnrollMFAModalLayout,
} from '@/app/(protected)/account/components/core/enroll-mfa-modal-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AnimatedDisclosure from '@/components/ui/disclosure';
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import { cn } from '@/library/utils';
import {
    createAndVerifyMfaChallenge,
    deleteUnverifiedMfaFactor,
    enrollMfaFactor,
} from '@/src/actions/auth/multi-factor-authentication';
import { useGlobalStore } from '@/src/components/providers/global-store-provider';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';
import type { AuthMFAEnrollResponse } from '@supabase/supabase-js';

// Friendly name schema for the authenticator app friendly identifier:
const friendlyNameSchema = z.object({
    friendlyName: z
        .string()
        .min(1, 'The friendly name is required.')
        .min(3, 'The friendly name must be at least 3 characters.')
        .max(64, 'The friendly name must be less than 64 characters.'),
});

// Code schema for verification of the TOTP:
const totpSchema = z.object({
    pin: z
        .string({ message: 'The verification code must be a 6-digit number.' })
        .min(1, 'The verification code must be at least 6 digits.')
        .max(6, 'The verification code must be at most 6 digits.')
        .regex(/^[0-9]{6}$/, 'The verification code must be a 6-digit number.'),
});

export function EnrollMFAModal({
    modalTriggerButton,
    onEnrolled = () => {
        return;
    },
}: {
    modalTriggerButton: ReactNode;
    onEnrolled?: () => void;
}) {
    // * - Local state:
    // Modal state:
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    // Holds the factor ID:
    const [factorId, setFactorId] = useState<string | null>(null);
    // Holds the QR code image SVG, secret, and URI:
    const [totp, setTotp] = useState<{
        qr_code: string;
        secret: string;
        uri: string;
    } | null>(null);
    // Holds the tab index:
    const [tabIndex, setTabIndex] = useState<number>(0);

    // Form for the friendly name:
    const friendlyNameForm = useForm<z.infer<typeof friendlyNameSchema>>({
        defaultValues: {
            friendlyName: `App ${Math.floor(1000 + Math.random() * 9000)}`,
        },
        mode: 'onSubmit',
        resolver: useZodResolver(friendlyNameSchema),
    });

    // Form for the verification code:
    const otpForm = useForm<z.infer<typeof totpSchema>>({
        mode: 'onSubmit',
        resolver: useZodResolver(totpSchema),
    });

    const handleCancel = async () => {
        // Clean up unverified factor if one was created
        if (factorId && tabIndex === 1) {
            // User is on verification tab but canceling - factor exists but is unverified
            await deleteUnverifiedMfaFactor(factorId);
        }

        friendlyNameForm.reset();
        otpForm.reset();
        setFactorId(null);
        setTotp(null);
        setIsModalOpen(false);
        setTabIndex(0);
    };

    const { isPending: isEnrolling, mutateAsync: mutateEnrollment } = useMutation<
        ApiResponseOrError<AuthMFAEnrollResponse['data']>,
        ApiErrorType,
        { friendlyName: string }
    >({
        mutationFn: async (data: { friendlyName: string }) => {
            const response = await enrollMfaFactor(data.friendlyName);

            if (response?.error || !response) {
                throw response;
            }

            return response;
        },
        onError: (error: ApiResponseOrError) => {
            console.error('Failed to generate QR code:', error);
            return toast.error(error.message, { description: error.description });
        },
        onSuccess: (data: ApiResponseOrError<AuthMFAEnrollResponse['data']>) => {
            if (data.data) {
                if (data.data.type === 'totp') {
                    setFactorId(data.data.id);
                    setTotp(data.data.totp);
                    return setTabIndex(1);
                } else {
                    return toast.error('Failed to generate QR code.', {
                        description:
                            'The server returned an unexpected response, the QR code could not be generated.',
                    });
                }
            }

            return toast.error('Failed to generate QR code.', {
                description:
                    'The server returned an unexpected response, the QR code could not be generated.',
            });
        },
    });

    const showConfetti = useGlobalStore((store) => store.showConfetti);

    const {
        isPending: isVerifying,
        isSuccess: isVerificationSuccessful,
        mutateAsync: mutateVerification,
    } = useMutation({
        mutationFn: async (data: { factorId: string; pin: string }) => {
            const response = await createAndVerifyMfaChallenge(data.factorId, data.pin);
            if (response?.error || !response) {
                throw response;
            }
            return response;
        },
        onError: (error: ApiResponseOrError) => {
            console.error('Failed to verify TOTP:', error);

            if (error.code === 'MFA_INVALID_CODE') {
                return otpForm.setError('pin', {
                    message: 'Invalid code, please try again.',
                    type: 'manual',
                });
            }

            return toast.error(error.message, { description: error.description });
        },
        onSettled: (data) => {
            if (data?.data?.expires_in) {
                setTimeout(() => {
                    // Close the modal:
                    setIsModalOpen(false);

                    // Reset the tab index to the first tab:
                    setTabIndex(0);

                    // Reset the form values:
                    friendlyNameForm.reset();
                    otpForm.reset();

                    // Parent callback:
                    onEnrolled();
                }, 2000);
            }
        },
        onSuccess: () => {
            // * - Show a success toast (optional since we have a confetti explosion):
            showConfetti();
            return toast.success('Successfully verified TOTP.', {
                description: `You can now use ${friendlyNameForm.getValues().friendlyName ?? 'this app'} as a factor to sign in.`,
            });
        },
    });

    const handleEnrollment = async ({ friendlyName }: { friendlyName: string }) => {
        await mutateEnrollment({ friendlyName });
    };

    const handleVerification = async ({ pin }: { pin: string }) => {
        await mutateVerification({
            factorId: factorId ?? '',
            pin,
        });
    };

    return (
        <EnrollMFAModalLayout
            isModalOpen={isModalOpen}
            modalTriggerButton={modalTriggerButton}
            setIsModalOpen={setIsModalOpen}
        >
            {tabIndex === 0 && (
                <EnrollMFATab
                    friendlyNameForm={friendlyNameForm}
                    handleCancel={handleCancel}
                    handleEnrollment={handleEnrollment}
                    isEnrolling={isEnrolling}
                />
            )}
            {tabIndex === 1 && (
                <VerifyMFATab
                    handleCancel={handleCancel}
                    handleVerification={handleVerification}
                    isVerificationSuccessful={isVerificationSuccessful}
                    isVerifying={isVerifying}
                    otpForm={otpForm}
                    totp={totp}
                />
            )}
        </EnrollMFAModalLayout>
    );
}

function EnrollMFATab({
    friendlyNameForm,
    handleCancel,
    handleEnrollment,
    isEnrolling,
}: {
    friendlyNameForm: ReturnType<typeof useForm<z.infer<typeof friendlyNameSchema>>>;
    handleEnrollment: ({ friendlyName }: { friendlyName: string }) => void;
    handleCancel: () => Promise<void>;
    isEnrolling: boolean;
}) {
    return (
        <EnrollMFAFormLayout
            description="You will need a name to identify the app in the future."
            title={titleCase('Add a new authenticator app as a factor')}
        >
            <div className="flex w-full flex-col gap-4">
                <FormProvider {...friendlyNameForm}>
                    <form
                        className={cn('grid items-start gap-4')}
                        onSubmit={friendlyNameForm.handleSubmit(handleEnrollment)}
                    >
                        <FormField
                            control={friendlyNameForm.control}
                            name="friendlyName"
                            render={({ field }) => {
                                return (
                                    <FormItem>
                                        <Label htmlFor="password">Provide a name to identify this app</Label>
                                        <Input
                                            autoFocus={friendlyNameForm.formState.isDirty}
                                            hasError={!!friendlyNameForm.formState.errors.friendlyName}
                                            id="friendlyName"
                                            placeholder="Enter a name"
                                            type="text"
                                            {...field}
                                        />
                                        <FormDescription>
                                            A string will be randomly generated if a name is not provided.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                );
                            }}
                        />
                        <div className="flex w-full flex-row gap-4">
                            {!isEnrolling && (
                                <Fragment>
                                    <Button
                                        className="w-full flex-1"
                                        color="secondary"
                                        type="button"
                                        variant="soft"
                                        onClick={handleCancel}
                                    >
                                        <XIcon aria-hidden="true" className="size-5" color="currentColor" />
                                        Cancel
                                    </Button>
                                    <Button
                                        className="w-full flex-1"
                                        color="primary"
                                        type="submit"
                                        variant="solid"
                                    >
                                        <QrCodeIcon
                                            aria-hidden="true"
                                            className="size-5"
                                            color="currentColor"
                                            weight="duotone"
                                        />
                                        Generate QR
                                    </Button>
                                </Fragment>
                            )}

                            {isEnrolling && (
                                <Button
                                    disabled
                                    className="w-full flex-1"
                                    color="primary"
                                    loading={true}
                                    shape="rounded"
                                    size="md"
                                    variant="soft"
                                >
                                    <span>Generating QR</span>
                                </Button>
                            )}
                        </div>
                    </form>
                </FormProvider>
            </div>
        </EnrollMFAFormLayout>
    );
}

function VerifyMFATab({
    handleCancel,
    handleVerification,
    isVerifying,
    otpForm,
    totp,
}: {
    otpForm: ReturnType<typeof useForm<z.infer<typeof totpSchema>>>;
    handleVerification: ({ pin }: { pin: string }) => void;
    handleCancel: () => Promise<void>;
    isVerifying: boolean;
    isVerificationSuccessful: boolean;
    totp: {
        qr_code: string;
        secret: string;
        uri: string;
    } | null;
}) {
    const [isSecretCopied, setSecretCopied] = useState<boolean>(false);

    useEffect(() => {
        if (isSecretCopied) {
            const timeout = setTimeout(() => {
                setSecretCopied(false);
            }, 3000);

            return () => clearTimeout(timeout);
        }
    }, [isSecretCopied]);

    return (
        <EnrollMFAFormLayout
            description="Use an authenticator app to scan the following QR code, and provide the code from the app to complete the enrolment."
            title={titleCase('ScanIcon the QR code')}
        >
            <div className="flex w-full flex-col items-center justify-start gap-4">
                <div className="flex w-full max-w-48 flex-col gap-2">
                    {totp?.qr_code ? (
                        <div className="dark:white border-border text-muted relative flex aspect-square h-auto w-full flex-col items-center justify-center gap-2 rounded-xl border bg-white">
                            <Image fill alt="QR code" className="rounded-md" src={totp?.qr_code} />
                        </div>
                    ) : (
                        <div className="border-border bg-surface-50 text-muted dark:bg-surface-900 flex aspect-square h-auto w-full flex-col items-center justify-center gap-3 rounded-xl border">
                            <ScanIcon
                                className="size-12 animate-pulse"
                                color="currentColor"
                                weight="duotone"
                            />
                        </div>
                    )}
                </div>
                <div className="flex w-full flex-col items-start justify-start">
                    <AnimatedDisclosure
                        title={
                            <Fragment>
                                <ImageBrokenIcon className="size-5" color="currentColor" weight="duotone" />
                                <Label htmlFor="secret">Can't scan the QR code?</Label>
                            </Fragment>
                        }
                    >
                        <p className="text-muted text-sm font-medium">
                            You can also enter this secret key into your authenticator app:
                        </p>
                        <button
                            type="button"
                            className="w-full text-left"
                            onClick={async () => {
                                await navigator.clipboard.writeText(
                                    totp?.secret ?? 'Invalid secret, please try again.',
                                );
                                setSecretCopied(true);
                            }}
                        >
                            <div className="relative w-full">
                                <Input
                                    readOnly
                                    className="text-muted dark:bg-surface-950 w-full rounded-sm bg-white"
                                    id="secret"
                                    type="text"
                                    value={totp?.secret ?? 'Invalid secret, please try again.'}
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-4 pl-2">
                                    <Badge
                                        className="w-fit cursor-pointer rounded-[0.1875rem]"
                                        color="secondary"
                                        size="sm"
                                        variant="soft"
                                    >
                                        <div className="text-foreground-muted [&_svg]:size-[14px]">
                                            {isSecretCopied ? (
                                                <ClipboardTextIcon
                                                    className="size-3"
                                                    color="currentColor"
                                                    weight="duotone"
                                                />
                                            ) : (
                                                <ClipboardIcon
                                                    className="size-3"
                                                    color="currentColor"
                                                    weight="duotone"
                                                />
                                            )}
                                        </div>
                                        <span className="truncate">
                                            {isSecretCopied ? 'Copied!' : 'Copy'}
                                        </span>
                                    </Badge>
                                </div>
                            </div>
                        </button>
                    </AnimatedDisclosure>
                </div>
                <div className="flex w-full flex-col gap-4">
                    <FormProvider {...otpForm}>
                        <form
                            className={cn('grid items-start gap-4')}
                            onSubmit={otpForm.handleSubmit(handleVerification)}
                        >
                            <FormField
                                control={otpForm.control}
                                name="pin"
                                render={({ field }) => {
                                    const slotClassName = cn('');
                                    return (
                                        <FormItem>
                                            <FormLabel>Enter the code from the Authenticator app</FormLabel>
                                            <FormControl>
                                                <InputOTP
                                                    className="flex w-full flex-row items-center justify-center"
                                                    maxLength={6}
                                                    onComplete={(value) => {
                                                        otpForm.setValue('pin', value);
                                                        otpForm.handleSubmit(handleVerification)();
                                                    }}
                                                    onKeyUp={(e) => {
                                                        if (e.key === 'Enter') {
                                                            otpForm.handleSubmit(handleVerification)();
                                                        }
                                                    }}
                                                    {...field}
                                                >
                                                    <InputOTPGroup>
                                                        <InputOTPSlot className={slotClassName} index={0} />
                                                        <InputOTPSlot className={slotClassName} index={1} />
                                                        <InputOTPSlot className={slotClassName} index={2} />
                                                    </InputOTPGroup>
                                                    <InputOTPSeparator />
                                                    <InputOTPGroup>
                                                        <InputOTPSlot className={slotClassName} index={3} />
                                                        <InputOTPSlot className={slotClassName} index={4} />
                                                        <InputOTPSlot className={slotClassName} index={5} />
                                                    </InputOTPGroup>
                                                </InputOTP>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    );
                                }}
                            />
                            <div className="flex w-full flex-row items-center justify-center gap-4">
                                {!isVerifying && (
                                    <Fragment>
                                        <Button
                                            className="w-full flex-1"
                                            color="secondary"
                                            type="button"
                                            variant="soft"
                                            onClick={handleCancel}
                                        >
                                            <XIcon
                                                aria-hidden="true"
                                                className="size-5"
                                                color="currentColor"
                                            />
                                            Cancel
                                        </Button>
                                        <Button
                                            className="w-full flex-1"
                                            color="primary"
                                            type="submit"
                                            variant="solid"
                                        >
                                            <CheckIcon
                                                aria-hidden="true"
                                                className="size-5"
                                                color="currentColor"
                                                weight="duotone"
                                            />
                                            Verify Code
                                        </Button>
                                    </Fragment>
                                )}

                                {isVerifying && (
                                    <Button
                                        disabled
                                        className="w-full flex-1"
                                        color="primary"
                                        loading={true}
                                        shape="rounded"
                                        size="md"
                                        variant="soft"
                                    >
                                        <span>Verifying...</span>
                                    </Button>
                                )}
                            </div>
                        </form>
                    </FormProvider>
                </div>
            </div>
        </EnrollMFAFormLayout>
    );
}
