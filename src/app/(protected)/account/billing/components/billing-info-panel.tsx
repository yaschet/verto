/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { ArrowsCounterClockwiseIcon, InfoIcon, ShoppingCartIcon } from '@phosphor-icons/react';
import Link from 'next/link';
import { Fragment, useEffect } from 'react';
import { toast } from 'sonner';
import { formatCreditsBalance } from '@/constants/credits';
import { PanelSection } from '@app/(protected)/account/components/shared/panel-section';
import { Button } from '@components/ui/button';
import AnimatedDisclosure from '@components/ui/disclosure';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Skeleton } from '@components/ui/skeleton';
import { useBalanceData } from '@hooks/queries/auth/use-balance-data';
import { useUserData } from '@hooks/queries/auth/use-user-data';
import { cn } from '@library/utils';

export default function BillingInfoPanel() {
    const { data } = useUserData();
    const { profile } = data ?? {};

    const { data: creditsBalance, error, isError, isLoading, refetch } = useBalanceData();

    useEffect(() => {
        if (isError) {
            toast.error(error?.title ?? error?.message ?? 'Unable to fetch credits balance.', {
                description: error?.description ?? 'Please try again, or contact support.',
                id: 'credits-balance-error',
            });
        }
    }, [error, isError]);

    if (isError) {
        return (
            <PanelSection
                description="View your billing information and manage your credits."
                title="Billing Info"
            >
                <div className={cn('flex w-full flex-col gap-4')}>
                    <div className={cn('flex w-full flex-col gap-2')}>
                        <h4 className={cn('text-primary text-lg font-semibold')}>
                            {error?.title ?? error?.message ?? 'Error'}
                        </h4>
                        <p className={cn('text-muted text-sm')}>
                            {error?.description ??
                                'Unable to fetch your billing information. Please try again, or contact support.'}
                        </p>
                    </div>
                    <div className={cn('flex w-full flex-row gap-4')}>
                        <Button
                            className="max-w-auto w-auto min-w-auto"
                            color="default"
                            size="md"
                            variant="solid"
                            onClick={() => refetch()}
                        >
                            <ArrowsCounterClockwiseIcon
                                className="size-5"
                                color="currentColor"
                                weight="duotone"
                            />
                            <span>Retry</span>
                        </Button>
                    </div>
                </div>
            </PanelSection>
        );
    }

    if (isLoading) {
        const getRandomWidth = (min: number, max: number) => {
            return `${Math.floor(Math.random() * (max - min + 1)) + min}%`;
        };

        const getRandomCount = (min: number, max: number) => {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        };

        return (
            <PanelSection
                description="View your billing information and manage your credits."
                title="Billing Info"
            >
                <div className="relative flex w-full flex-col gap-4">
                    <div className="relative flex w-full flex-row gap-6">
                        <div className="relative flex w-full flex-col gap-6">
                            <Skeleton className="h-4" style={{ width: getRandomWidth(20, 50) }} />
                            <div className="flex w-full flex-col gap-3">
                                {[...Array(getRandomCount(1, 3))].map((_2, subIndex1) => (
                                    <Skeleton
                                        key={subIndex1}
                                        className="h-4"
                                        style={{ width: getRandomWidth(80, 100) }}
                                    />
                                ))}
                            </div>
                            <div className="flex w-full flex-col gap-3">
                                {[...Array(getRandomCount(1, 3))].map((_3, subIndex2) => (
                                    <Skeleton
                                        key={subIndex2}
                                        className="h-10"
                                        style={{ width: getRandomWidth(80, 100) }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </PanelSection>
        );
    }

    return (
        <PanelSection
            description="Manage your credits and review billing details seamlessly."
            title="Billing Info"
        >
            <div className={cn('relative flex w-full flex-1 flex-col items-start justify-start gap-6')}>
                <div className={cn('flex flex-col gap-2')}>
                    <p className="text-muted text-sm">
                        Enjoy the flexibility of our prepaid credits system—only pay for what you use.
                    </p>
                </div>
                <div className={cn('relative flex w-full flex-1 flex-col gap-2')}>
                    <Label>Available Credits</Label>
                    <div className={cn('flex w-full flex-1 flex-row gap-2')}>
                        <Input
                            className={cn(
                                'read-only:bg-surface-100 read-only:text-surface-950 read-only:dark:bg-surface-900 read-only:dark:text-surface-50 w-full font-bold',
                                'read-only:hover:bg-surface-200 read-only:hover:text-surface-700 read-only:dark:hover:bg-surface-800 read-only:dark:hover:text-surface-300',
                                'read-only:focus:bg-surface-200 read-only:focus:text-surface-700 read-only:dark:focus:bg-surface-800 read-only:dark:focus:text-surface-300',
                                'read-only:active:bg-surface-300 read-only:active:text-surface-800 read-only:dark:active:bg-surface-700 read-only:dark:active:text-surface-200',
                            )}
                            readOnly={true}
                            type="text"
                            value={`${formatCreditsBalance(creditsBalance ?? 0)} VTC`}
                        />
                        <Button asChild color="primary" size="md" variant="solid">
                            <Link href="/account/credits/top-up">
                                <ShoppingCartIcon className="size-5" color="currentColor" weight="duotone" />
                                <span>Top Up</span>
                            </Link>
                        </Button>
                    </div>
                </div>
                <div className={cn('flex w-full flex-col gap-2')}>
                    <AnimatedDisclosure
                        title={
                            <Fragment>
                                <InfoIcon className="size-5" color="currentColor" weight="duotone" />
                                <span className="font-semibold">Understanding the Prepaid Credits Model</span>
                            </Fragment>
                        }
                    >
                        <p className={cn('text-muted text-sm')}>
                            Our prepaid credits system allows you to purchase credits upfront for seamless use
                            across our platform. Each translation consumes one credit, and your credits never
                            expire, giving you full control over when and how you use them.
                        </p>

                        <p className={cn('text-muted text-sm')}>
                            Need a refund? If you're unsatisfied, you can request a refund within 60 days of
                            purchase. Simply{' '}
                            <a
                                className="text-primary font-semibold hover:underline"
                                href={`mailto:sample@example.com?subject=Refund Request&body=Hello,%0D%0A%0D%0AI would like to request a refund for my credits.%0D%0A%0D%0AHere are my details:%0D%0A%0D%0AName: ${profile?.full_name}%0D%0AEmail: ${profile?.email}%0D%0A%0D%0AReason for Refund:%0D%0A%0D%0A%0D%0A [Please provide a reason for your refund request.] %0D%0A%0D%0A%0D%0AThank you for your assistance.`}
                            >
                                reach out to our support team
                            </a>
                            , and we'll handle the process quickly and efficiently.
                        </p>

                        <p className={cn('text-muted text-sm')}>
                            All translations are powered by our state-of-the-art Machine Learning, AI, and OCR
                            technology, ensuring the highest possible accuracy for your scanned documents.
                        </p>
                    </AnimatedDisclosure>
                </div>
            </div>
        </PanelSection>
    );
}
