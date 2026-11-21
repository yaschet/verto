/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { useZodResolver } from '@/src/hooks/use-zod-resolver';
import {
    ArrowSquareOutIcon,
    CoinsIcon,
    CreditCardIcon,
    InvoiceIcon,
    WarningIcon,
} from '@phosphor-icons/react';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next-nprogress-bar';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { titleCase } from 'title-case';
import {
    VTC_MAXIMUM_AMOUNT,
    VTC_MINIMUM_AMOUNT,
    VTC_PRESET_PACKS,
    VTC_UNIT_PRICE,
    calculateDiscount,
    calculateTotalPrice,
    formatPrice,
    getPricePerUnit,
} from '@/constants/credits';
import PresetCard from '@app/(protected)/account/credits/top-up/components/preset-card';
import { Alert, AlertDescription, AlertIcon, AlertTitle } from '@components/ui/alert';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { FormField, FormItem, FormLabel, FormMessage } from '@components/ui/form';
import { Input } from '@components/ui/input';
import { isApiError, standardizeError } from '@errors/api-errors';
import { AmountSchema } from '@schemas/credit-schemas';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';
import type { PaymentCheckoutSessionResponse } from '@app/api/payment/checkout-session/route';
import type { z } from 'zod';

/**
 * On this page, users will select how many credits they want to buy.
 *
 * The pricing model dynamically updates:
 *
 * - 1–50 VTC: $0.10 per credit (no discount).
 * - 51–299 VTC: $0.083 per credit (17% off).
 * - 300+ VTC: $0.075 per credit (25% off).
 *
 * After selecting credits, we redirect the user to Stripe Checkout to finalize the payment.
 */
export default function TopUpPageContent() {
    const router = useRouter();

    // Local State:
    const [discount, setDiscount] = useState<number>(0);
    const [currentUnitPrice, setCurrentUnitPrice] = useState<number>(VTC_UNIT_PRICE);
    const [totalPrice, setTotalPrice] = useState<number>(0);

    // Form State:
    const [errorAlert, setErrorAlert] = useState<{
        error: boolean;
        message: string;
        description: string;
    } | null>(null);

    const [successAlert, setSuccessAlert] = useState<{
        success: boolean;
        message: string;
        description: string;
    } | null>(null);

    // * - Sign in Form Schema:
    const zodSchema = AmountSchema;

    const formMethods = useForm<z.infer<typeof zodSchema>>({
        defaultValues: {
            amount: 50,
        },
        mode: 'all',
        progressive: false,
        resolver: useZodResolver(zodSchema),
        shouldFocusError: true,
        shouldUnregister: false,
        shouldUseNativeValidation: false,
    });

    const { control, handleSubmit, setValue, watch } = formMethods;

    const watchedAmount: number = watch('amount') ?? 1;

    useEffect(() => {
        if (typeof watch('amount') !== 'number') {
            return;
        }

        const currentDiscount = calculateDiscount(watchedAmount ?? 1);
        const newUnitPrice = getPricePerUnit(watchedAmount ?? 1, currentDiscount ?? 0);
        const newTotalPrice = calculateTotalPrice(watchedAmount ?? 1);

        setDiscount(currentDiscount ?? 0);
        setCurrentUnitPrice(newUnitPrice ?? 0);
        setTotalPrice(newTotalPrice ?? 0);
    }, [watchedAmount]);

    // Use Memo for Pricing Packs - Show full spectrum internally (Utility focus)
    const presetPacks = useMemo(
        () => VTC_PRESET_PACKS.filter((p) => [10, 50, 100, 500, 2000].includes(p.amount)),
        [],
    );

    // * - Submit Handler:
    const { isPending, mutateAsync } = useMutation({
        mutationFn: async (data: z.infer<typeof zodSchema>) => {
            const response = await fetch('/api/payment/checkout-session', {
                body: JSON.stringify({ credits: data.amount }),
                headers: {
                    'Content-Type': 'application/json',
                },
                method: 'POST',
            });

            const responseData = (await response.json()) as PaymentCheckoutSessionResponse;

            if (!response.ok) {
                throw standardizeError(responseData);
            }

            const paymentUrl = responseData?.data?.paymentUrl as string;

            if (!paymentUrl) {
                throw standardizeError({
                    description: 'An error occurred while processing your request. Please try again.',
                    title: 'Error!',
                });
            }

            // Redirect to the payment page:
            router.push(paymentUrl);

            return responseData;
        },
        onError: (error: (Error & Partial<ApiErrorType>) | ApiErrorType) => {
            setErrorAlert({
                description:
                    error?.description ??
                    'An error occurred while processing your request. Please try again.',
                error: true,
                message: error?.title ?? error?.message ?? 'Error!',
            });
        },
        onMutate: () => {
            setErrorAlert(null);
            setSuccessAlert(null);
        },
        onSettled: () => {
            // Reset the form after the request has been settled
            formMethods.reset();
        },
        onSuccess: (data: ApiResponseOrError | ApiErrorType) => {
            if (data?.error === true || isApiError(data)) {
                return setErrorAlert({
                    description:
                        data?.description ??
                        'An error occurred while processing your request. Please try again.',
                    error: true,
                    message: data?.title ?? data?.message ?? 'Error!',
                });
            }

            return setSuccessAlert({
                description: 'You will be redirected to the payment page shortly.',
                message: 'Redirecting to payment page...',
                success: true,
            });
        },
        retry: 0,
    });

    const handleCheckout = async (data: z.infer<typeof zodSchema>) => {
        try {
            await mutateAsync(data);
        } catch (error) {
            console.error('Error during checkout:', error);
        }
    };

    return (
        <Fragment>
            {/* ! - Alert Section: */}
            <div className="relative z-30 flex w-full max-w-screen-lg flex-col items-center justify-center gap-5">
                <div className="my-auto flex w-full flex-col-reverse items-start justify-start gap-12 py-6 md:flex-row">
                    <div className="flex w-full max-w-full flex-1 flex-col items-center justify-center gap-3">
                        {presetPacks.map((pack) => (
                            <PresetCard
                                key={pack.amount}
                                amount={pack.amount}
                                discountPercentage={pack.discountPercentage}
                                isActive={watchedAmount === pack.amount}
                                isMostPopular={pack.isMostPopular}
                                name={pack.name}
                                unitPrice={VTC_UNIT_PRICE}
                                totalPriceOverride={pack.price}
                                onClick={() => setValue('amount', pack.amount)}
                            />
                        ))}
                    </div>
                    <div className="flex w-full flex-2 flex-col items-center justify-center gap-2">
                        <div className="flex w-full flex-col items-center justify-center gap-5">
                            <div className="mb-5 flex w-full flex-col items-start justify-start gap-3">
                                <div className="bg-primary-100 dark:bg-primary-900 mb-3 flex size-16 items-center justify-center rounded-full">
                                    <CoinsIcon
                                        className="text-primary-500 dark:text-primary-400 size-8"
                                        color="currentColor"
                                        weight="duotone"
                                    />
                                </div>
                                <h1 className="text-surface-900 text-start text-3xl leading-tight font-bold tracking-tight md:text-4xl dark:text-white">
                                    Purchase Credits
                                </h1>
                                <p className="text-surface-600 dark:text-surface-400 text-start font-medium">
                                    1 Credit = 1 Page of certified translation. Save up to 60% with volume
                                    packs. Credits never expire.
                                </p>
                            </div>
                            <FormProvider {...formMethods}>
                                <form
                                    className="mb-5 flex w-full flex-col items-center justify-center gap-5"
                                    onSubmit={handleSubmit(handleCheckout)}
                                >
                                    <Alert
                                        withCloseButton
                                        className="w-full"
                                        show={errorAlert?.error === true}
                                        variant="destructive"
                                        onClose={() => {
                                            setErrorAlert(null);
                                        }}
                                    >
                                        <AlertIcon>
                                            <WarningIcon
                                                className="size-5"
                                                color="currentColor"
                                                weight="duotone"
                                            />
                                        </AlertIcon>
                                        <AlertTitle>{errorAlert?.message}</AlertTitle>
                                        <AlertDescription>{errorAlert?.description}</AlertDescription>
                                    </Alert>

                                    <Alert
                                        withCloseButton
                                        className="w-full"
                                        show={successAlert?.success === true}
                                        variant="success"
                                        onClose={() => {
                                            setSuccessAlert(null);
                                        }}
                                    >
                                        <AlertIcon>
                                            <ArrowSquareOutIcon
                                                className="size-5"
                                                color="currentColor"
                                                weight="duotone"
                                            />
                                        </AlertIcon>
                                        <AlertTitle>{successAlert?.message}</AlertTitle>
                                        <AlertDescription>{successAlert?.description}</AlertDescription>
                                    </Alert>

                                    <FormField
                                        control={control}
                                        name="amount"
                                        render={({ field: { onBlur: _, onChange, value, ...field } }) => {
                                            return (
                                                <FormItem className="w-full">
                                                    <FormLabel
                                                        className="text-foreground text-sm font-medium"
                                                        htmlFor="amount"
                                                    >
                                                        Amount of Credits
                                                    </FormLabel>
                                                    <div className="w-full">
                                                        <Input
                                                            autoFocus={true}
                                                            disabled={isPending}
                                                            hasError={
                                                                !!formMethods?.formState?.errors?.amount
                                                            }
                                                            id="amount"
                                                            placeholder="123"
                                                            type="number"
                                                            value={value ?? 1}
                                                            onBlur={(e) => {
                                                                const inputValue = parseInt(
                                                                    e.target.value,
                                                                    10,
                                                                );

                                                                // Validate on blur
                                                                if (
                                                                    isNaN(inputValue) ||
                                                                    inputValue < VTC_MINIMUM_AMOUNT
                                                                ) {
                                                                    onChange(VTC_MINIMUM_AMOUNT);
                                                                } else if (inputValue > VTC_MAXIMUM_AMOUNT) {
                                                                    onChange(VTC_MAXIMUM_AMOUNT);
                                                                } else {
                                                                    onChange(inputValue);
                                                                }
                                                            }}
                                                            onChange={(e) => {
                                                                const inputValue = parseInt(
                                                                    e.target.value,
                                                                    10,
                                                                );

                                                                return onChange(
                                                                    isNaN(inputValue) ? 0 : inputValue,
                                                                );
                                                            }}
                                                            {...field}
                                                        />
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            );
                                        }}
                                    />
                                    <div className="mt-2 flex w-full flex-col items-end justify-end gap-2">
                                        <div className="flex flex-col items-end justify-center gap-2">
                                            <span className="text-muted text-xs font-medium">Unit Price</span>
                                            <span className="text-foreground text-sm font-bold">
                                                {titleCase(`${formatPrice(currentUnitPrice)} per credit`)}
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-end justify-center gap-2">
                                            <span className="text-muted text-xs font-medium">
                                                Total Price
                                            </span>
                                            <span className="text-foreground text-2xl font-bold md:text-3xl">
                                                <Badge color="accent" variant="soft">
                                                    {discount}% Off
                                                </Badge>
                                                {formatPrice(totalPrice)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-2 flex w-full flex-row items-stretch justify-end gap-2">
                                        <Button
                                            asChild
                                            className="w-auto"
                                            color="default"
                                            shape="rounded"
                                            size="lg"
                                            type="button"
                                            variant="soft"
                                        >
                                            <Link href="/account/billing">
                                                <InvoiceIcon
                                                    className="size-5"
                                                    color="currentColor"
                                                    weight="duotone"
                                                />
                                                <span>Billing</span>
                                            </Link>
                                        </Button>
                                        {isPending ? (
                                            <Button
                                                disabled
                                                loading
                                                className="w-auto"
                                                color="primary"
                                                shape="rounded"
                                                size="lg"
                                                type="button"
                                                variant="solid"
                                            >
                                                Processing
                                            </Button>
                                        ) : (
                                            <Button
                                                className="w-auto"
                                                color="primary"
                                                shape="rounded"
                                                size="lg"
                                                type="submit"
                                                variant="solid"
                                            >
                                                <CreditCardIcon
                                                    className="size-5"
                                                    color="currentColor"
                                                    weight="duotone"
                                                />
                                                <span>Checkout</span>
                                            </Button>
                                        )}
                                    </div>
                                </form>
                            </FormProvider>
                        </div>
                    </div>
                </div>
            </div>
        </Fragment>
    );
}
