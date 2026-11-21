/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { ClockIcon, TableIcon, TranslateIcon } from '@phosphor-icons/react';
import Link from 'next/link';
import { SectionTitle } from '@/src/app/(protected)/app/components/common';
import { LoadingStateTable } from '@/src/app/(protected)/app/components/table-states/loading-table';
import { TRANSLATION_COLUMNS } from '@/src/app/(protected)/app/translations/table/translations-columns';
import { Button } from '@components/ui/button';
import { ScrollArea, ScrollBar } from '@components/ui/scroll-area';

export default function RecentTranslationsSuspense() {
    return (
        <div className="flex w-full max-w-full flex-col gap-7">
            {/* Section for Recent Translations, displaying a data table with a limit of 5 rows. */}
            <div className="flex w-full max-w-full flex-col items-start justify-start gap-3">
                {/* Title of the Section */}
                <SectionTitle icon={ClockIcon} isLoading={true} title="Recent Translations">
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
                {/* Cards */}
                <div className="relative flex h-auto w-full max-w-full flex-row items-center justify-start gap-4">
                    <div className="bg-surface-0 relative flex h-auto w-full max-w-full flex-row items-center justify-start rounded-3xl p-7">
                        <ScrollArea className="flex w-full flex-col gap-2">
                            <LoadingStateTable
                                canSearch={false}
                                columns={TRANSLATION_COLUMNS}
                                fullUiLoading={true}
                                limit={5}
                            />
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                    </div>
                </div>
            </div>
        </div>
    );
}
