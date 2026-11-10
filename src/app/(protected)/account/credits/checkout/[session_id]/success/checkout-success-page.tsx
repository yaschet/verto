/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import {
    ArrowSquareOutIcon,
    ArrowsCounterClockwiseIcon,
    CheckCircleIcon,
    CheckFatIcon,
    CircleDashedIcon,
    ClockIcon,
    HourglassIcon,
    HouseSimpleIcon,
    PlaceholderIcon,
    ShoppingCartSimpleIcon,
} from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import { titleCase } from 'title-case';
import { useGlobalStore } from '@/src/components/providers/global-store-provider';
import {
    VTC_UNIT_PRICE_CURRENCY,
    convertCentsToDollars,
    formatAmount,
    formatCreditsBalance,
    getPaymentMethodDetails,
} from '@/constants/credits';
import { Button } from '@components/ui/button';
import Spinner from '@components/ui/spinner';
import { Table, TableBody, TableCell, TableRow } from '@components/ui/table';
import { useUserData } from '@hooks/queries/auth/use-user-data';
import { cn } from '@library/utils';
import { stripeRetrieveCheckoutSessionQueryOptions } from '@queries/tanstack/stripe-query-options';
import type { ApiErrorType } from '@/types/rest/errors';
import type {
    StripeCheckoutSessionQueryData,
    StripeCheckoutSessionQueryResponse,
} from '@queries/tanstack/stripe-query-options';
import type Stripe from 'stripe';

export default function CheckoutSuccessPage() {
    const { data: userData } = useUserData();
    const { profile } = userData ?? {};
    const [SuccessIcon, setSuccessIcon] = useState<React.ReactElement>(
        <Spinner className="text-success size-8" color="currentColor" />,
    );
    const [SuccessTitle, setSuccessTitle] = useState<string | React.ReactElement>('Loading Checkout Session');
    const [SuccessMessage, setSuccessMessage] = useState<string | React.ReactElement>(
        'Please wait while we load your payment information.',
    );

    const params = useParams<{ session_id: string }>();
    const sessionId = params.session_id ?? null;

    const { data, error, isError, isLoading, isRefetching, refetch } = useQuery<
        StripeCheckoutSessionQueryResponse,
        ApiErrorType,
        StripeCheckoutSessionQueryData,
        ['stripe-checkout-session', string | null]
    >(stripeRetrieveCheckoutSessionQueryOptions(sessionId ?? null));

    const session: Stripe.Checkout.Session | null = data?.data?.session || null;
    const [isSessionComplete, setIsSessionComplete] = useState<boolean>(
        Boolean(
            (session?.payment_status === 'paid' && session?.status === 'complete') ||
                (session?.payment_intent &&
                    (session.payment_intent as Stripe.PaymentIntent & { invoice?: Stripe.Invoice })
                        ?.invoice &&
                    (session.payment_intent as Stripe.PaymentIntent)?.latest_charge &&
                    (session.payment_intent as Stripe.PaymentIntent)?.payment_method),
        ),
    );

    useEffect(() => {
        const interval = setInterval(() => {
            if (!sessionId || isSessionComplete) {
                clearInterval(interval);
                return;
            }

            refetch()
                .then((res) => {
                    const updatedSession = res.data?.data?.session;
                    /**
                     * The session is considered complete when the Payment intent, Invoice, Charge, and Payment Method
                     * are all present. The session is considered complete despite the status of it, we mean it is
                     * complete when all the necessary data is present.
                     */
                    const isNewSessionIsComplete = Boolean(
                        (updatedSession?.payment_status === 'paid' &&
                            updatedSession?.status === 'complete') ||
                            (updatedSession?.payment_intent &&
                                (
                                    updatedSession?.payment_intent as Stripe.PaymentIntent & {
                                        invoice?: Stripe.Invoice;
                                    }
                                )?.invoice &&
                                updatedSession?.payment_intent.latest_charge &&
                                updatedSession?.payment_intent.payment_method),
                    );

                    if (isNewSessionIsComplete) {
                        setIsSessionComplete(true);
                    }
                })
                .catch((err) => {
                    console.error('Error Fetching Session:', err);
                });
        }, 1000);

        return () => clearInterval(interval);
    }, [sessionId, isSessionComplete, refetch]);

    const formattedAmounts = useMemo(() => {
        if (session) {
            const CURRENCY = VTC_UNIT_PRICE_CURRENCY ?? 'usd';

            const intent = session?.payment_intent as Stripe.PaymentIntent | null;
            const invoice = (intent as (Stripe.PaymentIntent & { invoice?: Stripe.Invoice | null }) | null)
                ?.invoice as Stripe.Invoice | null;
            const charge = intent?.latest_charge as Stripe.Charge | null;

            // 1. Get Discount Details
            // Prefer total_details, fall back to calculating from invoice/intent
            const amountDiscountInCents =
                session.total_details?.amount_discount ?? invoice?.total_discount_amounts?.[0]?.amount ?? 0;
            const subtotalInCents = session?.amount_subtotal ?? invoice?.subtotal ?? intent?.amount ?? 0;

            // Calculate percentage if not explicitly available
            let discountPercentOff = 0;
            if (amountDiscountInCents > 0 && subtotalInCents > 0) {
                discountPercentOff = Math.round((amountDiscountInCents / subtotalInCents) * 100);
            }

            const discountAmountOff = amountDiscountInCents;
            const creditsPurchased = Number(session?.metadata?.credits ?? 0);
            const paymentMethodDetails = getPaymentMethodDetails(
                intent?.payment_method as Stripe.PaymentMethod | null,
            );

            // 2. Get Charged Amounts
            const amountTotal = session?.amount_total ?? 0;
            const amountCharged = charge?.amount_captured ?? charge?.amount ?? session?.amount_total ?? 0;

            // 3. Handle Currency Conversion
            const stripeCurrency = session?.currency?.toLowerCase() ?? CURRENCY; // Settlement currency (e.g., 'usd')
            const chargeCurrency = charge?.currency?.toLowerCase() ?? CURRENCY; // Charge currency
            const presentmentDetails = (
                session as Stripe.Checkout.Session & {
                    presentment_details?: {
                        presentment_amount?: number;
                        presentment_currency?: string;
                        amount?: number;
                        currency?: string;
                    };
                }
            )?.presentment_details;

            // Detect if the charged currency (what user paid) differs from settlement currency (what we received)
            // 1. Check direct charge currency check
            let isCurrencyDifferent = stripeCurrency !== chargeCurrency;
            let presentedAmountInMinorUnits = charge?.amount ?? 0;
            let presentedCurrency = chargeCurrency;

            // 2. Check presentment_details (Adaptive Pricing) - OVERRIDE if present

            const presentmentAmount = presentmentDetails?.presentment_amount ?? presentmentDetails?.amount;
            const presentmentDetailsCurrency =
                presentmentDetails?.presentment_currency ?? presentmentDetails?.currency;

            if (presentmentAmount && presentmentDetailsCurrency) {
                // If presentment details exist, they are the source of truth for what customer saw
                if (presentmentDetailsCurrency.toLowerCase() !== stripeCurrency) {
                    isCurrencyDifferent = true;
                    presentedAmountInMinorUnits = presentmentAmount;
                    presentedCurrency = presentmentDetailsCurrency.toLowerCase();
                }
            }

            let conversionDetails = '';

            if (isCurrencyDifferent) {
                const settledAmountInMinorUnits = session.amount_total ?? 0; // e.g., 4900 (USD cents)

                if (presentedAmountInMinorUnits > 0 && settledAmountInMinorUnits > 0) {
                    // Calculate rate: Presented Amount / Settled Amount
                    // e.g., 46371 MAD cents / 4900 USD cents = 9.4634 MAD per USD
                    const rate = presentedAmountInMinorUnits / settledAmountInMinorUnits;

                    // The total in the base (settlement) currency (e.g., $49.00 USD)
                    convertCentsToDollars(settledAmountInMinorUnits);

                    const conversionMarkup = 1.02;
                    const conversionMarkupPercentage = ((conversionMarkup - 1) * 100).toFixed(2);

                    // Construct the conversion details string
                    conversionDetails = `Charged ${formatAmount(presentedAmountInMinorUnits, presentedCurrency)} using 1 ${stripeCurrency.toUpperCase()} = ${rate.toFixed(4)} ${presentedCurrency.toUpperCase()} (incl. ${conversionMarkupPercentage}% conversion markup).`;
                }
            }

            return {
                amountOff: formatAmount(discountAmountOff, stripeCurrency),
                amountPaid: formatAmount(amountCharged, chargeCurrency),
                conversionDetails,
                creditsPurchased,
                discountPercentOff,
                isCurrencyDifferent,
                paymentMethodDetails,
                receiptUrl: charge?.receipt_url ?? null,
                subtotal: formatAmount(subtotalInCents, stripeCurrency),
                total: formatAmount(amountTotal, stripeCurrency),
                transactionDate: new Date(session.created * 1000).toLocaleString(),
            };
        }

        return null;
    }, [session]);

    const {
        amountOff,
        amountPaid,
        conversionDetails,
        creditsPurchased,
        discountPercentOff,
        isCurrencyDifferent,
        paymentMethodDetails,
        receiptUrl,
        subtotal,
        total,
        transactionDate,
    } = formattedAmounts ?? {};

    useEffect(() => {
        if (session) {
            // Success status:
            const paymentStatus = session.payment_status ?? null;
            const status = session.status ?? null;

            if (paymentStatus === 'paid' && status === 'complete') {
                setSuccessIcon(<CheckFatIcon className="text-success size-8" weight="duotone" />);
                setSuccessTitle(<>Payment Successful</>);

                setSuccessMessage(
                    <div className="flex flex-col items-center justify-center gap-2 text-center">
                        <span>
                            <strong>Thank you for your purchase!</strong>{' '}
                            <strong className="text-success font-bold">
                                {formatCreditsBalance(creditsPurchased ?? 0)} VTC
                            </strong>{' '}
                            have been added to your account and are available for use immediately.
                        </span>
                        <Table>
                            <TableBody>
                                <TableRow>
                                    <TableCell className="text-foreground text-start text-sm font-bold text-pretty">
                                        <div>Credits Purchased</div>
                                    </TableCell>
                                    <TableCell className="text-foreground text-end text-sm font-bold text-pretty">
                                        <div>
                                            <span>{formatCreditsBalance(creditsPurchased ?? 0)}</span> VTC
                                        </div>
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-foreground text-start text-sm font-bold text-pretty">
                                        <span>Subtotal</span>
                                    </TableCell>
                                    <TableCell className="text-foreground text-end text-sm font-bold text-pretty">
                                        {subtotal}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-foreground text-start text-sm font-bold text-pretty">
                                        <span>Discount ({discountPercentOff}% off)</span>
                                    </TableCell>
                                    <TableCell className="text-foreground dark:text-foreground text-end font-semibold">
                                        - {amountOff}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    {isCurrencyDifferent ? (
                                        <TableCell>
                                            <div className="flex w-auto flex-col items-start justify-center gap-1">
                                                <span className="text-foreground text-sm font-bold text-pretty">
                                                    Total Paid
                                                </span>
                                                <span className="text-muted max-w-60 text-start text-xs font-medium text-pretty">
                                                    {conversionDetails}
                                                </span>
                                            </div>
                                        </TableCell>
                                    ) : (
                                        <TableCell className="text-foreground text-start text-sm font-bold text-pretty">
                                            <div>Total Paid</div>
                                        </TableCell>
                                    )}
                                    <TableCell className="text-foreground dark:text-foreground text-end font-semibold">
                                        {amountPaid}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-foreground text-start text-sm font-bold text-pretty">
                                        <div>Payment Method</div>
                                    </TableCell>
                                    <TableCell className="text-foreground text-end text-sm font-bold text-pretty">
                                        {paymentMethodDetails}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-foreground text-start text-sm font-bold text-pretty">
                                        <div>Payment Status</div>
                                    </TableCell>
                                    <TableCell className="text-foreground text-end text-sm font-bold text-pretty">
                                        {titleCase(paymentStatus)}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-foreground text-start text-sm font-bold text-pretty">
                                        <div>Transaction Date</div>
                                    </TableCell>
                                    <TableCell className="text-foreground text-end text-sm font-bold text-pretty">
                                        {transactionDate}
                                    </TableCell>
                                </TableRow>
                                {receiptUrl && (
                                    <TableRow>
                                        <TableCell className="text-foreground text-start text-sm font-bold text-pretty">
                                            <div>Receipt</div>
                                        </TableCell>
                                        <TableCell className="text-foreground text-end text-sm font-bold text-pretty">
                                            <a
                                                className="text-accent hover:text-accent-surface-2 dark:text-accent dark:hover:text-accent-surface-2 inline-flex items-center justify-center gap-1 hover:cursor-pointer hover:underline"
                                                href={receiptUrl}
                                                rel="noopener noreferrer"
                                                target="_blank"
                                            >
                                                <ArrowSquareOutIcon className="size-4" />
                                                <span>View Receipt</span>
                                            </a>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>,
                );
            } else if (paymentStatus === 'unpaid') {
                setSuccessIcon(<ClockIcon className="text-success size-8" weight="duotone" />);
                setSuccessTitle('Your Payment Will Be Processed');
                setSuccessMessage(
                    <div className="flex flex-col items-center justify-center gap-2 text-center">
                        <p>
                            <strong>Your payment is being processed.</strong> Please wait while we confirm
                            your transaction.
                        </p>
                        <p>
                            <strong>Amount Paid:</strong>{' '}
                            <span className="text-success font-bold">${amountPaid}</span>
                        </p>
                        <p>
                            <strong>Credits Purchased:</strong>{' '}
                            <span className="text-success font-bold">{creditsPurchased} VTC</span>
                        </p>
                    </div>,
                );
            } else if (paymentStatus === 'no_payment_required') {
                setSuccessIcon(<CheckCircleIcon className="text-success size-8" weight="duotone" />);
                setSuccessTitle('Checkout Complete, No Payment Required');
                setSuccessMessage(
                    <span>
                        <strong>Thank you for completing the checkout process!</strong> No payment was
                        required. But {creditsPurchased} VTC have been added to your account and are available
                        for use immediately.
                    </span>,
                );
            } else {
                setSuccessIcon(<HourglassIcon className="text-success size-8" weight="duotone" />);
                setSuccessTitle('Payment is Being Processed');
                setSuccessMessage(
                    <div className="flex flex-col items-center justify-center gap-2 text-center">
                        <p>
                            <strong>We are waiting for payment confirmation.</strong> Your credits will be
                            added once the transaction is confirmed. Please check back later.
                        </p>
                    </div>,
                );
            }
        } else {
            setSuccessIcon(<PlaceholderIcon className="text-success size-8" weight="duotone" />);
            setSuccessTitle('No Checkout Session Found');
            setSuccessMessage(
                <span>
                    <strong>Sorry, but we couldn't find your checkout session.</strong> Please try again later
                    or contact support for assistance.
                </span>,
            );
        }
    }, [
        sessionId,
        session,
        creditsPurchased,
        subtotal,
        discountPercentOff,
        amountOff,
        isCurrencyDifferent,
        conversionDetails,
        total,
        amountPaid,
        paymentMethodDetails,
        transactionDate,
        receiptUrl,
    ]);

    const showConfetti = useGlobalStore((store) => store.showConfetti);

    useEffect(() => {
        if (session?.payment_status === 'paid' && session.status === 'complete') {
            showConfetti();
        }
    }, [session, showConfetti]);

    if (isError || error || !session) {
        return (
            <main className="relative container flex w-full flex-1 flex-col items-center justify-center">
                <div className="flex w-full max-w-xl flex-col items-center justify-center text-center">
                    <div className="mb-5 flex flex-col items-center justify-center gap-3">
                        <div className="bg-destructive-100 text-destructive dark:bg-destructive-900 dark:text-destructive mb-3 flex size-16 items-center justify-center rounded-full">
                            {isRefetching ? (
                                <Spinner className="text-destructive size-8" color="currentColor" />
                            ) : (
                                <CircleDashedIcon className="text-destructive size-8" weight="duotone" />
                            )}
                        </div>
                        <div
                            aria-level={1}
                            className={cn(
                                'text-surface-900 max-w-lg text-center text-3xl leading-tight font-black tracking-tighter md:text-5xl dark:text-white',
                                'overflow-wrap-anywhere text-pretty break-words',
                            )}
                            role="heading"
                        >
                            We Couldn't Load Your Checkout Session
                        </div>
                        <div
                            className="text-surface-600 dark:text-surface-400 flex flex-col gap-2 text-center font-medium break-words"
                            role="contentinfo"
                        >
                            <p>Sorry, but we couldn't find your checkout session.</p>
                            <p>
                                Our system may not be able to find this session since it doesn't exist, you
                                could've mistyped the URL, or the session has expired.
                            </p>
                            <p>
                                If you believe this is an error, please try reloading the page or contact{' '}
                                <a
                                    className="text-accent hover:text-accent-surface-2 dark:text-accent dark:hover:text-accent-surface-2 hover:cursor-pointer hover:underline"
                                    href={`mailto:sample@example.com?subject=Checkout%20Session%20Error&body=Hello%20Verto%20Support%20Team,%0D%0A%0D%0AI%20am%20experiencing%20an%20issue%20with%20my%20checkout%20session.%20Could%20you%20please%20help%20me%20resolve%20this%20issue?%0D%0A%0D%0AError%20Code:%20${error?.code ?? 'N/A'}%0D%0AError%20Trace%20ID:%20${error?.traceId ?? 'N/A'}%0D%0A%0D%0AThank%20you,%0D%0A%0D%0A${profile?.full_name ?? 'Customer'}`}
                                >
                                    support
                                </a>{' '}
                                for assistance.
                            </p>
                        </div>
                    </div>

                    <div className="mt-10 flex w-full flex-wrap items-center justify-between gap-2">
                        <Button
                            className="flex flex-1 items-center justify-center"
                            color="destructive"
                            loading={isRefetching}
                            shape="pill"
                            size="xl"
                            type="button"
                            variant={isRefetching ? 'soft' : 'solid'}
                            onClick={() => refetch()}
                        >
                            {!isRefetching && (
                                <>
                                    <ArrowsCounterClockwiseIcon
                                        className="size-5"
                                        color="currentColor"
                                        weight="duotone"
                                    />
                                    <span className="text-base font-semibold">Retry Loading</span>
                                </>
                            )}
                            {isRefetching && <span className="text-base font-semibold">Loading Session</span>}
                        </Button>
                        <Button
                            asChild
                            className="flex flex-1 items-center justify-center"
                            color="secondary"
                            shape="pill"
                            size="xl"
                            type="button"
                            variant="soft"
                        >
                            <Link href="/app/dashboard">
                                <HouseSimpleIcon className="size-5" color="currentColor" weight="duotone" />
                                <span className="text-base font-semibold">Go to Dashboard</span>
                            </Link>
                        </Button>
                    </div>
                </div>
            </main>
        );
    }

    if (isLoading || isRefetching) {
        return (
            <main className="relative container flex w-full flex-1 flex-col items-center justify-center">
                <div className="flex w-full max-w-xl flex-col items-center justify-center text-center">
                    <div className="mb-5 flex flex-col items-center justify-center gap-3">
                        <div className="bg-success-100 text-success dark:bg-success-900 dark:text-success mb-3 flex size-16 items-center justify-center rounded-full">
                            <Spinner className="size-8" color="currentColor" />
                        </div>
                        <div
                            aria-level={1}
                            className={cn(
                                'text-surface-900 max-w-lg text-center text-3xl leading-tight font-black tracking-tighter md:text-5xl dark:text-white',
                                'overflow-wrap-anywhere text-pretty break-words',
                            )}
                            role="heading"
                        >
                            Loading Checkout Session
                        </div>
                        <div
                            className="text-surface-600 dark:text-surface-400 text-center font-medium break-words"
                            role="contentinfo"
                        >
                            Please wait while we load your payment information.
                        </div>
                    </div>

                    <div className="mt-10 flex w-full flex-wrap items-center justify-between gap-2">
                        <Button
                            asChild
                            className="flex flex-1 items-center justify-center"
                            color="success"
                            shape="pill"
                            size="xl"
                            type="button"
                            variant="solid"
                        >
                            <Link href="/account/credits/top-up">
                                <ShoppingCartSimpleIcon
                                    className="size-5"
                                    color="currentColor"
                                    weight="duotone"
                                />
                                <span className="text-base font-semibold">Top Up More Credits</span>
                            </Link>
                        </Button>
                        <Button
                            asChild
                            className="flex flex-1 items-center justify-center"
                            color="secondary"
                            shape="pill"
                            size="xl"
                            type="button"
                            variant="soft"
                        >
                            <Link href="/app/dashboard">
                                <HouseSimpleIcon className="size-5" color="currentColor" weight="duotone" />
                                <span className="text-base font-semibold">Go to Dashboard</span>
                            </Link>
                        </Button>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="relative container flex w-full flex-1 flex-col items-center justify-center">
            <div className="flex w-full max-w-xl flex-col items-center justify-center text-center">
                <div className="mb-5 flex flex-col items-center justify-center gap-3">
                    <div className="bg-success-100 text-success dark:bg-success-900 dark:text-success mb-3 flex size-16 items-center justify-center rounded-full">
                        {SuccessIcon}
                    </div>
                    <div
                        aria-level={1}
                        className={cn(
                            'text-foreground max-w-lg text-center text-3xl leading-tight font-black tracking-tighter md:text-5xl',
                            'overflow-wrap-anywhere text-pretty break-words',
                        )}
                        role="heading"
                    >
                        {SuccessTitle}
                    </div>
                    <div
                        className="text-surface-600 dark:text-surface-400 text-center font-medium break-words"
                        role="contentinfo"
                    >
                        {SuccessMessage}
                    </div>
                </div>

                <div className="mt-10 flex w-full flex-wrap items-center justify-between gap-2">
                    <Button
                        asChild
                        className="flex flex-1 items-center justify-center"
                        color="success"
                        shape="pill"
                        size="xl"
                        type="button"
                        variant="solid"
                    >
                        <Link href="/account/credits/top-up">
                            <ShoppingCartSimpleIcon
                                className="size-5"
                                color="currentColor"
                                weight="duotone"
                            />
                            <span className="text-base font-semibold">Top Up More Credits</span>
                        </Link>
                    </Button>
                    <Button
                        asChild
                        className="flex flex-1 items-center justify-center"
                        color="secondary"
                        shape="pill"
                        size="xl"
                        type="button"
                        variant="soft"
                    >
                        <Link href="/app/dashboard">
                            <HouseSimpleIcon className="size-5" color="currentColor" weight="duotone" />
                            <span className="text-base font-semibold">Go to Dashboard</span>
                        </Link>
                    </Button>
                </div>
            </div>
        </main>
    );
}
