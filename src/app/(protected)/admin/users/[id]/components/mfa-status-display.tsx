/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { Badge } from '@components/ui/badge';
import { ShieldCheckIcon, ShieldSlashIcon } from '@phosphor-icons/react';
import { adminListUserMfaFactors } from '@actions/admin/users/manage-mfa';
import { cn } from '@library/utils';

interface MfaStatusDisplayProps {
    userId: string;
}

export function MfaStatusDisplay({ userId }: MfaStatusDisplayProps) {
    const { data: response, isLoading } = useQuery({
        queryKey: ['admin', 'user-mfa', userId],
        queryFn: () => adminListUserMfaFactors({ userId }),
    });

    if (isLoading) {
        return <div className="h-8 w-32 animate-pulse bg-surface-100 dark:bg-surface-800 rounded" />;
    }

    const allFactors = response && 'success' in response && response.success ? response.data : [];
    const factors = (allFactors ?? []).filter((f) => f.status === 'verified');
    const hasFactors = factors.length > 0;

    return (
        <div
            className={cn(
                'flex items-center gap-2 rounded-lg transition-all duration-150',
                'px-2 py-1.5 -mx-2 -my-1.5',
                'hover:bg-surface-100/80 dark:hover:bg-surface-800/50',
            )}
        >
            {hasFactors ? (
                <>
                    <Badge variant="soft" color="success" className="gap-1.5 pl-1.5">
                        <ShieldCheckIcon className="size-4" weight="fill" />
                        {factors.length} factor{factors.length > 1 ? 's' : ''} enrolled
                    </Badge>
                    <span className="text-xs text-surface-500">
                        ({factors.map((f) => f.friendly_name || 'Authenticator').join(', ')})
                    </span>
                </>
            ) : (
                <Badge variant="soft" color="secondary" className="gap-1.5 pl-1.5">
                    <ShieldSlashIcon className="size-4" />
                    Not enabled
                </Badge>
            )}
        </div>
    );
}
