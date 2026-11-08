/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { Fragment } from 'react';
import {
    ArrowsCounterClockwiseIcon,
    DotsThreeIcon,
    FileDocIcon,
    DownloadSimpleIcon,
    PencilSimpleIcon,
    TrashIcon,
    TranslateIcon,
} from '@phosphor-icons/react';
import { Spinner } from '@components/ui/spinner';
import Link from 'next/link';
import { Button } from '@components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@components/ui/dropdown-menu';
import { ExportDropdown, type ExportStatus } from '@components/exports/export-dropdown';
import { cn } from '@library/utils';
import type { UploadedDocumentUrls } from '@utils/gcp/docx/functions/generate-google-doc-and-exports';

type TranslationActionsBarProps = {
    translationId: string;
    generatedDocx: UploadedDocumentUrls | null;
    exportStatus: ExportStatus | null;
    /** User can edit (status === 'ready' or 'completed') */
    canEdit: boolean;
    /** Translation failed (status === 'failed' || 'canceled') */
    isFailed: boolean;
    /** Translation is processing */
    isProcessing: boolean;
    /** User has pending edits not yet regenerated */
    hasUserEdits?: boolean;
    /** Opens RetryTranslationModal (for failed translations) */
    onRetry: () => void;
    /** Opens RetranslateConfirmationModal (for ready translations wanting fresh start) */
    onRetranslate?: () => void;
    /** Triggers document regeneration (always available for ready state) */
    onRegenerate?: () => void;
    /** Whether regeneration is in progress */
    isRegenerating?: boolean;
    /** Opens DeleteTranslationModal */
    /** Opens DeleteTranslationModal */
    onDelete: () => void;
    /** Original file URL for downloading source */
    fileUrl?: string | null;
    /** Handler for downloading original file */
    onDownloadOriginal?: () => void;
    /** Loading state for original file download */
    isDownloadingOriginal?: boolean;
};

/**
 * Translation Actions Bar
 *
 * State-based action bar with distinct controls:
 *
 * READY/COMPLETED state:
 * - Edit (primary) - Links to review page
 * - Export dropdown - Google Docs + downloads
 * - Menu: Regenerate (always available), Retranslate, Delete
 *
 * FAILED state:
 * - Retry (warning) - Opens retry modal with stage options
 * - Menu: Delete
 *
 * PROCESSING state:
 * - No actions (disabled)
 * - Menu: (Future: Cancel)
 */
export function TranslationActionsBar({
    translationId,
    generatedDocx,
    exportStatus,
    canEdit,
    isFailed,
    hasUserEdits = false,
    onRetry,
    onRetranslate,
    onRegenerate,
    isRegenerating = false,
    onDelete,
    fileUrl,
    onDownloadOriginal,
    isDownloadingOriginal = false,
}: TranslationActionsBarProps) {
    const hasAnyExport = generatedDocx?.downloadUrl || generatedDocx?.googleDocsEditUrl;
    const showExports = canEdit || hasAnyExport;

    return (
        <div className="flex items-center gap-2">
            {/* Export Dropdown - Google Docs + downloads */}
            {showExports && (
                <ExportDropdown
                    translationId={translationId}
                    generatedDocx={generatedDocx}
                    exportStatus={exportStatus}
                    showGoogleDocs={true}
                    variant="default"
                />
            )}

            {/* === READY STATE === */}
            {canEdit && (
                <Link href={`/app/translations/${translationId}/review`}>
                    <Button className="gap-2" color="primary" variant="soft">
                        <PencilSimpleIcon className="size-4" weight="bold" />
                        <span className="hidden sm:inline">Edit</span>
                    </Button>
                </Link>
            )}

            {/* === FAILED STATE === */}
            {isFailed && (
                <Button className="gap-2" color="warning" variant="soft" onClick={onRetry}>
                    <ArrowsCounterClockwiseIcon className="size-4" weight="bold" />
                    <span className="hidden sm:inline">Retry</span>
                </Button>
            )}

            {/* Three-dot menu - Context-dependent options */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button color="primary" variant="soft" size="icon">
                        <DotsThreeIcon className="size-5" weight="bold" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 max-w-[calc(100vw-2rem)]">
                    {/* READY state menu options */}
                    {canEdit && (
                        <Fragment>
                            {/* Regenerate Document - Always available for ready translations */}
                            {onRegenerate && (
                                <DropdownMenuItem
                                    onClick={onRegenerate}
                                    disabled={isRegenerating}
                                    className="gap-3 py-3"
                                >
                                    <FileDocIcon
                                        className="size-5 shrink-0 text-surface-500"
                                        weight="duotone"
                                    />
                                    <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-medium truncate">Regenerate Document</span>
                                            {hasUserEdits && (
                                                <span className="shrink-0 text-[10px] font-bold text-warning-600 dark:text-warning-400 bg-warning-100 dark:bg-warning-900/30 px-1.5 py-0.5 rounded-full">
                                                    EDITS
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs text-surface-400 truncate">
                                            {hasUserEdits
                                                ? 'Apply pending edits & rebuild exports'
                                                : 'Rebuild document exports from scratch'}
                                        </span>
                                    </div>
                                </DropdownMenuItem>
                            )}

                            {/* Retranslate - Fresh start */}
                            {onRetranslate && (
                                <DropdownMenuItem onClick={onRetranslate} className="gap-3 py-3">
                                    <TranslateIcon
                                        className="size-5 shrink-0 text-surface-500"
                                        weight="duotone"
                                    />
                                    <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                                        <span className="font-medium truncate">Retranslate</span>
                                        <span className="text-xs text-surface-400 truncate">
                                            Discard current and start fresh
                                        </span>
                                    </div>
                                </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />
                        </Fragment>
                    )}

                    {fileUrl && (
                        <Fragment>
                            <DropdownMenuItem
                                onClick={onDownloadOriginal}
                                disabled={isDownloadingOriginal}
                                className="gap-3 py-3"
                            >
                                {isDownloadingOriginal ? (
                                    <Spinner className="size-5 shrink-0" />
                                ) : (
                                    <DownloadSimpleIcon
                                        className="size-5 shrink-0 text-surface-500"
                                        weight="duotone"
                                    />
                                )}
                                <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                                    <span className="font-medium truncate">
                                        {isDownloadingOriginal ? 'Redirecting...' : 'Download Original'}
                                    </span>
                                    <span className="text-xs text-surface-400 truncate">
                                        {isDownloadingOriginal ? 'Getting secure link' : 'Source file'}
                                    </span>
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                        </Fragment>
                    )}

                    {/* Delete - Always available */}
                    <DropdownMenuItem
                        onClick={onDelete}
                        className={cn(
                            'gap-3 py-3',
                            'text-destructive-500 font-bold',
                            'focus:bg-destructive-500 focus:font-bold focus:text-destructive-50',
                            'dark:focus:bg-destructive-500 dark:focus:text-destructive-50',
                        )}
                    >
                        <TrashIcon className="size-5 shrink-0" weight="duotone" />
                        <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                            <span className="truncate">Delete</span>
                            <span className="text-[10px] uppercase tracking-wider opacity-75 truncate">
                                Permanently remove
                            </span>
                        </div>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
