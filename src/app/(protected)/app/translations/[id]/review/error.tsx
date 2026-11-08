/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { ArrowClockwiseIcon, ArrowLeftIcon, WarningIcon } from '@phosphor-icons/react';
import Link from 'next/link';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DefaultCard } from '@/components/ui/card';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Translation review error:', error);
    }, [error]);

    return (
        <div className="flex w-full max-w-full flex-col gap-7 p-6">
            <div className="flex items-center gap-4">
                <Link
                    className="text-surface-500 hover:text-foreground flex items-center gap-2 transition-colors"
                    href="/app/translations"
                >
                    <ArrowLeftIcon className="size-5" />
                    <span>Back to Translations</span>
                </Link>
            </div>

            <DefaultCard className="flex h-[600px] flex-col items-center justify-center gap-6">
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="bg-destructive/10 rounded-full p-3">
                        <WarningIcon className="text-destructive size-10" />
                    </div>
                    <div>
                        <h2 className="mb-2 text-2xl font-bold">Something went wrong!</h2>
                        <p className="text-surface-500 max-w-md">
                            We encountered an error while loading the translation review. This might be a
                            service issue. Please try again.
                        </p>
                        {error.message && (
                            <p className="text-surface-400 mt-2 font-mono text-sm">{error.message}</p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button className="gap-2" color="primary" variant="solid" onClick={() => reset()}>
                        <ArrowClockwiseIcon className="size-4" />
                        Try again
                    </Button>
                    <Link href="/app/translations">
                        <Button color="secondary" variant="soft">
                            Go to Translations
                        </Button>
                    </Link>
                </div>
            </DefaultCard>
        </div>
    );
}
