/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import {
    ArrowArcLeftIcon,
    ArrowsClockwiseIcon,
    HouseSimpleIcon,
    WarningDiamondIcon,
} from '@phosphor-icons/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next-nprogress-bar';
import React from 'react';
import { titleCase } from 'title-case';
import BackButton from '@components/common/back-button';
import ThemeDropdown from '@components/layout/core/theme-dropdown';
import { UserMenu } from '@components/layout/user-menu';
import { Button } from '@components/ui/button';
import { useUserData } from '@hooks/queries/auth/use-user-data';
import { cn } from '@library/utils';
import { Logo } from '@components/ui/logo';
import type { ApiErrorType } from '@/types/rest/errors';

export default function Error({ error, reset }: { error: ApiErrorType; reset: () => void }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const errorCode = searchParams.get('error_code');
    const errorMessage = searchParams.get('error_message');
    const errorDescription = searchParams.get('error_description');

    const defaultMessage = <span>The request could not be completed. Please try again.</span>;

    const getErrorMessage = (): string | React.JSX.Element => {
        const message = errorDescription ?? error.description ?? defaultMessage;
        return typeof message === 'string' ? message : message;
    };

    const { data: userData } = useUserData();
    const { user } = userData ?? {};

    return (
        <div className="mx-auto flex min-h-screen w-full flex-col justify-between">
            {/* Logo Header */}
            <div className="container mx-auto flex h-auto w-full flex-row items-center justify-between py-5 text-center md:px-20">
                <div className="flex flex-1 flex-row items-center justify-start gap-3">
                    <BackButton size="icon-lg" />
                </div>
                <div className="flex h-auto w-full flex-1 items-center justify-center">
                    <Link href="/">
                        <Logo variant="icon" mode="auto" priority size="sm" className="md:hidden" />
                        <Logo variant="full" mode="auto" priority size="md" className="hidden md:block" />
                    </Link>
                </div>
                <div className="flex flex-1 flex-row items-center justify-end gap-3">
                    <ThemeDropdown size="icon-lg" />
                    {user?.id && <UserMenu variant="compact" />}
                </div>
            </div>
            <main className="container mx-auto flex w-full flex-1 flex-col items-center justify-center">
                <div className="mx-auto flex w-full max-w-xl flex-col items-center justify-center text-center">
                    <div className="mb-5 flex flex-col items-center justify-center gap-3">
                        <div className="bg-destructive-50 dark:bg-destructive-950 mb-3 flex size-16 items-center justify-center rounded-full">
                            <WarningDiamondIcon
                                className="text-destructive dark:text-destructive size-8"
                                weight="duotone"
                            />
                        </div>
                        <p
                            className={cn(
                                'text-destructive text-base font-semibold break-words',
                                'overflow-wrap-anywhere text-pretty break-words',
                            )}
                        >
                            {errorCode ?? error.code ?? 'UNEXPECTED_FAILURE'}
                        </p>
                        <h1
                            className={cn(
                                'text-surface-900 max-w-lg text-center text-3xl leading-tight font-black tracking-tighter md:text-5xl dark:text-white',
                                'overflow-wrap-anywhere text-pretty break-words',
                            )}
                        >
                            {titleCase(errorMessage ?? error.title ?? error.message ?? 'Unexpected Failure')}
                        </h1>
                        <p className="text-surface-600 dark:text-surface-400 text-center font-medium break-words">
                            {getErrorMessage()}
                        </p>
                    </div>

                    <div className="mt-10 flex w-full flex-wrap items-center justify-between gap-2">
                        <Button
                            className="flex flex-1 items-center justify-center"
                            color="destructive"
                            shape="pill"
                            size="xl"
                            type="button"
                            variant="soft"
                            onClick={() => {
                                router.back();
                            }}
                        >
                            <ArrowArcLeftIcon className="size-5" color="currentColor" weight="duotone" />
                            <span className="mr-2 text-base font-semibold">Previous Page</span>
                        </Button>
                        <Button
                            className="flex flex-1 items-center justify-center"
                            color="destructive"
                            shape="pill"
                            size="xl"
                            type="button"
                            variant="soft"
                            onClick={() => {
                                reset();
                            }}
                        >
                            <ArrowsClockwiseIcon className="size-5" color="currentColor" weight="duotone" />
                            <span className="text-base font-semibold">Retry</span>
                        </Button>
                        <Button
                            asChild
                            className="flex flex-1 items-center justify-center"
                            color="destructive"
                            shape="pill"
                            size="xl"
                            type="button"
                            variant="solid"
                        >
                            <Link href="/">
                                <HouseSimpleIcon className="size-5" color="currentColor" weight="duotone" />
                                <span className="text-base font-semibold">Go Home</span>
                            </Link>
                        </Button>
                    </div>
                </div>
            </main>
            <footer className="text-muted mx-auto w-full px-6 py-4 text-center text-sm leading-7 sm:py-8 lg:px-8">
                Need Assistance? Our{' '}
                <a
                    className="text-info-500 dark:text-info-400 font-semibold hover:underline"
                    href="mailto:sample@example.com"
                    rel="noopener noreferrer"
                    target="_blank"
                >
                    Support Team
                </a>{' '}
                is standing by. Don't hesitate to reach out if you need help.
            </footer>
        </div>
    );
}
