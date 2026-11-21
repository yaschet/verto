/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { WarningIcon, XIcon } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { Button } from '@components/ui/button';
import { cn } from '@library/utils';

/**
 * Banner displayed when the app is running in degraded mode (Supabase connection issues).
 * Checks for X-Auth-Degraded header and shows a warning to users.
 */
export function DegradedModeBanner() {
    const [isDegraded, setIsDegraded] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Check if we're in degraded mode by looking for the header
        const checkDegradedMode = async () => {
            try {
                const response = await fetch(window.location.href, { method: 'HEAD' });
                const degradedHeader = response.headers.get('X-Auth-Degraded');
                setIsDegraded(degradedHeader === 'true');
            } catch {
                // If HEAD request fails, assume normal mode
                setIsDegraded(false);
            }
        };

        checkDegradedMode();

        // Check periodically (every 30 seconds)
        const interval = setInterval(checkDegradedMode, 30000);
        return () => clearInterval(interval);
    }, []);

    if (!isDegraded || dismissed) {
        return null;
    }

    return (
        <div
            className={cn(
                'fixed top-0 right-0 left-0 z-50',
                'bg-warning-100 dark:bg-warning-900/30',
                'border-warning-300 dark:border-warning-700 border-b',
                'px-4 py-3',
                'animate-in slide-in-from-top duration-300',
            )}
        >
            <div className="container mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <WarningIcon
                        className="text-warning-700 dark:text-warning-400 size-5 flex-shrink-0"
                        weight="duotone"
                    />
                    <div className="flex flex-col gap-0.5">
                        <p className="text-warning-900 dark:text-warning-100 text-sm font-semibold">
                            Limited Functionality
                        </p>
                        <p className="text-warning-700 dark:text-warning-300 text-xs">
                            Some features may be temporarily unavailable. We're working to restore full
                            service.
                        </p>
                    </div>
                </div>
                <Button
                    className="flex-shrink-0"
                    color="warning"
                    shape="pill"
                    size="icon-sm"
                    type="button"
                    variant="plain"
                    onClick={() => setDismissed(true)}
                >
                    <XIcon className="size-4" weight="bold" />
                    <span className="sr-only">Dismiss banner</span>
                </Button>
            </div>
        </div>
    );
}
