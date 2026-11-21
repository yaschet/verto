/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import {
    ArrowArcLeftIcon,
    ArrowsCounterClockwiseIcon,
    HouseSimpleIcon,
    WarningDiamondIcon,
} from '@phosphor-icons/react';
import Link from 'next/link';
import { useRouter } from 'next-nprogress-bar';
import { useEffect, useState } from 'react';
import { titleCase } from 'title-case';
import MinimalLayout from '@components/layout/minimal-layout';
import { Button } from '@components/ui/button';
import { useUserData } from '@hooks/queries/auth/use-user-data';
import { cn } from '@library/utils';

type ErrorPageProps = {
    code: string | number;
    message: string;
    description: string;
    status: number | string;
    resetErrorBoundary?: () => void;
};

export function ErrorComponent({ description, message, resetErrorBoundary, status }: ErrorPageProps) {
    const router = useRouter();
    const { data: userData } = useUserData();
    const { user } = userData ?? {};

    const [hasPreviousPage, setHasPreviousPage] = useState(true);

    useEffect(() => {
        if (window.history.length > 2) {
            setHasPreviousPage(true);
        } else {
            setHasPreviousPage(false);
        }
    }, []);

    return (
        <MinimalLayout>
            <main className="container mx-auto flex w-full flex-1 flex-col items-center justify-center">
                <div className="flex w-full flex-col items-center justify-center text-center md:max-w-xl">
                    <div className="mb-5 flex flex-col items-center justify-center gap-3">
                        <div className="bg-surface-100 dark:bg-surface-900 mb-3 flex size-16 items-center justify-center rounded-full">
                            <WarningDiamondIcon
                                className="text-surface-600 dark:text-surface-400 size-8"
                                weight="duotone"
                            />
                        </div>
                        <p className="text-destructive text-base font-semibold">{status}</p>
                        <h1
                            className={cn(
                                'text-surface-900 dark:text-surface-100 w-full text-3xl font-black tracking-tighter sm:text-5xl',
                                'overflow-wrap-anywhere text-pretty break-words',
                            )}
                        >
                            {titleCase(message)}
                        </h1>
                        <p
                            className={cn(
                                'text-surface-600 dark:text-surface-500 w-full text-base leading-7 break-words',
                                'overflow-wrap-anywhere text-pretty break-all',
                            )}
                        >
                            {description}
                        </p>
                    </div>
                    <div className="mt-10 flex w-full flex-wrap items-center justify-between gap-3">
                        {!resetErrorBoundary && hasPreviousPage && (
                            <Button
                                className="flex flex-1 items-center justify-center"
                                color="default"
                                shape="pill"
                                size="xl"
                                variant="soft"
                                onClick={() => router.back()}
                            >
                                <ArrowArcLeftIcon color="currentColor" weight="duotone" />
                                <span className="text-base font-semibold">Previous page</span>
                            </Button>
                        )}
                        {resetErrorBoundary && (
                            <Button
                                className="flex flex-1 items-center justify-center"
                                color="default"
                                shape="pill"
                                size="xl"
                                variant="solid"
                                onClick={resetErrorBoundary}
                            >
                                <ArrowsCounterClockwiseIcon
                                    className="size-5"
                                    color="currentColor"
                                    weight="duotone"
                                />
                                <span className="text-base font-semibold">Try again</span>
                            </Button>
                        )}
                        {!resetErrorBoundary &&
                            (user?.id ? (
                                <Button
                                    asChild
                                    className="flex flex-1 items-center justify-center"
                                    color="default"
                                    shape="pill"
                                    size="xl"
                                    type="button"
                                    variant="solid"
                                >
                                    <Link href="/app/dashboard">
                                        <HouseSimpleIcon color="currentColor" weight="duotone" />
                                        <span className="text-base font-semibold whitespace-nowrap">
                                            Go to Dashboard
                                        </span>
                                    </Link>
                                </Button>
                            ) : (
                                <Button
                                    asChild
                                    className="flex flex-1 items-center justify-center"
                                    color="default"
                                    shape="pill"
                                    size="xl"
                                    type="button"
                                    variant="solid"
                                >
                                    <Link href="/">
                                        <HouseSimpleIcon color="currentColor" weight="duotone" />
                                        <span className="text-base font-semibold whitespace-nowrap">
                                            Go Home
                                        </span>
                                    </Link>
                                </Button>
                            ))}
                    </div>
                    <p className="text-muted mt-6 w-full text-sm leading-7">
                        Please use the navigation buttons above to find your way.
                    </p>
                </div>
            </main>
        </MinimalLayout>
    );
}

export function Error404() {
    return (
        <ErrorComponent
            code="404"
            description="The page you're looking for doesn't exist or may have been moved."
            message="Page Not Found"
            status={404}
        />
    );
}
