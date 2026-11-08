/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { PanelSection } from '@/src/app/(protected)/account/components/shared/panel-section';
import { Skeleton } from '@/src/components/ui/skeleton';
import AccountLayout from '@app/(protected)/account/layout/account-layout';

function getRandomWidth(min: number, max: number) {
    return `${Math.floor(Math.random() * (max - min + 1)) + min}%`;
}

function getRandomCount(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function LoadingPage() {
    const panelSectionCount = getRandomCount(2, 6);

    return (
        <AccountLayout>
            <div className="flex w-full max-w-screen-lg flex-col gap-6 py-6">
                <ul className="flex w-full flex-col items-start justify-start gap-12">
                    {Array.from({ length: panelSectionCount }).map((_0, index) => (
                        <PanelSection
                            key={index}
                            description={
                                <div className="mt-3 flex w-full flex-col gap-2">
                                    {[...Array(getRandomCount(1, 3))].map((_1, innerIndex) => (
                                        <Skeleton
                                            key={innerIndex}
                                            className="h-4"
                                            style={{ width: getRandomWidth(80, 100) }}
                                        />
                                    ))}
                                </div>
                            }
                            title={<Skeleton className="h-6" style={{ width: getRandomWidth(30, 70) }} />}
                        >
                            <div className="flex w-full flex-col gap-4">
                                <div className="flex w-full flex-row gap-6">
                                    <div className="flex w-full flex-col gap-6">
                                        <Skeleton className="h-4" style={{ width: getRandomWidth(20, 50) }} />
                                        <div className="flex w-full flex-col gap-3">
                                            {[...Array(getRandomCount(1, 3))].map((_2, subIndex1) => (
                                                <Skeleton
                                                    key={subIndex1}
                                                    className="h-4"
                                                    style={{ width: getRandomWidth(80, 100) }}
                                                />
                                            ))}
                                        </div>
                                        <div className="flex w-full flex-col gap-3">
                                            {[...Array(getRandomCount(1, 3))].map((_3, subIndex2) => (
                                                <Skeleton
                                                    key={subIndex2}
                                                    className="h-10"
                                                    style={{ width: getRandomWidth(80, 100) }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </PanelSection>
                    ))}
                </ul>
            </div>
        </AccountLayout>
    );
}
