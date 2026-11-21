/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { HouseSimple } from '@phosphor-icons/react/dist/ssr/HouseSimple';
import { ShoppingCartSimple } from '@phosphor-icons/react/dist/ssr/ShoppingCartSimple';
import Link from 'next/link';
import { Button } from '@components/ui/button';
import Spinner from '@components/ui/spinner';
import { cn } from '@library/utils';

export default function CheckoutSuccessLoading() {
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
                            <ShoppingCartSimple className="size-5" color="currentColor" weight="duotone" />
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
                            <HouseSimple className="size-5" color="currentColor" weight="duotone" />
                            <span className="text-base font-semibold">Go to Dashboard</span>
                        </Link>
                    </Button>
                </div>
            </div>
        </main>
    );
}
