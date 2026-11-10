/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { ProhibitIcon, EnvelopeIcon, ArrowLeftIcon } from '@phosphor-icons/react';
import Link from 'next/link';
import { Button } from '@components/ui/button';
import { useEffect, useState } from 'react';

export default function SuspendedPage() {
    const [referenceId, setReferenceId] = useState<string>('');

    useEffect(() => {
        setReferenceId(new Date().getTime().toString(36).toUpperCase());
    }, []);

    return (
        <div className="flex w-full flex-col items-center justify-center gap-2">
            <div className="flex w-full flex-col items-center justify-center gap-5">
                <div className="mb-5 flex flex-col items-center justify-center gap-3">
                    <div className="bg-destructive-100 dark:bg-destructive-900/30 mb-3 flex size-16 items-center justify-center rounded-full">
                        <ProhibitIcon
                            className="text-destructive-500 dark:text-destructive-400 size-8"
                            weight="duotone"
                        />
                    </div>
                    <h1 className="text-surface-900 text-center text-3xl leading-tight font-bold tracking-tight md:text-4xl dark:text-white">
                        Account Suspended
                    </h1>
                    <p className="text-surface-600 dark:text-surface-400 max-w-md text-center font-medium">
                        Your account has been suspended by an administrator. Access to the platform services.
                    </p>
                </div>

                <div className="flex w-full max-w-sm flex-col gap-3">
                    <Button className="w-full" color="primary" variant="solid" size="lg" asChild>
                        <a href="mailto:sample@example.com">
                            <EnvelopeIcon className="size-5" weight="duotone" /> Contact Support
                        </a>
                    </Button>

                    <Button className="w-full" color="secondary" variant="soft" size="lg" asChild>
                        <Link href="/auth/sign-in">
                            <ArrowLeftIcon className="size-5" /> Back to Sign In
                        </Link>
                    </Button>
                </div>

                {referenceId && (
                    <p className="text-surface-500 dark:text-surface-600 mt-4 text-xs">
                        Reference ID: {referenceId}
                    </p>
                )}
            </div>
        </div>
    );
}
