/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { DefaultCard } from '@/components/ui/card';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Skeleton } from '@components/ui/skeleton';

export default function TranslationReviewSkeleton() {
    const isMobile = useMediaQuery('(max-width: 1024px)');

    return (
        <div className="-mx-4 -mt-6 flex h-[calc(100vh-3.8125rem)] flex-col overflow-hidden sm:-mx-6 lg:-mx-8">
            {/* Sub-header Skeleton */}
            <div className="bg-surface-50/95 dark:bg-surface-950/95 border-surface-200 dark:border-surface-800 sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b px-4 backdrop-blur-sm sm:px-6 lg:px-8">
                {/* Left: Original Document Toggle */}
                <div className="flex items-center gap-3">
                    <Skeleton className="hidden h-9 w-44 rounded-lg lg:block" />
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3">
                    {/* Status Badge */}
                    <Skeleton className="h-5 w-24 rounded-full" />

                    <div className="bg-surface-200 dark:bg-surface-800 mx-1 h-4 w-px" />

                    {/* Preview Button */}
                    <Skeleton className="h-9 w-24 rounded-lg" />

                    {/* Export Button */}
                    <Skeleton className="h-9 w-24 rounded-lg" />

                    {/* Approve Button */}
                    <Skeleton className="h-9 w-40 rounded-lg" />
                </div>
            </div>

            {/* Main Content Area - matches ReviewLayout structure */}
            <div className="bg-surface-100/50 dark:bg-surface-900/50 flex flex-1 flex-col overflow-hidden p-4">
                <DefaultCard className="flex flex-1 flex-col overflow-hidden border-0 bg-transparent p-0 shadow-none">
                    <div className="border-border bg-card flex-1 overflow-hidden rounded-3xl border">
                        {isMobile ? (
                            // Mobile: Tabs layout
                            <div className="flex h-full flex-col">
                                <div className="bg-surface-50/95 dark:bg-surface-950/95 p-4">
                                    <Tabs className="w-full" defaultValue="translation">
                                        <TabsList className="grid h-auto w-full grid-cols-2 gap-2 bg-transparent p-0">
                                            <TabsTrigger
                                                disabled
                                                className="bg-surface-100 dark:bg-surface-800 rounded-xl px-4 py-2 text-sm font-semibold"
                                                value="original"
                                            >
                                                Original
                                            </TabsTrigger>
                                            <TabsTrigger
                                                disabled
                                                className="dark:bg-surface-900 rounded-xl bg-white px-4 py-2 text-sm font-semibold"
                                                value="translation"
                                            >
                                                Translation
                                            </TabsTrigger>
                                        </TabsList>
                                    </Tabs>
                                </div>
                                <div className="dark:bg-surface-950 flex-1 overflow-hidden bg-white">
                                    <EditorSkeleton />
                                </div>
                            </div>
                        ) : (
                            // Desktop: ResizablePanelGroup layout
                            <ResizablePanelGroup className="h-full w-full" direction="horizontal">
                                {/* PDF Panel */}
                                <ResizablePanel defaultSize={30} maxSize={60} minSize={30}>
                                    <div className="bg-surface-1 flex h-full flex-col">
                                        {/* PDF Toolbar Skeleton */}
                                        <div className="border-surface-3 dark:border-surface-800 dark:bg-surface-950 z-10 flex h-14 shrink-0 border-b bg-white">
                                            <div className="flex h-14 w-full items-center justify-between gap-2 px-2 sm:px-4">
                                                {/* Page Navigation */}
                                                <Skeleton className="h-7 w-16 rounded-xl" />

                                                {/* Zoom Controls */}
                                                <div className="bg-surface-2 dark:bg-surface-800 flex items-center gap-1 rounded-xl p-0.5">
                                                    <Skeleton className="h-7 w-7 rounded-lg" />
                                                    <Skeleton className="h-7 w-12 rounded-lg" />
                                                    <Skeleton className="h-7 w-7 rounded-lg" />
                                                </div>

                                                {/* View Options */}
                                                <div className="flex items-center gap-1">
                                                    <Skeleton className="h-8 w-8 rounded-lg" />
                                                    <Skeleton className="h-8 w-8 rounded-lg" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* PDF Content Area */}
                                        <div className="flex-1 overflow-hidden p-4">
                                            <Skeleton className="h-full w-full rounded-xl" />
                                        </div>
                                    </div>
                                </ResizablePanel>

                                {/* Resizable Handle */}
                                <ResizableHandle
                                    withHandle
                                    className="bg-surface-2 hover:bg-surface-3 relative h-full w-1 transition-colors"
                                >
                                    <div className="bg-surface-4 absolute inset-y-0 left-1/2 my-auto h-8 w-1 -translate-x-1/2 rounded-full opacity-50" />
                                </ResizableHandle>

                                {/* Editor Panel */}
                                <ResizablePanel defaultSize={70} maxSize={100} minSize={40}>
                                    <div className="dark:bg-surface-950 h-full bg-white">
                                        <EditorSkeleton />
                                    </div>
                                </ResizablePanel>
                            </ResizablePanelGroup>
                        )}
                    </div>
                </DefaultCard>
            </div>
        </div>
    );
}

// Editor skeleton component for reuse
function EditorSkeleton() {
    return (
        <div className="flex h-full flex-col">
            {/* Editor Toolbar Skeleton */}
            <div className="border-surface-200 dark:border-surface-800 flex flex-wrap items-center gap-1 border-b p-2">
                {/* Text formatting buttons */}
                <div className="flex gap-1">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={`format-${i}`} className="size-8 rounded-md" />
                    ))}
                </div>

                <div className="bg-surface-200 dark:bg-surface-700 mx-2 h-6 w-px" />

                {/* Heading/list buttons */}
                <div className="flex gap-1">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={`heading-${i}`} className="size-8 rounded-md" />
                    ))}
                </div>

                <div className="bg-surface-200 dark:bg-surface-700 mx-2 h-6 w-px" />

                {/* Alignment buttons */}
                <div className="flex gap-1">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={`align-${i}`} className="size-8 rounded-md" />
                    ))}
                </div>

                <div className="bg-surface-200 dark:bg-surface-700 mx-2 h-6 w-px" />

                {/* Action buttons */}
                <div className="flex gap-1">
                    {Array.from({ length: 2 }).map((_, i) => (
                        <Skeleton key={`action-${i}`} className="size-8 rounded-md" />
                    ))}
                </div>
            </div>

            {/* Editor Content Skeleton */}
            <div className="flex-1 overflow-y-auto p-6">
                {/* Simulated document content */}
                <div className="space-y-4">
                    {/* Heading */}
                    <Skeleton className="h-8 w-3/4" />

                    {/* Paragraph 1 */}
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                    </div>

                    {/* Subheading */}
                    <Skeleton className="h-6 w-1/2" />

                    {/* Paragraph 2 */}
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-4/5" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>

                    {/* List-like items */}
                    <div className="space-y-2 pl-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={`list-${i}`} className="flex items-center gap-2">
                                <Skeleton className="size-2 rounded-full" />
                                <Skeleton className="h-4 w-4/5" />
                            </div>
                        ))}
                    </div>

                    {/* Another paragraph */}
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-11/12" />
                    </div>

                    {/* Table-like structure */}
                    <div className="space-y-1">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={`table-${i}`} className="flex gap-2">
                                <Skeleton className="h-4 w-1/4" />
                                <Skeleton className="h-4 w-3/4" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Editor Footer / Auto-save Indicator */}
            <div className="border-surface-200 dark:border-surface-800 flex items-center justify-between border-t px-4 py-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
            </div>
        </div>
    );
}
