/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { SectionTitle } from '@app/(protected)/app/components/common';
import { AppTranslateIcon } from '@app/(protected)/app/translations/new/components/create-translation-form';
import { DefaultCard } from '@components/ui/card';
import { Skeleton } from '@components/ui/skeleton';

export default async function TranslatePageSuspense() {
    return (
        <div className="container mx-auto flex h-full w-full max-w-2xl flex-col items-start justify-start gap-6">
            <div className="flex w-full max-w-full flex-col items-start justify-start gap-3">
                <SectionTitle
                    icon={AppTranslateIcon}
                    isLoading={true}
                    title="Translate Your Scanned Document"
                ></SectionTitle>
            </div>
            <DefaultCard className="relative flex h-auto w-full flex-col items-start justify-start gap-4">
                <div className="flex w-full flex-col gap-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/3" />
                </div>
                <div className="flex w-full flex-col items-center justify-center gap-5">
                    <div className="flex w-full flex-col items-start justify-start gap-2">
                        <div className="flex w-full flex-col gap-3">
                            <Skeleton className="h-5 w-1/2" />
                            <div className="w-full">
                                <Skeleton className="h-12 w-full" />
                            </div>
                            <div className="flex w-full flex-col gap-2">
                                <Skeleton className="h-3 w-full" />
                                <Skeleton className="h-3 w-1/3" />
                            </div>
                        </div>
                        <div className="flex w-full flex-col gap-3">
                            <Skeleton className="h-5 w-1/2" />
                            <div className="w-full">
                                <Skeleton className="h-12 w-full" />
                            </div>
                            <div className="flex w-full flex-col gap-2">
                                <Skeleton className="h-3 w-full" />
                                <Skeleton className="h-3 w-1/3" />
                            </div>
                        </div>
                        <div className="flex w-full flex-col gap-3">
                            <Skeleton className="h-5 w-1/2" />
                            <div className="w-full">
                                <Skeleton className="h-12 w-full" />
                            </div>
                            <div className="flex w-full flex-col gap-2">
                                <Skeleton className="h-3 w-full" />
                                <Skeleton className="h-3 w-1/3" />
                            </div>
                        </div>

                        <div className="flex w-full flex-col gap-3 md:flex-row">
                            <div className="flex w-full flex-col gap-3">
                                <Skeleton className="h-5 w-1/2" />
                                <div className="w-full">
                                    <Skeleton className="h-12 w-full" />
                                </div>
                                <div className="flex w-full flex-col gap-2">
                                    <Skeleton className="h-3 w-full" />
                                    <Skeleton className="h-3 w-1/3" />
                                </div>
                            </div>
                            <div className="flex w-full flex-col gap-3">
                                <Skeleton className="h-5 w-1/2" />
                                <div className="w-full">
                                    <Skeleton className="h-12 w-full" />
                                </div>
                                <div className="flex w-full flex-col gap-2">
                                    <Skeleton className="h-3 w-full" />
                                    <Skeleton className="h-3 w-1/3" />
                                </div>
                            </div>
                        </div>
                        <div className="flex w-full flex-col gap-3">
                            <Skeleton className="h-5 w-1/2" />
                            <div className="bg-surface relative flex h-full min-h-40 flex-col items-center justify-center rounded-xl p-4">
                                <Skeleton className="h-6 w-64 max-w-full" variant="rectangular" />
                            </div>
                        </div>
                    </div>
                    <div className="mt-2 flex w-full flex-row items-stretch justify-end gap-3">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                </div>
            </DefaultCard>
        </div>
    );
}
