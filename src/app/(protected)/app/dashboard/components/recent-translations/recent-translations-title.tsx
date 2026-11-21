/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { ClockIcon, TableIcon, TranslateIcon } from '@phosphor-icons/react';
import Link from 'next/link';
import { SectionTitle } from '@app/(protected)/app/components/common';
import { Button } from '@components/ui/button';

export function RecentTranslationsTitle() {
    return (
        <SectionTitle icon={ClockIcon} title="Recent Translations">
            <Button
                asChild
                className="flex items-center justify-center"
                color="primary"
                size="md"
                variant="soft"
            >
                <Link
                    href={{
                        pathname: '/app/translations',
                    }}
                >
                    <TableIcon className="size-5" color="currentColor" weight="duotone" />
                    <span className="sr-only md:not-sr-only md:block">View All</span>
                </Link>
            </Button>
            <Button
                asChild
                color="primary"
                size="md"
                tooltipContent="Start a New Translation"
                variant="solid"
            >
                <Link
                    href={{
                        pathname: '/app/translations/new',
                    }}
                >
                    <TranslateIcon className="size-5" color="currentColor" weight="duotone" />
                    <span className="sr-only md:not-sr-only md:block">Translate</span>
                </Link>
            </Button>
        </SectionTitle>
    );
}
