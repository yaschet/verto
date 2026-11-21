/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { HouseSimpleIcon, ShoppingCartSimpleIcon, XIcon } from '@phosphor-icons/react';
import Link from 'next/link';
import { Button } from '@components/ui/button';
import { cn } from '@library/utils';

export default function CheckoutCanceledPage() {
    return (
        <main className="container flex w-full flex-1 flex-col items-center justify-center">
            <div className="flex w-full max-w-xl flex-col items-center justify-center text-center">
                <div className="mb-5 flex flex-col items-center justify-center gap-3">
                    <div className="bg-accent-100 dark:bg-accent-900 mb-3 flex size-16 items-center justify-center rounded-full">
                        <XIcon className="text-accent dark:text-accent size-8" weight="duotone" />
                    </div>
                    <h1
                        className={cn(
                            'text-surface-900 max-w-lg text-center text-3xl leading-tight font-black tracking-tighter md:text-5xl dark:text-white',
                            'overflow-wrap-anywhere text-pretty break-words',
                        )}
                    >
                        Checkout Canceled
                    </h1>
                    <p className="text-surface-600 dark:text-surface-400 text-center font-medium break-words">
                        <span>
                            <strong>You cancelled the checkout process.</strong> If you have any questions or
                            need assistance, please contact our{' '}
                            <a
                                className="text-info-500 dark:text-info-400 font-semibold hover:underline"
                                href="mailto:sample@example.com"
                                rel="noopener noreferrer"
                                target="_blank"
                            >
                                Support Team
                            </a>
                        </span>
                    </p>
                </div>

                <div className="mt-10 flex w-full flex-wrap items-center justify-between gap-2">
                    <Button
                        asChild
                        className="flex flex-1 items-center justify-center"
                        color="accent"
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
                            <span className="mr-2 text-base font-semibold">Top Up Credits</span>
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
                            <span className="text-base font-semibold">Dashboard</span>
                        </Link>
                    </Button>
                </div>
            </div>
        </main>
    );
}
