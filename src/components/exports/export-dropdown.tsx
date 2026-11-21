/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import type { ApiErrorType } from '@/types/rest/errors';
import { useState } from 'react';
import {
    ArrowsCounterClockwiseIcon,
    BookOpenIcon,
    DownloadSimpleIcon,
    FileDocIcon,
    FileHtmlIcon,
    FilePdfIcon,
    FileTextIcon,
    FileCodeIcon,
    GoogleLogoIcon,
    WarningCircleIcon,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { retryFormatExport, type RetryableFormat } from '@actions/services/translations/retry-format-export';
import { getGeneratedDocumentUrl } from '@actions/storage/get-generated-document-url';
import { Button } from '@components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@components/ui/dropdown-menu';
import { Spinner } from '@components/ui/spinner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@components/ui/tooltip';
import { cn } from '@library/utils';
import type { UploadedDocumentUrls } from '@utils/gcp/docx/functions/generate-google-doc-and-exports';
import type { DriveExportFormat } from '@utils/gcp/drive/export-from-drive';

/**
 * Export status for a single format (from export_status column)
 */
type FormatExportStatus = {
    status: 'pending' | 'processing' | 'ready' | 'failed';
    progress?: number;
    error?: string;
    downloadUrl?: string;
    fileSizeBytes?: number;
};

/**
 * Export status for all formats
 */
export type ExportStatus = {
    docx?: FormatExportStatus;
    pdf?: FormatExportStatus;
    html?: FormatExportStatus;
    md?: FormatExportStatus;
    epub?: FormatExportStatus;
    odt?: FormatExportStatus;
    rtf?: FormatExportStatus;
    txt?: FormatExportStatus;
};

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Format configuration
 */
const FORMAT_CONFIG = [
    {
        key: 'docx' as const,
        label: 'Word',
        ext: 'DOCX',
        icon: FileDocIcon,
        canRetry: false,
        getSize: (docx: UploadedDocumentUrls | null) => docx?.fileSizeBytes,
    },
    {
        key: 'pdf' as const,
        label: 'PDF',
        ext: 'PDF',
        icon: FilePdfIcon,
        canRetry: true,
        getSize: (docx: UploadedDocumentUrls | null) => docx?.pdfFileSizeBytes,
    },
    {
        key: 'html' as const,
        label: 'Web',
        ext: 'HTML',
        icon: FileHtmlIcon,
        canRetry: true,
        getSize: (docx: UploadedDocumentUrls | null) => docx?.htmlFileSizeBytes,
    },
    {
        key: 'md' as const,
        label: 'Markdown',
        ext: 'MD',
        icon: FileCodeIcon,
        canRetry: true,
        getSize: (docx: UploadedDocumentUrls | null) => docx?.markdownFileSizeBytes,
    },
    {
        key: 'epub' as const,
        label: 'EPUB',
        ext: 'EPUB',
        icon: BookOpenIcon,
        canRetry: true,
        getSize: (docx: UploadedDocumentUrls | null) => docx?.epubFileSizeBytes,
    },
    {
        key: 'odt' as const,
        label: 'OpenDocument',
        ext: 'ODT',
        icon: FileDocIcon,
        canRetry: true,
        getSize: (docx: UploadedDocumentUrls | null) => docx?.odtFileSizeBytes,
    },
    {
        key: 'rtf' as const,
        label: 'Rich Text',
        ext: 'RTF',
        icon: FileTextIcon,
        canRetry: true,
        getSize: (docx: UploadedDocumentUrls | null) => docx?.rtfFileSizeBytes,
    },
    {
        key: 'txt' as const,
        label: 'Plain Text',
        ext: 'TXT',
        icon: FileTextIcon,
        canRetry: true,
        getSize: (docx: UploadedDocumentUrls | null) => docx?.txtFileSizeBytes,
    },
];

/**
 * Props for the unified export dropdown
 */
type UnifiedExportDropdownProps = {
    /** Translation ID for retry functionality */
    translationId: string;
    /** Generated document URLs */
    generatedDocx: UploadedDocumentUrls | null;
    /** Export status from database (real-time updates) */
    exportStatus?: ExportStatus | null;
    /** Callback when user wants to regenerate document */
    onRegenerate?: () => void;
    /** Whether regeneration is in progress */
    isRegenerating?: boolean;
    /** Show Google Docs view button (default: true) */
    showGoogleDocs?: boolean;
    /** Show labels next to icons in buttons (default: true) */
    showLabels?: boolean;
    /** Layout variant: 'default' (full) or 'compact' (minimal) */
    variant?: 'default' | 'compact';
};

/**
 * Unified Export Dropdown Component
 *
 * Now uses on-demand signed URL generation to prevent "InvalidJWT" errors for expired links.
 */
export function ExportDropdown({
    translationId,
    generatedDocx,
    exportStatus,
    isRegenerating = false,
    showGoogleDocs = true,
    showLabels = true,
    variant = 'default',
}: UnifiedExportDropdownProps) {
    const [isRetrying, setIsRetrying] = useState(false);
    const [loadingFormat, setLoadingFormat] = useState<string | null>(null);

    // Mutation to get fresh signed URL
    const { mutateAsync: downloadDocument } = useMutation({
        mutationFn: async ({ format, fileId }: { format: DriveExportFormat; fileId: string }) => {
            setLoadingFormat(format);
            const response = await getGeneratedDocumentUrl({
                translationId,
                format,
                fileId,
            });

            // Check if response is an error (has error=true or status !== 200)
            if (response?.error || response.status !== 200 || !response.data?.signedUrl) {
                throw response; // Throw the entire response so onError can extract details
            }

            return response.data.signedUrl;
        },
        onSuccess: (url) => {
            // Trigger immediate download using hidden anchor (better UX than new tab)
            if (url) {
                const link = document.createElement('a');
                link.href = url;
                link.download = ''; // Browser will use filename from Content-Disposition header
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
            setLoadingFormat(null);
        },
        onError: (error: Error & Partial<ApiErrorType>) => {
            // Extract error details from standardized API error response
            const title = error?.title ?? 'Download failed';
            const description = error?.description ?? error?.message ?? 'Could not generate download link';

            toast.error(title, { description });
            setLoadingFormat(null);
        },
    });

    const handleDownload = (e: React.MouseEvent, format: DriveExportFormat) => {
        e.preventDefault();
        if (!generatedDocx?.id) return;

        // Prevent closing immediately if we want to show loading state
        // (DropdownMenu closes on click by default, but e.preventDefault() stops it)

        downloadDocument({ format, fileId: generatedDocx.id });
    };

    // Don't render if no document generated
    if (!generatedDocx?.id) return null; // We strictly need the ID now

    const hasGoogleDocs = !!generatedDocx?.googleDocsEditUrl;
    const googleDocsCopyUrl = generatedDocx?.googleDocsCopyUrl;
    const hasGoogleDriveFile = !!generatedDocx?.googleDriveFileId;

    // Helper to get export result for a format
    const getExportResult = (formatKey: DriveExportFormat) => {
        const key = formatKey === 'md' ? 'markdown' : formatKey;
        return (generatedDocx as unknown as Record<string, { success: boolean; error?: string } | undefined>)[
            `${key}ExportResult`
        ];
    };

    // Analyze format states
    const formatStates = FORMAT_CONFIG.map((format) => {
        const size = format.getSize(generatedDocx);
        const status = exportStatus?.[format.key as keyof ExportStatus];
        const exportResult = getExportResult(format.key);

        // Check availability logic

        // If exportResult.success is true OR status is ready -> It's available.
        const hasDownloadUrl = !!(generatedDocx as unknown as Record<string, unknown>)[
            `${format.key === 'md' ? 'markdown' : format.key}DownloadUrl`
        ];
        const isStatusReady = status?.status === 'ready';
        const isExportSuccess = exportResult?.success === true;

        // It's ready if any of these are true.
        const isReady = hasDownloadUrl || isStatusReady || isExportSuccess;

        const hasFailed = !isReady && (status?.status === 'failed' || exportResult?.success === false);
        const canRetryThis = format.canRetry && hasGoogleDriveFile && !isReady;

        return { ...format, size, isReady, hasFailed, canRetryThis };
    });

    const readyFormats = formatStates.filter((f) => f.isReady);
    const failedFormats = formatStates.filter((f) => f.hasFailed && f.canRetryThis);
    const unavailableFormats = formatStates.filter((f) => !f.isReady && !f.hasFailed && f.canRetryThis);
    const missingCount = failedFormats.length + unavailableFormats.length;
    const hasFailedOrMissing = missingCount > 0;

    // Retry all failed/missing formats
    const handleRetryAll = async () => {
        if (isRetrying) return;
        setIsRetrying(true);

        const toRetry = [...failedFormats, ...unavailableFormats];
        const formatNames = toRetry.map((f) => f.ext).join(', ');

        toast.loading('Generating formats', {
            id: 'retry-formats',
            description: `Creating ${formatNames}...`,
        });

        try {
            const results = await Promise.allSettled(
                toRetry.map((f) => retryFormatExport({ translationId, format: f.key as RetryableFormat })),
            );

            const succeeded = results.filter(
                (r) => r.status === 'fulfilled' && 'success' in r.value && r.value.success,
            ).length;
            const failed = results.length - succeeded;

            if (failed === 0) {
                toast.success('Formats ready', {
                    id: 'retry-formats',
                    description: `${formatNames} available for download.`,
                });
            } else if (succeeded > 0) {
                toast.warning('Partial success', {
                    id: 'retry-formats',
                    description: `${succeeded} ready, ${failed} failed. Try again.`,
                });
            } else {
                toast.error('Generation failed', {
                    id: 'retry-formats',
                    description: 'Something went wrong. Try again.',
                });
            }
        } catch {
            toast.error('Generation failed', {
                id: 'retry-formats',
                description: 'Something went wrong. Try again.',
            });
        } finally {
            setIsRetrying(false);
        }
    };

    // Compact variant
    if (variant === 'compact') {
        return (
            <TooltipProvider delayDuration={300}>
                <div className="flex items-center gap-2">
                    {showGoogleDocs && hasGoogleDocs && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <a
                                    href={generatedDocx.googleDocsEditUrl ?? undefined}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Button
                                        color="primary"
                                        variant="solid"
                                        size={showLabels ? 'md' : 'icon-sm'}
                                        className={showLabels ? 'gap-2' : ''}
                                    >
                                        <GoogleLogoIcon
                                            className={cn(showLabels ? 'size-4' : 'size-5')}
                                            weight="bold"
                                        />
                                        {showLabels && <span className="hidden sm:inline">View</span>}
                                    </Button>
                                </a>
                            </TooltipTrigger>
                            <TooltipContent>View in Google Docs</TooltipContent>
                        </Tooltip>
                    )}

                    <DropdownMenu>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        className={cn('relative', showLabels ? 'gap-2' : '')}
                                        color="primary"
                                        variant="soft"
                                        size={showLabels ? 'md' : 'icon-sm'}
                                        disabled={isRegenerating || isRetrying}
                                    >
                                        {isRetrying ? (
                                            <Spinner className={cn(showLabels ? 'size-4' : 'size-5')} />
                                        ) : (
                                            <DownloadSimpleIcon
                                                className={cn(showLabels ? 'size-4' : 'size-5')}
                                                weight="bold"
                                            />
                                        )}
                                        {showLabels && <span className="hidden sm:inline">Download</span>}
                                        {hasFailedOrMissing && !isRetrying && (
                                            <div className="bg-warning-100 text-warning-600 dark:bg-warning-950 dark:text-warning-400 absolute top-0 right-0 -mt-0.5 -mr-0.5 flex size-[18px] items-center justify-center rounded-full">
                                                <WarningCircleIcon className="size-3" weight="duotone" />
                                            </div>
                                        )}
                                    </Button>
                                </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <TooltipContent>
                                {readyFormats.length} format{readyFormats.length !== 1 ? 's' : ''} available
                            </TooltipContent>
                        </Tooltip>
                        <DropdownMenuContent align="end" className="w-48 max-w-[calc(100vw-2rem)]">
                            <div className="flex flex-col">
                                {googleDocsCopyUrl && (
                                    <>
                                        <DropdownMenuItem asChild>
                                            <a
                                                href={googleDocsCopyUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <GoogleLogoIcon className="size-4" weight="bold" />
                                                <span>Make a copy</span>
                                            </a>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                    </>
                                )}
                                {formatStates.map((format) => {
                                    const Icon = format.icon;
                                    const isLoading = loadingFormat === format.key;

                                    return (
                                        <DropdownMenuItem
                                            key={format.key}
                                            onClick={(e) =>
                                                format.isReady &&
                                                handleDownload(e, format.key as DriveExportFormat)
                                            }
                                            disabled={!format.isReady || isLoading}
                                            className="cursor-pointer gap-3"
                                        >
                                            {isLoading ? (
                                                <Spinner className="size-4 shrink-0" />
                                            ) : (
                                                <Icon
                                                    className={cn(
                                                        'size-4 shrink-0 transition-colors',
                                                        format.isReady
                                                            ? 'text-surface-500'
                                                            : 'text-surface-300 dark:text-surface-700',
                                                    )}
                                                    weight="duotone"
                                                />
                                            )}
                                            <span
                                                className={cn(
                                                    'flex-1 truncate',
                                                    format.isReady
                                                        ? 'text-surface-900 dark:text-surface-50'
                                                        : 'text-surface-400 dark:text-surface-600',
                                                )}
                                            >
                                                {format.label}
                                            </span>
                                            {format.isReady && format.size && (
                                                <span className="text-surface-400 shrink-0 text-[10px] font-medium tabular-nums">
                                                    {formatFileSize(format.size)}
                                                </span>
                                            )}
                                            {format.hasFailed && (
                                                <div className="bg-destructive-500 size-2 rounded-full" />
                                            )}
                                        </DropdownMenuItem>
                                    );
                                })}
                            </div>
                            {hasFailedOrMissing && hasGoogleDriveFile && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={handleRetryAll}
                                        disabled={isRetrying}
                                        className="focus:text-accent-500 dark:focus:text-accent-400 cursor-pointer gap-3 font-semibold"
                                    >
                                        {isRetrying ? (
                                            <Spinner className="size-4 shrink-0" />
                                        ) : (
                                            <ArrowsCounterClockwiseIcon
                                                className="size-4 shrink-0"
                                                weight="bold"
                                            />
                                        )}
                                        <span className="flex-1 font-semibold">
                                            {isRetrying ? 'Generating...' : 'Generate missing'}
                                        </span>
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </TooltipProvider>
        );
    }

    // Default variant
    return (
        <TooltipProvider delayDuration={300}>
            <div className="flex items-center gap-2">
                {showGoogleDocs && hasGoogleDocs && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <a
                                href={generatedDocx.googleDocsEditUrl ?? undefined}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Button
                                    color="primary"
                                    variant="solid"
                                    size={showLabels ? 'md' : 'icon-sm'}
                                    className={showLabels ? 'gap-2' : ''}
                                >
                                    <GoogleLogoIcon
                                        className={cn(showLabels ? 'size-4' : 'size-5')}
                                        weight="bold"
                                    />
                                    {showLabels && <span className="hidden md:inline">View in Docs</span>}
                                </Button>
                            </a>
                        </TooltipTrigger>
                        <TooltipContent>View in Google Docs</TooltipContent>
                    </Tooltip>
                )}

                <DropdownMenu>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    className={cn('relative', showLabels ? 'gap-2' : '')}
                                    color="primary"
                                    variant="soft"
                                    size={showLabels ? 'md' : 'icon-sm'}
                                    disabled={isRegenerating || isRetrying}
                                >
                                    {isRetrying ? (
                                        <Spinner className={cn(showLabels ? 'size-4' : 'size-5')} />
                                    ) : (
                                        <DownloadSimpleIcon
                                            className={cn(showLabels ? 'size-4' : 'size-5')}
                                            weight="bold"
                                        />
                                    )}
                                    {showLabels && <span className="hidden sm:inline">Download</span>}
                                    {hasFailedOrMissing && !isRetrying && (
                                        <div className="bg-warning-100 text-warning-600 dark:bg-warning-950 dark:text-warning-400 absolute top-0 right-0 -mt-0.5 -mr-0.5 flex size-[18px] items-center justify-center rounded-full">
                                            <WarningCircleIcon className="size-3" weight="duotone" />
                                        </div>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                            {hasFailedOrMissing
                                ? `${missingCount} format${missingCount !== 1 ? 's' : ''} unavailable`
                                : `${readyFormats.length} format${readyFormats.length !== 1 ? 's' : ''} available`}
                        </TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent align="end" className="w-52 max-w-[calc(100vw-2rem)]">
                        <div className="flex flex-col">
                            {googleDocsCopyUrl && (
                                <>
                                    <DropdownMenuItem asChild>
                                        <a href={googleDocsCopyUrl} target="_blank" rel="noopener noreferrer">
                                            <GoogleLogoIcon className="size-4" weight="bold" />
                                            <span>Make a copy</span>
                                        </a>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                </>
                            )}
                            {formatStates.map((format) => {
                                const Icon = format.icon;
                                const isLoading = loadingFormat === format.key;

                                return (
                                    <DropdownMenuItem
                                        key={format.key}
                                        onClick={(e) =>
                                            format.isReady &&
                                            handleDownload(e, format.key as DriveExportFormat)
                                        }
                                        disabled={!format.isReady || isLoading}
                                        className="cursor-pointer gap-3"
                                    >
                                        <div className="relative shrink-0">
                                            {isLoading ? (
                                                <Spinner className="size-5" />
                                            ) : (
                                                <Icon
                                                    className={cn(
                                                        'size-5 transition-colors',
                                                        format.isReady
                                                            ? 'text-surface-600 dark:text-surface-300'
                                                            : 'text-surface-300 dark:text-surface-600',
                                                    )}
                                                    weight="duotone"
                                                />
                                            )}
                                            {!isLoading && format.hasFailed && (
                                                <div className="bg-destructive-500 ring-surface-2 dark:ring-surface-950 absolute -top-1 -right-1 size-2.5 rounded-full ring-2" />
                                            )}
                                        </div>

                                        <span
                                            className={cn(
                                                'flex-1 truncate transition-colors',
                                                format.isReady
                                                    ? 'text-surface-900 dark:text-surface-50'
                                                    : 'text-surface-400 dark:text-surface-600',
                                            )}
                                        >
                                            {format.label}
                                        </span>

                                        <div className="flex items-center gap-2 tabular-nums">
                                            {format.isReady && format.size && (
                                                <span className="text-surface-400 dark:text-surface-500 text-[10px] font-medium tracking-tight">
                                                    {formatFileSize(format.size)}
                                                </span>
                                            )}
                                            {!format.isReady && format.hasFailed && (
                                                <span className="text-destructive-500 text-[10px] font-bold tracking-tighter uppercase">
                                                    Error
                                                </span>
                                            )}
                                            {!format.isReady && !format.hasFailed && (
                                                <span className="text-surface-300 dark:text-surface-700 text-xs">
                                                    —
                                                </span>
                                            )}
                                        </div>
                                    </DropdownMenuItem>
                                );
                            })}
                        </div>

                        {hasFailedOrMissing && hasGoogleDriveFile && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={handleRetryAll}
                                    disabled={isRetrying}
                                    className="focus:text-accent-500 dark:focus:text-accent-400 cursor-pointer gap-3"
                                >
                                    {isRetrying ? (
                                        <Spinner className="size-4 shrink-0" />
                                    ) : (
                                        <ArrowsCounterClockwiseIcon
                                            className="size-4 shrink-0"
                                            weight="bold"
                                        />
                                    )}
                                    <span className="flex-1 font-semibold">
                                        {isRetrying ? 'Generating...' : 'Generate missing'}
                                    </span>
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </TooltipProvider>
    );
}
