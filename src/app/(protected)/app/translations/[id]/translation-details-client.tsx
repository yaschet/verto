/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import {
    ArrowLeftIcon,
    ArrowRightIcon,
    ArrowsClockwiseIcon,
    ClockIcon,
    CoinsIcon,
    FileDocIcon,
    FileHtmlIcon,
    FileImageIcon,
    FileJpgIcon,
    FilePdfIcon,
    FilePngIcon,
    FileTextIcon,
    FileXlsIcon,
    GlobeIcon,
    PaintBucketIcon,
    PencilSimpleIcon,
    RobotIcon,
    TranslateIcon,
    WarningCircleIcon,
} from '@phosphor-icons/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { regenerateDocument } from '@actions/services/translations/regenerate-document';

import { capitalCase } from 'change-case';
import { format } from 'date-fns';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
    type PipelineEntry,
    PipelineTimeline,
} from '@/app/(protected)/app/translations/[id]/components/pipeline-timeline';
import { StageMetrics } from '@/app/(protected)/app/translations/[id]/components/stage-metrics';
import { Avatar, AvatarFallback, AvatarImage } from '@components/ui/avatar';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { DefaultCard } from '@components/ui/card';
import { Spinner } from '@components/ui/spinner';
import { STATUS_MAPPING } from '@/src/app/(protected)/app/translations/table/constants/mappings';
import { useTranslationRealtime } from '@/src/hooks/use-translation-realtime';
import { useDownloadOriginal } from '@/src/hooks/use-download-original';
import { translationDetailQueryOptions } from '@/src/queries/tanstack/translations-query-options';
import { cn, generateGravatarUrl } from '@library/utils';
import * as countriesFlag from 'country-flag-icons/react/1x1';
import type { TranslationDetailData } from '@/src/queries/tanstack/translations-query-options';
import type { TranslationRow } from '@/src/schemas/translation-schemas';
import type { TranslationStatus } from '@/src/schemas/translation-schemas';
import type { AIAuditData } from '@/types/ai-audit';
import AssignToCustomerModal from '@/app/(protected)/app/translations/modals/assign-to-customer-modal';
import DeleteTranslationModal from '@/app/(protected)/app/translations/modals/delete-translation-modal';
import RetranslateConfirmationModal from '@/app/(protected)/app/translations/modals/retranslate-confirmation-modal';
import RetryTranslationModal from '@/app/(protected)/app/translations/modals/retry-translation-modal';
import TranslationDetailsSkeleton from '@/app/(protected)/app/translations/[id]/translation-details-skeleton';
import { TranslationActionsBar } from './components/translation-actions-bar';
import { type ExportStatus } from '@components/exports/export-dropdown';

type TranslationDetailsClientProps = {
    translationId: string;
};

// Status configuration
const PROCESSING_STATUSES = ['queued', 'processing', 'translating', 'polishing', 'retrying', 'generating'];
const FAILED_STATUSES = ['failed', 'canceled'];

// File type icon based on extension
function getFileTypeIcon(fileUrl: string | null | undefined) {
    if (!fileUrl) return FileTextIcon;
    const ext = fileUrl.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'pdf':
            return FilePdfIcon;
        case 'doc':
        case 'docx':
            return FileDocIcon;
        case 'html':
            return FileHtmlIcon;
        case 'xls':
        case 'xlsx':
            return FileXlsIcon;
        case 'jpg':
        case 'jpeg':
            return FileJpgIcon;
        case 'png':
            return FilePngIcon;
        case 'gif':
        case 'webp':
        case 'bmp':
        case 'tiff':
        case 'svg':
            return FileImageIcon;
        default:
            return FileTextIcon;
    }
}

// Get filename from URL
function getFileName(fileUrl: string | null | undefined): string {
    if (!fileUrl) return 'Unknown file';
    const parts = fileUrl.split('/');
    return parts[parts.length - 1] || 'Unknown file';
}

import { getLanguageDetails } from '@constants/translations';

// Format file size
function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(seconds: number): string {
    if (seconds < 1) return 'less than a second';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    if (remainingSeconds === 0) return `${minutes}m`;
    return `${minutes}m ${remainingSeconds}s`;
}

export default function TranslationDetailsClient({ translationId }: TranslationDetailsClientProps) {
    const queryClient = useQueryClient();

    // TanStack Query - hydrated from RSC prefetch (no fetch on mount)
    const { data, error, isError, isLoading, refetch } = useQuery(
        translationDetailQueryOptions(translationId),
    );

    // Realtime subscription for live updates
    const realtimeTranslation = useTranslationRealtime(translationId, data?.translation ?? null);

    // Download Original File Hook
    const { download: downloadOriginal, isDownloading: isDownloadingOriginal } = useDownloadOriginal({
        fileUrl: data?.translation?.file_url ?? '',
    });

    // Sync realtime updates to query cache (best practice: direct cache update)
    useEffect(() => {
        if (realtimeTranslation && data) {
            queryClient.setQueryData<TranslationDetailData>(
                ['translation-detail', translationId],
                (cached) =>
                    cached
                        ? {
                              ...cached,
                              translation: realtimeTranslation,
                          }
                        : cached,
            );
        }
    }, [realtimeTranslation, translationId, queryClient, data]);

    // Modal state for customer assignment
    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
    const [selectedTranslation, setSelectedTranslation] = useState<TranslationRow | null>(null);

    // Modal state for retry, retranslate, and delete actions
    const [isRetryModalOpen, setIsRetryModalOpen] = useState(false);
    const [isRetranslateModalOpen, setIsRetranslateModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Regenerate document mutation (applies user edits to generate new document)
    const regenerateMutation = useMutation({
        mutationFn: async () => {
            const response = await regenerateDocument({ translationId });
            if (!response || response.error) throw response;
            return response;
        },
        onMutate: () => {
            toast.loading('Regenerating document', {
                id: 'regenerate-document',
                description: 'Applying your edits...',
            });
        },
        onSuccess: (response) => {
            toast.success('Regeneration started', {
                id: 'regenerate-document',
                description: response.description ?? 'Your document is being regenerated.',
            });
            queryClient.invalidateQueries({ queryKey: ['translation-detail', translationId] });
        },
        onError: (error: unknown) => {
            const err = error as { title?: string; message?: string; description?: string };
            toast.error(err.title ?? 'Regeneration failed', {
                id: 'regenerate-document',
                description: err.description ?? 'Something went wrong. Try again.',
            });
        },
    });

    // Wrap setIsAssignmentModalOpen to invalidate query when modal closes
    const handleModalOpenChange = useCallback(
        (openOrUpdater: boolean | ((prev: boolean) => boolean)) => {
            const newValue =
                typeof openOrUpdater === 'function' ? openOrUpdater(isAssignmentModalOpen) : openOrUpdater;
            setIsAssignmentModalOpen(newValue);
            // When modal closes, invalidate query to refetch customer data
            if (!newValue) {
                queryClient.invalidateQueries({ queryKey: ['translation-detail', translationId] });
            }
        },
        [queryClient, translationId, isAssignmentModalOpen],
    );

    // Live duration timer for in-progress translations
    const [elapsedTime, setElapsedTime] = useState<number>(0);
    const currentStatus = data?.translation?.status;

    useEffect(() => {
        const startedAt = data?.translation?.started_at;
        const completedAt = data?.translation?.completed_at;

        if (!startedAt) {
            setElapsedTime(0);
            return;
        }

        const startedAtMs = new Date(startedAt).getTime();

        // Final statuses where timer should stop (even if completed_at is null)
        const isFinalStatus = ['ready', 'completed', 'failed', 'canceled'].includes(currentStatus ?? '');

        // If completed or in a final status, calculate duration once and stop
        if (completedAt) {
            const completedAtMs = new Date(completedAt).getTime();
            setElapsedTime(Math.floor((completedAtMs - startedAtMs) / 1000));
            return;
        }

        // If in final status but no completed_at, freeze at current elapsed time
        if (isFinalStatus) {
            setElapsedTime(Math.floor((Date.now() - startedAtMs) / 1000));
            return;
        }

        // Only start live timer for processing statuses (not queued, not final)
        if (currentStatus === 'queued') {
            setElapsedTime(0);
            return;
        }

        // Still processing - start live timer
        const updateElapsed = () => {
            setElapsedTime(Math.floor((Date.now() - startedAtMs) / 1000));
        };

        updateElapsed(); // Initial update
        const intervalId = setInterval(updateElapsed, 1000);

        return () => clearInterval(intervalId);
    }, [data?.translation?.started_at, data?.translation?.completed_at, currentStatus]);

    // Loading state (rarely shown due to prefetch)
    if (isLoading) {
        return <TranslationDetailsSkeleton />;
    }

    // Error state
    if (isError || !data) {
        return (
            <div className="flex w-full max-w-full flex-col gap-6">
                <div className="flex items-center justify-between gap-4">
                    <Link href="/app/translations">
                        <Button className="gap-2" color="secondary" variant="soft">
                            <ArrowLeftIcon className="size-4" />
                            Back
                        </Button>
                    </Link>
                </div>

                <DefaultCard className="flex flex-col items-center justify-center gap-4 p-12">
                    <WarningCircleIcon className="text-destructive size-12" weight="duotone" />
                    <div className="text-center">
                        <h3 className="text-surface-900 dark:text-surface-100 text-lg font-semibold">
                            Failed to Load Translation
                        </h3>
                        <p className="text-surface-500 mt-1 text-sm">
                            {(error as Error)?.message || 'An unexpected error occurred'}
                        </p>
                    </div>
                    <Button color="secondary" variant="soft" onClick={() => refetch()}>
                        <ArrowsClockwiseIcon className="mr-2 size-4" />
                        Try Again
                    </Button>
                </DefaultCard>
            </div>
        );
    }

    // Merge data: query cache + realtime (realtime takes priority for translation row)
    const translation = realtimeTranslation ?? data.translation;
    const { creditsUsed, customerEmail, customerName, fileMetadata, templateName, pageCount, tokenUsage } =
        data;

    // Extract progress history, ai_audit, verification_metadata, dynamic labels, and generated_docx from details JSONB

    const details = translation.details as {
        progress_history?: PipelineEntry[];
        ai_audit?: AIAuditData;
        verification_metadata?: {
            passed?: boolean;
            complete?: boolean;
            confidence?: number;
            tokensUsed?: number;
            missing_content?: string[];
            table_verification?: {
                issues?: string[];
                tablesMatch?: boolean;
                outputTableCount?: number;
                sourceTableCount?: number;
            };
        };
        generated_docx?: import('@utils/gcp/docx/functions/generate-google-doc-and-exports').UploadedDocumentUrls;
        user_edits?: unknown;
        dynamic_label?: string;
        stage_message?: string;
    } | null;
    const progressHistory: PipelineEntry[] = details?.progress_history ?? [];
    const aiAudit: AIAuditData | null = details?.ai_audit ?? null;
    const verificationMetadata = details?.verification_metadata ?? null;
    const generatedDocx = details?.generated_docx ?? null;
    const hasUserEdits = !!details?.user_edits;

    const exportStatus =
        ((translation as unknown as { export_status?: unknown }).export_status as ExportStatus) ?? null;

    // Dynamic labels from pipeline (e.g., "Translating chunk 3/10")
    const isDynamicPhase = ['translating', 'polishing', 'processing'].includes(translation.status ?? '');
    const dynamicLabel = isDynamicPhase ? details?.dynamic_label : undefined;
    const stageMessage = isDynamicPhase ? details?.stage_message : undefined;

    const translationStatus = (translation.status ?? 'queued') as TranslationStatus;
    const statusDetails = STATUS_MAPPING[translationStatus] || STATUS_MAPPING.queued;
    const FileTypeIcon = getFileTypeIcon(translation.file_url);

    const canReview = translationStatus === 'ready' || translationStatus === 'completed';
    const isProcessing = PROCESSING_STATUSES.includes(translationStatus);
    const isFailed = FAILED_STATUSES.includes(translationStatus);

    // Handler to open customer assignment modal
    const handleAssignCustomer = () => {
        setSelectedTranslation(translation);
        setIsAssignmentModalOpen(true);
    };

    // 1. Status Card - Design-engineered with proper states
    const StatusIcon = statusDetails.icon;
    const statusColor = statusDetails.color || 'primary';
    const _progress = translation.progress ?? 0;

    // Color class mappings with refined gradients (smooth same-family transitions)
    const STATUS_COLOR_CLASSES = {
        success: {
            bg: 'bg-gradient-to-b from-success-50 via-success-50 to-success-100/80 dark:from-success-950/25 dark:via-success-950/30 dark:to-success-900/20 border border-success-200/50 dark:border-success-800/30',
            icon: 'text-success-500 dark:text-success-400',
            title: 'text-success-700 dark:text-success-300',
            description: 'text-success-600/75 dark:text-success-400/60',
        },
        warning: {
            bg: 'bg-gradient-to-b from-warning-50 via-warning-50 to-warning-100/80 dark:from-warning-950/25 dark:via-warning-950/30 dark:to-warning-900/20 border border-warning-200/50 dark:border-warning-800/30',
            icon: 'text-warning-500 dark:text-warning-400',
            title: 'text-warning-700 dark:text-warning-300',
            description: 'text-warning-600/75 dark:text-warning-400/60',
        },
        destructive: {
            bg: 'bg-gradient-to-b from-destructive-50 via-destructive-50 to-destructive-100/80 dark:from-destructive-950/25 dark:via-destructive-950/30 dark:to-destructive-900/20 border border-destructive-200/50 dark:border-destructive-800/30',
            icon: 'text-destructive-500 dark:text-destructive-400',
            title: 'text-destructive-700 dark:text-destructive-300',
            description: 'text-destructive-600/75 dark:text-destructive-400/60',
        },
        info: {
            bg: 'bg-gradient-to-b from-info-50 via-info-50 to-info-100/80 dark:from-info-950/25 dark:via-info-950/30 dark:to-info-900/20 border border-info-200/50 dark:border-info-800/30',
            icon: 'text-info-500 dark:text-info-400',
            title: 'text-info-700 dark:text-info-300',
            description: 'text-info-600/75 dark:text-info-400/60',
        },
        primary: {
            bg: 'bg-gradient-to-b from-primary-50 via-primary-50 to-primary-100/80 dark:from-primary-950/25 dark:via-primary-950/30 dark:to-primary-900/20 border border-primary-200/50 dark:border-primary-800/30',
            icon: 'text-primary-500 dark:text-primary-400',
            title: 'text-primary-700 dark:text-primary-300',
            description: 'text-primary-600/75 dark:text-primary-400/60',
        },
    } as const;

    // Override colors for better visual hierarchy:
    // - "ready" uses success (green) instead of primary (gray) - it's a positive state!
    // - "primary" is reserved for neutral states
    const effectiveStatusColor = translationStatus === 'ready' ? 'success' : statusColor;
    const colorClasses =
        STATUS_COLOR_CLASSES[effectiveStatusColor as keyof typeof STATUS_COLOR_CLASSES] ||
        STATUS_COLOR_CLASSES.primary;

    // Use dynamic label if available, otherwise fall back to status mapping
    const statusLabel = dynamicLabel || statusDetails.label;
    // Use stage_message for description if available, otherwise fall back to default
    const statusDescription = stageMessage || statusDetails.tooltipContent;

    // Determine if we should show the Spinner component (processing states)
    const showSpinner = isProcessing;

    const statusCard = (
        <DefaultCard className={cn('col-span-1 flex flex-col p-4', colorClasses.bg)}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <span className="text-surface-500 text-xs font-medium tracking-wider uppercase">Status</span>
                {showSpinner ? (
                    <Spinner className={cn('size-5', colorClasses.icon)} />
                ) : (
                    <StatusIcon
                        className={cn('size-5', statusDetails.animate && 'animate-pulse', colorClasses.icon)}
                        weight="duotone"
                    />
                )}
            </div>

            {/* Status Label */}
            <div className="mt-2">
                <div className={cn('text-lg font-bold', colorClasses.title)}>{statusLabel}</div>

                {/* Description - fully rendered, no truncation */}
                <p className={cn('mt-1 text-xs', colorClasses.description)}>{statusDescription}</p>
            </div>
        </DefaultCard>
    );

    // 2. Customer Card
    const displayCustomerName = customerName || 'Unassigned';
    const displayCustomerEmail = customerEmail || 'No email';
    const customerAvatar = generateGravatarUrl(displayCustomerEmail);

    const customerCard = (
        <DefaultCard
            className="group hover:border-primary-300 dark:hover:border-primary-700 hover:bg-surface-50 dark:hover:bg-surface-800/50 relative col-span-1 flex cursor-pointer flex-col justify-between overflow-hidden p-4 transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-md"
            onClick={handleAssignCustomer}
        >
            {/* Subtle shine effect on hover */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-black/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 dark:via-white/5" />

            <div className="mb-2 flex items-center justify-between">
                <span className="text-surface-500 text-xs font-medium tracking-wider uppercase">
                    Customer
                </span>
                <div className="text-surface-400 group-hover:text-primary-500 flex size-6 items-center justify-center rounded-md transition-colors">
                    <PencilSimpleIcon weight="bold" className="size-4" />
                </div>
            </div>

            <div className="mt-1 flex items-center gap-3">
                <Avatar className="border-surface-200 dark:border-surface-700 size-10 border">
                    <AvatarImage src={customerAvatar} alt={displayCustomerName} />
                    <AvatarFallback name={displayCustomerName} />
                </Avatar>
                <div className="flex flex-col overflow-hidden">
                    <span className="truncate text-sm font-bold transition-colors">
                        {capitalCase(displayCustomerName)}
                    </span>
                    <span className="text-surface-400 truncate text-xs">{displayCustomerEmail}</span>
                </div>
            </div>
        </DefaultCard>
    );

    // 3. Language Pair Card
    const sourceLang = getLanguageDetails(translation.source_language, true);
    const targetLang = getLanguageDetails(translation.target_language, false);

    // Dynamic flag components
    const SourceFlag = sourceLang.countryCode
        ? countriesFlag[sourceLang.countryCode as keyof typeof countriesFlag]
        : null;
    const TargetFlag = targetLang.countryCode
        ? countriesFlag[targetLang.countryCode as keyof typeof countriesFlag]
        : null;

    const languagePairCard = (
        <DefaultCard className="col-span-1 flex flex-col justify-between p-4">
            <span className="text-surface-500 mb-3 text-xs font-medium tracking-wider uppercase">
                Language Pair
            </span>
            <div className="flex items-center gap-4">
                {/* Source Language */}
                <div className="flex items-center gap-3">
                    <div className="bg-surface-100 dark:bg-surface-800 flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl">
                        {sourceLang.isAuto ? (
                            <GlobeIcon className="text-surface-500 size-5" weight="duotone" />
                        ) : SourceFlag ? (
                            <SourceFlag className="size-6 rounded" />
                        ) : (
                            <GlobeIcon className="text-surface-500 size-5" weight="duotone" />
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-surface-500 text-xs font-medium">Source</span>
                        <span className="text-surface-900 dark:text-surface-100 font-semibold">
                            {sourceLang.name}
                        </span>
                    </div>
                </div>

                {/* Arrow */}
                <div className="bg-surface-100 dark:bg-surface-800 flex size-8 shrink-0 items-center justify-center rounded-full">
                    <ArrowRightIcon className="text-surface-500 size-4" />
                </div>

                {/* Target Language */}
                <div className="flex items-center gap-3">
                    <div className="bg-surface-100 dark:bg-surface-800 flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl">
                        {TargetFlag ? (
                            <TargetFlag className="size-6 rounded" />
                        ) : (
                            <TranslateIcon className="text-surface-500 size-5" weight="duotone" />
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-surface-500 text-xs font-medium">Target</span>
                        <span className="text-surface-900 dark:text-surface-100 font-semibold">
                            {targetLang.name}
                        </span>
                    </div>
                </div>
            </div>
        </DefaultCard>
    );

    // 8. Branding Card
    const brandingCard = (
        <Link href="/account/settings" className="group col-span-1 block">
            <DefaultCard className="hover:border-primary-300 dark:hover:border-primary-700 hover:bg-surface-50 dark:hover:bg-surface-800/50 relative flex h-full flex-col justify-between overflow-hidden p-4 transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-md">
                {/* Subtle gradient background */}
                <div className="via-primary-500/10 dark:via-primary-400/10 pointer-events-none absolute inset-0 bg-gradient-to-br from-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                <div className="flex items-center justify-between">
                    <span className="text-surface-500 text-xs font-medium tracking-wider uppercase">
                        Branding
                    </span>
                    <div className="text-surface-400 group-hover:text-primary-500 flex size-6 items-center justify-center rounded-md transition-colors">
                        <PaintBucketIcon weight="bold" className="size-4" />
                    </div>
                </div>
                <div className="mt-2">
                    <div className="text-surface-900 text-sm font-bold transition-colors dark:text-white">
                        Customize Branding
                    </div>
                    <p className="text-surface-500 mt-1 text-xs">Add your logo and colors</p>
                </div>
            </DefaultCard>
        </Link>
    );

    return (
        <div className="flex w-full max-w-full flex-col gap-6">
            {/* Header with Actions */}
            <div className="flex items-center justify-between gap-4">
                <Link href="/app/translations">
                    <Button className="gap-2" color="primary" variant="soft">
                        <ArrowLeftIcon className="size-4" />
                        Back
                    </Button>
                </Link>

                {/* Header Actions - State-based controls */}
                <TranslationActionsBar
                    translationId={translation.id!}
                    generatedDocx={generatedDocx}
                    exportStatus={exportStatus}
                    canEdit={canReview}
                    isFailed={isFailed}
                    isProcessing={isProcessing}
                    hasUserEdits={hasUserEdits}
                    onRetry={() => setIsRetryModalOpen(true)}
                    onRetranslate={() => setIsRetranslateModalOpen(true)}
                    onRegenerate={() => regenerateMutation.mutate()}
                    isRegenerating={regenerateMutation.isPending}
                    onDelete={() => setIsDeleteModalOpen(true)}
                    fileUrl={translation.file_url}
                    onDownloadOriginal={() => downloadOriginal()}
                    isDownloadingOriginal={isDownloadingOriginal}
                />
            </div>

            {/* Document Hero Card - Standard Style */}
            <DefaultCard className="p-6">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-6">
                    {/* File Type Icon in circular container */}
                    <div className="bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex size-20 shrink-0 items-center justify-center rounded-full">
                        <FileTypeIcon className="size-10" weight="duotone" />
                    </div>

                    <div className="min-w-0 flex-1 space-y-2">
                        <div>
                            <h2 className="truncate text-3xl font-bold tracking-tight">
                                {translation.display_name || getFileName(translation.file_url)}
                            </h2>
                            {translation.description && (
                                <p className="text-surface-500 mt-1 text-base">{translation.description}</p>
                            )}
                            <div className="text-surface-500 mt-2 flex items-center gap-2">
                                <p className="text-sm font-medium">
                                    {formatFileSize(fileMetadata?.size || 0)}
                                </p>
                                <span>•</span>
                                <p className="text-sm font-medium">{pageCount || 0} pages</p>
                            </div>
                        </div>
                    </div>
                </div>
            </DefaultCard>

            {/* Translation Details - 8-Card Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {statusCard}

                {customerCard}

                {languagePairCard}

                {/* 4. Cost & Usage Card */}
                <DefaultCard className="flex flex-col gap-3 p-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-warning/10 flex size-10 shrink-0 items-center justify-center rounded-lg">
                            <CoinsIcon className="text-warning size-5" weight="duotone" />
                        </div>
                        <div>
                            <p className="text-surface-500 text-xs font-medium">Cost & Usage</p>
                            <p className="text-surface-900 dark:text-surface-100 text-sm font-semibold">
                                {creditsUsed} Credits
                            </p>
                        </div>
                    </div>
                    <div className="bg-surface-100 dark:bg-surface-800 h-px w-full" />
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-surface-500">Pages</span>
                        <span className="text-surface-900 dark:text-surface-100 font-medium">
                            {pageCount || 0}
                        </span>
                    </div>
                </DefaultCard>

                {/* Timing Card */}
                <DefaultCard className="flex flex-col gap-3 p-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-info/10 flex size-10 shrink-0 items-center justify-center rounded-lg">
                            <ClockIcon className="text-info size-5" weight="duotone" />
                        </div>
                        <div>
                            <p className="text-surface-500 text-xs font-medium">Duration</p>
                            <p className="text-surface-900 dark:text-surface-100 text-sm font-semibold">
                                {elapsedTime > 0
                                    ? formatDuration(elapsedTime)
                                    : translationStatus === 'queued'
                                      ? 'Waiting...'
                                      : 'Starting...'}
                            </p>
                        </div>
                    </div>
                    <div className="bg-surface-100 dark:bg-surface-800 h-px w-full" />
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-surface-500">Created</span>
                        <span className="text-surface-900 dark:text-surface-100 font-medium">
                            {translation.created_at
                                ? format(new Date(translation.created_at), 'MMM d, yyyy')
                                : 'N/A'}
                        </span>
                    </div>
                </DefaultCard>

                {/* Template Card */}
                <DefaultCard className="flex flex-col gap-3 p-4">
                    <div className="flex items-center gap-3">
                        <Avatar className="size-10 shrink-0">
                            <AvatarFallback
                                square
                                name={templateName || 'Default'}
                                size={40}
                                variant="marble"
                            />
                        </Avatar>
                        <div>
                            <p className="text-surface-500 text-xs font-medium">Template</p>
                            <p className="text-surface-900 dark:text-surface-100 max-w-[120px] truncate text-sm font-semibold">
                                {templateName || 'Default'}
                            </p>
                        </div>
                    </div>
                    <div className="bg-surface-100 dark:bg-surface-800 h-px w-full" />
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-surface-500">AI Tokens</span>
                        <span className="text-surface-900 dark:text-surface-100 font-medium">
                            {tokenUsage ? `${(tokenUsage / 1000).toFixed(1)}k` : 'N/A'}
                        </span>
                    </div>
                </DefaultCard>

                {/* Quality / Audit Card */}
                <DefaultCard className="flex flex-col gap-3 p-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-success/10 flex size-10 shrink-0 items-center justify-center rounded-lg">
                            <RobotIcon className="text-success size-5" weight="duotone" />
                        </div>
                        <div>
                            <p className="text-surface-500 text-xs font-medium">AI Quality Score</p>
                            <p className="text-surface-900 dark:text-surface-100 text-sm font-semibold">
                                {aiAudit
                                    ? `${Math.round((aiAudit.qa?.confidence ?? aiAudit.translation?.confidence ?? 0) * 100)}/100`
                                    : 'N/A'}
                            </p>
                        </div>
                    </div>
                    <div className="bg-surface-100 dark:bg-surface-800 h-px w-full" />
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-surface-500">Status</span>
                        <Badge
                            color={aiAudit ? 'success' : 'secondary'}
                            size="sm"
                            variant="plain"
                            className="h-auto px-1.5 py-0 text-[10px]"
                        >
                            {aiAudit ? 'Audited' : 'Pending'}
                        </Badge>
                    </div>
                </DefaultCard>

                {brandingCard}
            </div>

            {/* Pipeline Details - Only show if there's data */}
            {(progressHistory.length > 0 || aiAudit || verificationMetadata) && (
                <div className="space-y-4">
                    {/* Section Header */}
                    <h3 className="text-surface-900 dark:text-surface-100 text-lg font-semibold">
                        Processing Details
                    </h3>

                    {/* Pipeline Timeline */}
                    <PipelineTimeline
                        aiAudit={aiAudit}
                        completedAt={translation.completed_at}
                        currentStatus={translationStatus}
                        entries={progressHistory}
                        progress={translation.progress ?? 0}
                        startedAt={translation.started_at}
                    />

                    {/* Stage Metrics Cards */}
                    <StageMetrics aiAudit={aiAudit} verificationMetadata={verificationMetadata} />
                </div>
            )}

            {/* Customer Assignment Modal - Only render when needed to avoid hooks issues */}
            {isAssignmentModalOpen && (
                <AssignToCustomerModal
                    isAssignmentModalOpen={isAssignmentModalOpen}
                    selectedTranslation={selectedTranslation}
                    setIsAssignmentModalOpen={handleModalOpenChange}
                    setSelectedTranslation={setSelectedTranslation}
                />
            )}

            {/* Retry Translation Modal */}
            {isRetryModalOpen && (
                <RetryTranslationModal
                    isRetryModalOpen={isRetryModalOpen}
                    selectedTranslation={translation}
                    setIsRetryModalOpen={setIsRetryModalOpen}
                    setSelectedTranslation={() => {}}
                />
            )}

            {/* Delete Translation Modal */}
            {isDeleteModalOpen && (
                <DeleteTranslationModal
                    isDeletionModalOpen={isDeleteModalOpen}
                    selectedTranslation={translation}
                    setIsDeletionModalOpen={setIsDeleteModalOpen}
                    setSelectedTranslation={() => {}}
                />
            )}

            {/* Retranslate Confirmation Modal */}
            {isRetranslateModalOpen && (
                <RetranslateConfirmationModal
                    isOpen={isRetranslateModalOpen}
                    selectedTranslation={translation}
                    setIsOpen={setIsRetranslateModalOpen}
                />
            )}
        </div>
    );
}
