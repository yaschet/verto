/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { UserCircleIcon } from '@phosphor-icons/react';
import { capitalCase } from 'change-case';
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar';
import { Badge } from '@/src/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/src/components/ui/tooltip';
import { generateGravatarUrl } from '@/src/library/utils';

type CustomerBadgeProps = {
    customerName: string | null;
    customerEmail: string | null;
};

export function CustomerBadge({ customerName, customerEmail }: CustomerBadgeProps) {
    if (!customerName || !customerEmail) {
        return (
            <Badge className="gap-1.5" color="secondary" variant="soft">
                <UserCircleIcon className="size-4" weight="duotone" />
                <span>No Customer</span>
            </Badge>
        );
    }

    const displayName = capitalCase(customerName);
    const avatarUrl = generateGravatarUrl(customerEmail);

    return (
        <TooltipProvider>
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                    <span className="inline-flex cursor-pointer">
                        <Badge
                            className="gap-1.5 hover:bg-primary-200 dark:hover:bg-primary-900 transition-colors"
                            color="primary"
                            variant="soft"
                        >
                            <UserCircleIcon className="size-4" weight="duotone" />
                            <span>{displayName}</span>
                        </Badge>
                    </span>
                </TooltipTrigger>
                <TooltipContent
                    className="p-0 overflow-hidden border-none bg-transparent shadow-none"
                    side="bottom"
                >
                    <div className="flex items-center gap-3 rounded-xl bg-surface-100 p-3 shadow-xl dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
                        <Avatar className="size-10 border border-surface-200 dark:border-surface-700">
                            <AvatarImage alt={displayName} src={avatarUrl} />
                            <AvatarFallback name={displayName} />
                        </Avatar>
                        <div className="flex flex-col">
                            <p className="text-sm font-semibold leading-none text-foreground">
                                {displayName}
                            </p>
                            <p className="text-xs font-medium text-surface-500">{customerEmail}</p>
                        </div>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
