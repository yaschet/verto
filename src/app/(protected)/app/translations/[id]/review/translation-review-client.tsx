/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import {
    ArrowLeftIcon,
    ArrowRightIcon,
    ArrowsClockwiseIcon,
    CheckCircleIcon,
    CircleIcon,
    DotsThreeVerticalIcon,
    DownloadSimpleIcon,
    GlobeIcon,
    QuestionIcon,
    SidebarSimple,
    TrashIcon,
    TranslateIcon,
    WarningCircleIcon,
} from '@phosphor-icons/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as countriesFlag from 'country-flag-icons/react/1x1';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { approveTranslation } from '@/actions/services/translations/approve-translation';
import { downloadTranslatedPdf } from '@/actions/services/translations/download-translated-pdf';
import { regenerateDocument } from '@/actions/services/translations/regenerate-document';
import { TranslationErrorState } from '@/app/(protected)/app/translations/[id]/review/components/translation-error-state';
import { TranslationFailedState } from '@/app/(protected)/app/translations/[id]/review/components/translation-failed-state';
import { TranslationProcessingState } from '@/app/(protected)/app/translations/[id]/review/components/translation-processing-state';
import TranslationReviewSkeleton from '@/app/(protected)/app/translations/[id]/review/translation-review-skeleton';
import { ExportDropdown, type ExportStatus } from '@/components/exports/export-dropdown';
import DeleteTranslationModal from '@/app/(protected)/app/translations/modals/delete-translation-modal';

import { ReviewLayout } from '@/components/translations/review-layout';
import { Button } from '@/components/ui/button';
import { DefaultCard } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import { STATUS_MAPPING } from '@/src/app/(protected)/app/translations/table/constants/mappings';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/src/components/ui/tooltip';
import { getLanguageDetails } from '@/src/constants/translations';
import { useTranslationRealtime } from '@/src/hooks/use-translation-realtime';
import { cn } from '@/src/library/utils';
import { translationReviewQueryOptions } from '@/src/queries/tanstack/translations-query-options';
import type { TranslationReviewData } from '@/src/queries/tanstack/translations-query-options';
import type { TranslationStatus } from '@/src/schemas/translation-schemas';
import type { JSONContent } from '@tiptap/react';

type TranslationReviewClientProps = {
    translationId: string;
};

export default function TranslationReviewClient({ translationId }: TranslationReviewClientProps) {
    const router = useRouter();
    const queryClient = useQueryClient();

    // TanStack Query - hydrated from RSC prefetch (no fetch on mount)
    const { data, error, isError, isLoading, refetch } = useQuery(
        translationReviewQueryOptions(translationId),
    );

    // Realtime subscription for live updates (status, progress)
    const realtimeTranslation = useTranslationRealtime(translationId, data?.translation ?? null);

    // Sync realtime updates to query cache
    useEffect(() => {
        if (realtimeTranslation) {
            queryClient.setQueryData<TranslationReviewData>(
                ['translation-review', translationId],
                (cached) =>
                    cached
                        ? {
                              ...cached,
                              translation: realtimeTranslation,
                          }
                        : cached,
            );
        }
    }, [realtimeTranslation, translationId, queryClient]);

    // UI state

    const [, setContent] = useState<JSONContent | null>(null);
    const [isPdfCollapsed, setIsPdfCollapsed] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Load preference and content
    useEffect(() => {
        const saved = localStorage.getItem('review-pdf-collapsed');
        if (saved === 'true') setIsPdfCollapsed(true);
    }, []);

    // Initialize content when data loads
    useEffect(() => {
        if (data?.sanitizedContent) {
            setContent(data.sanitizedContent);
        }
    }, [data?.sanitizedContent]);

    const togglePdfPanel = () => {
        const newState = !isPdfCollapsed;
        setIsPdfCollapsed(newState);
        localStorage.setItem('review-pdf-collapsed', String(newState));
    };

    // Approval mutation with cache invalidation
    const approveMutation = useMutation({
        mutationFn: async () => {
            const result = await approveTranslation({
                translationId,
            });
            if ('error' in result && result.error) {
                throw new Error(result.message || 'Failed to approve translation');
            }
            if (!('success' in result && result.success)) {
                throw new Error(result.message || 'Failed to approve translation');
            }
            return result.data;
        },
        onSuccess: () => {
            // Invalidate both review and details page caches
            queryClient.invalidateQueries({ queryKey: ['translation-review', translationId] });
            queryClient.invalidateQueries({ queryKey: ['translation-detail', translationId] });

            toast.success('Translation approved! Generating document...');
            setTimeout(() => {
                router.push(`/app/translations/${translationId}`);
            }, 1500);
        },
        onError: (err: Error) => {
            console.error('Approval error:', err);
            toast.error('Failed to approve translation: ' + err.message);
        },
    });

    // Download mutation
    const downloadMutation = useMutation({
        mutationFn: async () => {
            const result = await downloadTranslatedPdf({
                translationId,
            });
            if ('error' in result && result.error) {
                throw new Error(result.message || 'Failed to download PDF');
            }
            if (!('success' in result && result.success)) {
                throw new Error(result.message || 'Failed to download PDF');
            }
            return result.data;
        },
        onSuccess: (downloadData) => {
            if (downloadData?.downloadUrl) {
                window.open(downloadData.downloadUrl, '_blank');
            }
        },
        onError: (err: Error) => {
            console.error('Download error:', err);
            toast.error('Failed to download PDF: ' + err.message);
        },
    });

    // Regenerate document mutation with mutable toast
    const regenerateMutation = useMutation({
        mutationFn: async () => {
            const result = await regenerateDocument({
                translationId,
            });
            if ('error' in result && result.error) {
                throw new Error(result.message || 'Failed to regenerate document');
            }
            if (!('success' in result && result.success)) {
                throw new Error(result.message || 'Failed to regenerate document');
            }
            return result.data;
        },
        onMutate: () => {
            // Show loading toast that we'll update on success/error
            return toast.loading('Applying your changes...', {
                description: 'Regenerating document exports',
            });
        },
        onSuccess: (_data, _variables, toastId) => {
            queryClient.invalidateQueries({ queryKey: ['translation-review', translationId] });
            queryClient.invalidateQueries({ queryKey: ['translation-detail', translationId] });
            toast.success('Changes applied!', {
                id: toastId,
                description: 'Your document exports are being updated.',
            });
        },
        onError: (err: Error, _variables, toastId) => {
            console.error('Regeneration error:', err);
            toast.error('Failed to apply changes', {
                id: toastId,
                description: err.message,
            });
        },
    });

    // Loading state (rarely shown due to prefetch)
    if (isLoading) {
        return <TranslationReviewSkeleton />;
    }

    // Error state
    if (isError || !data) {
        return (
            <div className="flex h-screen items-center justify-center p-8">
                <DefaultCard className="flex max-w-md flex-col items-center gap-4 p-8">
                    <WarningCircleIcon className="text-destructive size-12" weight="duotone" />
                    <div className="text-center">
                        <h3 className="text-surface-900 dark:text-surface-100 text-lg font-semibold">
                            Failed to Load Review
                        </h3>
                        <p className="text-surface-500 mt-1 text-sm">
                            {(error as Error)?.message || 'An unexpected error occurred'}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button color="secondary" variant="soft" onClick={() => refetch()}>
                            <ArrowsClockwiseIcon className="mr-2 size-4" />
                            Try Again
                        </Button>
                        <Link href="/app/translations">
                            <Button className="gap-2" color="primary" variant="soft">
                                <ArrowLeftIcon className="size-4" />
                                Back
                            </Button>
                        </Link>
                    </div>
                </DefaultCard>
            </div>
        );
    }

    // Merge: realtime takes priority for translation data
    const translation = realtimeTranslation ?? data.translation;
    const { originalContent, sanitizedContent, signedPdfUrl } = data;

    const translationStatus = (translation.status ?? 'queued') as TranslationStatus;

    // Status categories (consistent with Details page)
    const PROCESSING_STATUSES = [
        'queued',
        'processing',
        'translating',
        'polishing',
        'generating',
        'retrying',
    ];
    const FAILED_STATUSES = ['failed', 'canceled'];

    const isProcessing = PROCESSING_STATUSES.includes(translationStatus);
    const isFailed = FAILED_STATUSES.includes(translationStatus);

    // Failed/Canceled → Show dedicated failed state (red icon, retry option, NO spinner)
    if (isFailed) {
        return (
            <TranslationFailedState
                translation={translation}
                status={translationStatus as 'failed' | 'canceled'}
            />
        );
    }

    // Processing states → Show processing state with status-specific icon
    if (isProcessing) {
        return (
            <TranslationProcessingState
                translation={translation}
                status={translationStatus}
                progress={translation.progress}
            />
        );
    }

    // Check for data errors
    const hasPdfError = !signedPdfUrl && translation.file_url ? true : false;
    const hasTranslationError = !sanitizedContent;

    if (hasPdfError || hasTranslationError) {
        return (
            <TranslationErrorState
                translation={translation}
                hasPdfError={hasPdfError}
                hasTranslationError={hasTranslationError}
            />
        );
    }

    const isEditable = translationStatus === 'ready' || translationStatus === 'completed';
    const isApproving = approveMutation.isPending;
    // Check regeneration state from mutation and realtime status
    const isRegenerating = regenerateMutation.isPending || (translation.status as string) === 'generating';

    // Extract generated_docx from details (type comes from UploadedDocumentUrls)
    const details = translation.details as {
        generated_docx?: import('@utils/gcp/docx/functions/generate-google-doc-and-exports').UploadedDocumentUrls;
        user_edits?: unknown;
        last_edited_at?: string;
    } | null;
    const generatedDocx = details?.generated_docx ?? null;
    const hasUserEdits = !!details?.user_edits;

    // Check for pending changes using source lineage (strict) or timestamp comparison (fallback)
    const lastEditedAt = details?.last_edited_at ? new Date(details.last_edited_at).getTime() : 0;
    const lastGeneratedAt = generatedDocx?.generated_at ? new Date(generatedDocx.generated_at).getTime() : 0;
    const sourceLastEditedAt = generatedDocx?.source_last_edited_at
        ? new Date(generatedDocx.source_last_edited_at).getTime()
        : 0;

    let hasPendingChanges = false;

    if (hasUserEdits && generatedDocx) {
        if (sourceLastEditedAt > 0) {
            // Strict Mode: If we know exactly which version was used, compare matching timestamps
            // If the current last_edited_at is newer/different from the source, it's modified.
            // Note: We use !== to catch ANY divergence, including rollbacks if they generate new timestamps.
            hasPendingChanges = lastEditedAt !== sourceLastEditedAt;
        } else if (lastGeneratedAt > 0) {
            // Timestamp Fallback: If we have generation time but no source lineage
            hasPendingChanges = lastEditedAt > lastGeneratedAt;
        } else {
            hasPendingChanges = true;
        }
    }

    // Extract export_status from translation record (JSONB column)
    const exportStatus =
        ((translation as unknown as { export_status?: unknown }).export_status as ExportStatus) ?? null;

    // Status badge helper
    const getStatusBadge = () => {
        const statusDetails = STATUS_MAPPING[translationStatus] || STATUS_MAPPING.queued;
        const StatusText = statusDetails.label;

        return (
            <div className="flex items-center gap-2">
                <TooltipProvider>
                    <div className="flex items-center gap-1.5">
                        <CircleIcon
                            className={cn(
                                'size-3',
                                statusDetails.className,
                                statusDetails.animate && 'animate-pulse',
                            )}
                            color="currentColor"
                            weight="fill"
                        />
                        <span className="text-foreground text-xs font-semibold">{StatusText}</span>
                        <Tooltip delayDuration={0} disableHoverableContent={false}>
                            <TooltipTrigger asChild>
                                <QuestionIcon
                                    aria-label={statusDetails.tooltipContent}
                                    className="text-muted size-3 cursor-help"
                                    color="currentColor"
                                    weight="duotone"
                                />
                            </TooltipTrigger>
                            <TooltipContent
                                className="max-w-48 p-3 text-xs break-words"
                                side="bottom"
                                sideOffset={5}
                            >
                                <span>
                                    <span className="text-foreground">{statusDetails.label}</span>
                                    {statusDetails.tooltipContent && ' — '}
                                    <i
                                        className={cn(
                                            'text-surface-700 dark:text-surface-300',
                                            statusDetails.tooltipContent ? 'font-normal' : 'font-semibold',
                                        )}
                                    >
                                        {statusDetails.tooltipContent}
                                    </i>
                                </span>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </TooltipProvider>
            </div>
        );
    };

    return (
        <div className="-mx-4 -mt-6 flex h-[calc(100vh-3.8125rem)] flex-col overflow-hidden sm:-mx-6 lg:-mx-8">
            {/* Command Center Header */}
            <div className="bg-surface-50/95 dark:bg-surface-950/95 border-surface-200 dark:border-surface-800 sticky top-0 z-10 h-14 shrink-0 border-b backdrop-blur-sm">
                <ScrollArea className="h-full w-full" orientation="horizontal">
                    <div className="flex h-14 min-w-max items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                        {/* Left: Navigation & File Identity */}
                        <div className="flex items-center gap-3">
                            <Link href={`/app/translations/${translationId}`}>
                                <Button className="gap-2" color="primary" variant="soft">
                                    <ArrowLeftIcon className="size-4" />
                                    Back
                                </Button>
                            </Link>

                            <div className="bg-surface-200 dark:bg-surface-800 h-5 w-px" />

                            {/* Sidebar Toggle - New Location */}
                            {/* Language Pills - Premium Design */}
                            <div className="hidden items-center gap-2 md:flex">
                                <div className="bg-surface-100 dark:bg-surface-800 flex h-8 items-center gap-0.5 rounded-full p-0.5 pr-3">
                                    {/* Source (Interactive Toggle) */}
                                    <TooltipProvider>
                                        <Tooltip delayDuration={300}>
                                            <TooltipTrigger asChild>
                                                <button
                                                    onClick={togglePdfPanel}
                                                    className={cn(
                                                        'focus-visible:ring-primary-500 flex items-center gap-2 rounded-full py-1 pr-2.5 pl-1 transition-all outline-none focus-visible:ring-2',
                                                        isPdfCollapsed
                                                            ? 'hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-500 dark:text-surface-400'
                                                            : 'dark:bg-surface-950 text-surface-900 dark:text-surface-100 bg-white shadow-sm ring-1 ring-black/5 dark:ring-white/10',
                                                    )}
                                                >
                                                    <div className="relative">
                                                        <div
                                                            className={cn(
                                                                'flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-full transition-opacity',
                                                                isPdfCollapsed ? 'opacity-75' : 'opacity-100',
                                                            )}
                                                        >
                                                            {(() => {
                                                                const details = getLanguageDetails(
                                                                    translation.source_language,
                                                                    true,
                                                                );
                                                                const Flag = details.countryCode
                                                                    ? countriesFlag[
                                                                          details.countryCode as keyof typeof countriesFlag
                                                                      ]
                                                                    : null;
                                                                return Flag ? (
                                                                    <Flag className="size-full object-cover" />
                                                                ) : (
                                                                    <GlobeIcon className="size-3" />
                                                                );
                                                            })()}
                                                        </div>
                                                        {/* Status Dot for View State */}
                                                        {!isPdfCollapsed && (
                                                            <div className="dark:ring-surface-950 absolute -right-0.5 -bottom-0.5 size-2 rounded-full bg-green-500 ring-2 ring-white" />
                                                        )}
                                                    </div>

                                                    <span className="text-xs font-semibold tracking-wide uppercase">
                                                        {
                                                            getLanguageDetails(
                                                                translation.source_language,
                                                                true,
                                                            ).name
                                                        }
                                                    </span>

                                                    {/* Layout Icon Indicator */}
                                                    <div
                                                        className={cn(
                                                            'ml-0.5 flex items-center justify-center border-l pl-2 transition-colors',
                                                            isPdfCollapsed
                                                                ? 'border-surface-300 dark:border-surface-700'
                                                                : 'border-surface-200 dark:border-surface-800',
                                                        )}
                                                    >
                                                        <SidebarSimple
                                                            className={cn(
                                                                'size-3.5',
                                                                isPdfCollapsed
                                                                    ? 'text-surface-400'
                                                                    : 'text-primary-500',
                                                            )}
                                                            weight={isPdfCollapsed ? 'regular' : 'duotone'}
                                                        />
                                                    </div>
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent side="bottom">
                                                {isPdfCollapsed
                                                    ? 'Show Original Document'
                                                    : 'Hide Original Document'}
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>

                                    <ArrowRightIcon
                                        className="text-surface-300 dark:text-surface-600 ml-2 size-3"
                                        weight="bold"
                                    />

                                    {/* Target (Static) */}
                                    <div className="ml-2 flex items-center gap-2">
                                        <div className="bg-surface-50 dark:bg-surface-950 flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-full shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                                            {(() => {
                                                const details = getLanguageDetails(
                                                    translation.target_language,
                                                    false,
                                                );
                                                const Flag = details.countryCode
                                                    ? countriesFlag[
                                                          details.countryCode as keyof typeof countriesFlag
                                                      ]
                                                    : null;
                                                return Flag ? (
                                                    <Flag className="size-full object-cover" />
                                                ) : (
                                                    <TranslateIcon className="size-3" />
                                                );
                                            })()}
                                        </div>
                                        <span className="text-primary-600 dark:text-primary-400 text-xs font-bold tracking-wide uppercase">
                                            {getLanguageDetails(translation.target_language).name}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-2">
                            {/* Status Badge */}
                            {getStatusBadge()}

                            <div className="bg-surface-200 dark:bg-surface-800 mx-1 h-5 w-px" />

                            {/* Main CTA: Apply Changes / Approve - Standard Size */}
                            {generatedDocx && hasPendingChanges ? (
                                <Button
                                    className="gap-2 font-semibold"
                                    color="warning"
                                    variant="solid"
                                    disabled={isRegenerating}
                                    onClick={() => regenerateMutation.mutate()}
                                >
                                    {isRegenerating ? (
                                        <Spinner className="size-4" />
                                    ) : (
                                        <ArrowsClockwiseIcon className="size-4" weight="bold" />
                                    )}
                                    <span>Apply Changes</span>
                                </Button>
                            ) : !generatedDocx && isEditable ? (
                                <Button
                                    className="gap-2 font-semibold"
                                    disabled={isApproving}
                                    variant="solid"
                                    onClick={() => approveMutation.mutate()}
                                >
                                    {isApproving ? (
                                        <Spinner className="size-4" />
                                    ) : (
                                        <CheckCircleIcon className="size-4" weight="bold" />
                                    )}
                                    Generate
                                </Button>
                            ) : null}

                            {/* Export / Download Main Action */}
                            <ExportDropdown
                                translationId={translationId}
                                generatedDocx={generatedDocx}
                                exportStatus={exportStatus}
                                showGoogleDocs={true}
                                variant="default"
                                onRegenerate={() => regenerateMutation.mutate()}
                                isRegenerating={isRegenerating}
                            />

                            {/* More Actions Menu */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button color="primary" variant="soft" size="icon">
                                        <DotsThreeVerticalIcon className="size-5" weight="bold" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuItem
                                        onClick={() => window.open(translation.file_url ?? '', '_blank')}
                                        disabled={!translation.file_url}
                                    >
                                        <DownloadSimpleIcon className="mr-2 size-4" />
                                        Download Source File
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => regenerateMutation.mutate()}
                                        disabled={isRegenerating}
                                    >
                                        <ArrowsClockwiseIcon className="mr-2 size-4" />
                                        Force Regenerate
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-destructive-500 focus:bg-destructive-500 focus:text-destructive-50 dark:focus:bg-destructive-500 dark:focus:text-destructive-50 font-bold focus:font-bold"
                                        onClick={() => setIsDeleteModalOpen(true)}
                                    >
                                        <TrashIcon className="mr-2 size-4" />
                                        Delete Translation
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </ScrollArea>
            </div>

            {/* Main Content Area */}
            <div className="bg-surface-100/50 dark:bg-surface-900/50 flex-1 overflow-hidden">
                <ReviewLayout
                    displayName={translation.display_name}
                    initialContent={sanitizedContent}
                    isPdfCollapsed={isPdfCollapsed}
                    originalContent={originalContent}
                    pdfUrl={signedPdfUrl || ''}
                    sourceLanguage={translation.source_language || 'auto'}
                    status={translationStatus}
                    targetLanguage={translation.target_language ?? ''}
                    translationId={translation.id ?? ''}
                    onApprove={() => approveMutation.mutate()}
                    onDownload={() => downloadMutation.mutate()}
                />
            </div>

            {/* Delete Translation Modal */}
            {isDeleteModalOpen && (
                <DeleteTranslationModal
                    isDeletionModalOpen={isDeleteModalOpen}
                    selectedTranslation={translation}
                    setIsDeletionModalOpen={setIsDeleteModalOpen}
                    setSelectedTranslation={() => {}}
                />
            )}
        </div>
    );
}
