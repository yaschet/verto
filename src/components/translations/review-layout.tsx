/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { useMutation } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { PdfSkeleton } from './pdf-skeleton';

// Dynamically import DocumentViewer with SSR disabled to avoid DOMMatrix error
const DocumentViewer = dynamic(
    () => import('./document-viewer').then((mod) => ({ default: mod.DocumentViewer })),
    {
        ssr: false,
        loading: () => <PdfSkeleton />,
    },
);
import { approveTranslation } from '@/actions/services/translations/approve-translation';
import { downloadTranslatedPdf } from '@/actions/services/translations/download-translated-pdf';
import { saveReviewDraft } from '@/actions/services/translations/save-review-draft';

import { TranslationEditor } from '@/components/translations/translation-editor';
import { DefaultCard } from '@/components/ui/card';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMediaQuery } from '@/hooks/use-media-query';
import { cn } from '@/library/utils';
import type { TranslationStatus } from '@/schemas/translation-schemas';
import { getTextDirection } from '@/constants/translations';
import { normalizeContentForRTL } from '@/utils/rtl-utils';
import type { JSONContent } from '@tiptap/react';
import type { ImperativePanelHandle } from 'react-resizable-panels';

type ReviewLayoutProps = {
    translationId: string;
    pdfUrl: string;
    initialContent: JSONContent | null;
    originalContent?: JSONContent | null;
    status: TranslationStatus;
    displayName: string | null;
    targetLanguage: string;
    sourceLanguage: string;

    onDownload?: () => void;
    onApprove?: () => void;
    isPdfCollapsed?: boolean;
};

export function ReviewLayout({
    initialContent,
    isPdfCollapsed = false,
    onApprove: onApproveProp,
    originalContent,
    pdfUrl,
    status,
    targetLanguage,
    translationId,
}: ReviewLayoutProps) {
    const router = useRouter();
    const isRTL = getTextDirection(targetLanguage) === 'rtl';

    // Normalize content for RTL if needed (swap left/right alignments)
    // This runs once on mount/initialization to ensure data matches visual expectation
    const [content, setContent] = useState<JSONContent | null>(
        isRTL ? normalizeContentForRTL(initialContent) : initialContent,
    );

    // Reset handler - restores editor to original machine translation
    const handleReset = useCallback(() => {
        if (originalContent) {
            setContent(originalContent);
        }
    }, [originalContent]);
    const [lastSavedContent, setLastSavedContent] = useState<JSONContent | null>(initialContent);
    const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);

    const [isResizing, setIsResizing] = useState(false);

    // Refs for cleanup access (avoid stale closure in useEffect cleanup)
    const contentRef = useRef(content);
    const lastSavedContentRef = useRef(lastSavedContent);

    // PDF Panel constants
    const PDF_MIN_WIDTH = 30;
    const PDF_MAX_WIDTH = 60;
    const PDF_DEFAULT_WIDTH = PDF_MIN_WIDTH;

    const [panelSizes, setPanelSizes] = useState<number[]>([PDF_DEFAULT_WIDTH, 100 - PDF_DEFAULT_WIDTH]);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const pdfPanelRef = useRef<ImperativePanelHandle>(null);
    const isMobile = useMediaQuery('(max-width: 1024px)');

    // Handle collapse/expand based on prop
    useEffect(() => {
        const panel = pdfPanelRef.current;
        if (panel) {
            if (isPdfCollapsed) {
                panel.collapse();
            } else {
                panel.expand();
            }
        }
    }, [isPdfCollapsed]);

    // Sync refs when values change (for cleanup access)
    useEffect(() => {
        contentRef.current = content;
    }, [content]);

    useEffect(() => {
        lastSavedContentRef.current = lastSavedContent;
    }, [lastSavedContent]);

    // Load saved panel sizes from localStorage
    useEffect(() => {
        const savedSizes = localStorage.getItem('review-panel-sizes');
        if (savedSizes) {
            try {
                const sizes = JSON.parse(savedSizes);
                setPanelSizes(sizes);
            } catch {
                // Ignore invalid data
            }
        }
    }, []);

    // Auto-save mutation (uses TanStack Query's isPending for loading state)
    const saveMutation = useMutation({
        mutationFn: async (contentToSave: JSONContent) => {
            const result = await saveReviewDraft({
                translationId,
                content: contentToSave,
            });
            if (!('success' in result) || !result.success) {
                throw new Error(result.message || 'Failed to save draft');
            }
            return result.data;
        },
        onSuccess: (data) => {
            setLastSavedContent(contentRef.current);
            setLastSaveTime(new Date(data?.timestamp || new Date()));
        },
        onError: (error: Error) => {
            console.error('Save error:', error);
            toast.error('Failed to save draft: ' + error.message);
        },
    });

    // Use TanStack Query's built-in pending state
    const isSaving = saveMutation.isPending;

    // Approval mutation
    const approveMutation = useMutation({
        mutationFn: async () => {
            // Save any pending changes first
            if (content && JSON.stringify(content) !== JSON.stringify(lastSavedContent)) {
                await saveMutation.mutateAsync(content);
            }

            const result = await approveTranslation({
                translationId,
            });
            if (!('success' in result) || !result.success) {
                throw new Error(result.message || 'Failed to approve translation');
            }
            return result.data;
        },
        onSuccess: () => {
            toast.success('Translation approved! Generating document...');
            setTimeout(() => {
                router.push(`/app/translations/${translationId}`);
            }, 1500);
        },
        onError: (error: Error) => {
            console.error('Approval error:', error);
            toast.error('Failed to approve translation: ' + error.message);
        },
    });

    // Download mutation
    useMutation({
        mutationFn: async () => {
            const result = await downloadTranslatedPdf({
                translationId,
            });
            if (!('success' in result) || !result.success) {
                throw new Error(result.message || 'Failed to download PDF');
            }
            return result.data;
        },
        onSuccess: (data) => {
            if (data?.downloadUrl) {
                window.open(data.downloadUrl, '_blank');
            }
        },
        onError: (error: Error) => {
            console.error('Download error:', error);
            toast.error('Failed to download PDF: ' + error.message);
        },
    });

    // Auto-save with debouncing
    const handleContentChange = useCallback(
        (newContent: JSONContent) => {
            setContent(newContent);

            // Clear existing timeout
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }

            // Set new timeout for auto-save (5 seconds per blueprint spec)
            saveTimeoutRef.current = setTimeout(() => {
                if (JSON.stringify(newContent) !== JSON.stringify(lastSavedContent)) {
                    saveMutation.mutate(newContent);
                }
            }, 5000);
        },
        [lastSavedContent, saveMutation],
    );

    // Handle panel resize
    const handlePanelResize = (sizes: number[]) => {
        // Don't save if collapsed (sizes might be [0, 100])
        if (!isPdfCollapsed) {
            setPanelSizes(sizes);
            // Save to localStorage for persistence
            localStorage.setItem('review-panel-sizes', JSON.stringify(sizes));
        }
    };

    // Clean up timeout on unmount ONLY (not on every content change)
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            // Save pending changes using sendBeacon (survives tab close)
            const currentContent = contentRef.current;
            const savedContent = lastSavedContentRef.current;
            if (currentContent && JSON.stringify(currentContent) !== JSON.stringify(savedContent)) {
                const payload = JSON.stringify({ content: currentContent });
                navigator.sendBeacon(
                    `/api/translations/${translationId}/save-draft`,
                    new Blob([payload], { type: 'application/json' }),
                );
            }
        };
    }, [translationId]); // Only translationId - stable, runs cleanup only on unmount

    // Warn user before closing tab if there are unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            const currentContent = contentRef.current;
            const savedContent = lastSavedContentRef.current;
            const hasUnsaved =
                currentContent && JSON.stringify(currentContent) !== JSON.stringify(savedContent);

            if (hasUnsaved) {
                // Modern browsers ignore custom messages, but this triggers the dialog
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
                return e.returnValue;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    const isEditable = status === 'ready' || status === 'completed';

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd/Ctrl + S to save
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                const currentContent = contentRef.current;
                const savedContent = lastSavedContentRef.current;

                if (currentContent && JSON.stringify(currentContent) !== JSON.stringify(savedContent)) {
                    saveMutation.mutate(currentContent);
                    toast.info('Saving...');
                } else {
                    toast.success('All changes saved');
                }
            }

            // Cmd/Ctrl + Enter to approve
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                if (onApproveProp && isEditable && !approveMutation.isPending) {
                    onApproveProp();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [saveMutation, approveMutation, onApproveProp, isEditable]);

    const _isApproving = approveMutation.isPending;
    const hasUnsavedChanges =
        content !== null && JSON.stringify(content) !== JSON.stringify(lastSavedContent);
    const [activeTab, setActiveTab] = useState<string>('translation');

    // Mobile layout with tabs
    if (isMobile) {
        return (
            <div className="flex h-full flex-col p-2">
                <DefaultCard className="flex flex-1 flex-col overflow-hidden border-0 bg-transparent p-0 shadow-none">
                    <div className="border-border bg-card flex-1 overflow-hidden rounded-3xl border">
                        <Tabs className="flex h-full flex-col" value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="bg-surface-50/95 dark:bg-surface-950/95 grid h-auto w-full grid-cols-2 gap-2 rounded-none rounded-t-3xl p-4">
                                <TabsTrigger
                                    className="dark:data-[state=active]:bg-surface-900 rounded-xl px-4 py-2 text-sm font-semibold transition-all data-[state=active]:bg-white"
                                    value="original"
                                >
                                    Original
                                </TabsTrigger>
                                <TabsTrigger
                                    className="dark:data-[state=active]:bg-surface-900 rounded-xl px-4 py-2 text-sm font-semibold transition-all data-[state=active]:bg-white"
                                    value="translation"
                                >
                                    Translation
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent className="m-0 flex-1 overflow-hidden" value="original">
                                <DocumentViewer
                                    className="h-full"
                                    fileUrl={pdfUrl}
                                    isCollapsed={false}
                                    isResizing={false}
                                />
                            </TabsContent>

                            <TabsContent className="m-0 flex-1 overflow-hidden" value="translation">
                                <div className="dark:bg-surface-950 h-full bg-white">
                                    <TranslationEditor
                                        editable={isEditable}
                                        hasUnsavedChanges={hasUnsavedChanges}
                                        initialContent={content}
                                        isSaving={isSaving}
                                        lastSaveTime={lastSaveTime}
                                        originalContent={originalContent}
                                        onChange={handleContentChange}
                                        onReset={handleReset}
                                        direction={getTextDirection(targetLanguage)}
                                    />
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </DefaultCard>
            </div>
        );
    }

    // Desktop layout with resizable panels
    return (
        <div className="flex h-full flex-col p-4">
            <DefaultCard className="flex flex-1 flex-col overflow-hidden border-0 bg-transparent p-0 shadow-none">
                <div className="border-border bg-card flex-1 overflow-hidden rounded-3xl border">
                    <ResizablePanelGroup
                        className="h-full w-full"
                        direction="horizontal"
                        onLayout={handlePanelResize}
                    >
                        {/* PDF Panel */}
                        <ResizablePanel
                            ref={pdfPanelRef}
                            className={cn(
                                'bg-surface-1 transition-all duration-300 ease-in-out',
                                isPdfCollapsed && !isMobile && 'hidden lg:block lg:w-0 lg:flex-none',
                                // Disable transition during resizing to prevent lag
                                isResizing && 'transition-none',
                            )}
                            collapsedSize={0}
                            collapsible={true}
                            defaultSize={isMobile ? 40 : panelSizes[0]}
                            maxSize={isMobile ? 60 : PDF_MAX_WIDTH}
                            minSize={isMobile ? 20 : PDF_MIN_WIDTH}
                        >
                            <div className="relative h-full w-full">
                                <DocumentViewer
                                    className={cn('h-full', isPdfCollapsed && 'hidden')}
                                    fileUrl={pdfUrl}
                                    isCollapsed={isPdfCollapsed}
                                    isResizing={isResizing}
                                />
                                {isResizing && <div className="absolute inset-0 z-50 bg-transparent" />}
                            </div>
                        </ResizablePanel>

                        {/* Resizable Handle */}
                        {!isPdfCollapsed && (
                            <ResizableHandle
                                withHandle
                                className={cn(
                                    'bg-surface-2 hover:bg-surface-3 transition-colors',
                                    'relative',
                                    isMobile ? 'h-1 w-full' : 'h-full w-1',
                                )}
                                onDoubleClick={() => {
                                    if (pdfPanelRef.current) {
                                        // Toggle between min width and 45%
                                        const currentSize = panelSizes[0];
                                        if (currentSize <= PDF_MIN_WIDTH + 2) {
                                            pdfPanelRef.current.resize(45);
                                        } else {
                                            pdfPanelRef.current.resize(PDF_MIN_WIDTH);
                                        }
                                    }
                                }}
                                onDragging={setIsResizing}
                            >
                                <div
                                    className={cn(
                                        'bg-surface-4 absolute flex items-center rounded-full opacity-50',
                                        isMobile
                                            ? 'inset-x-0 top-1/2 mx-auto h-1 w-8 -translate-y-1/2'
                                            : 'inset-y-0 left-1/2 my-auto h-8 w-1 -translate-x-1/2',
                                    )}
                                />
                            </ResizableHandle>
                        )}

                        {/* Editor Panel */}
                        <ResizablePanel
                            className="dark:bg-surface-950 bg-white"
                            defaultSize={isMobile ? 60 : panelSizes[1]}
                            maxSize={100}
                            minSize={20}
                        >
                            <div className="flex h-full flex-col">
                                <TranslationEditor
                                    editable={isEditable}
                                    hasUnsavedChanges={hasUnsavedChanges}
                                    initialContent={content}
                                    isSaving={isSaving}
                                    lastSaveTime={lastSaveTime}
                                    originalContent={originalContent}
                                    onChange={handleContentChange}
                                    onReset={handleReset}
                                    direction={getTextDirection(targetLanguage)}
                                />
                            </div>
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </div>
            </DefaultCard>
        </div>
    );
}
