/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import {
    ArrowCounterClockwiseIcon,
    CheckCircleIcon,
    FileIcon,
    WarningCircleIcon,
    XIcon,
} from '@phosphor-icons/react';
import { Button } from '@components/ui/button';
import { Progress } from '@components/ui/progress';
import { cn } from '@library/utils';
import type { UploadProgressProps } from '@/components/ui/file-dropzone/file-dropzone.types';

/**
 * Upload progress indicator component.
 *
 * Displays file upload status with progress bar and action buttons.
 */
export function UploadProgress({
    errorMessage,
    fileName,
    onCancel,
    onRetry,
    progress,
    status,
}: UploadProgressProps) {
    return (
        <div
            className={cn(
                'w-full rounded-xl border p-4 transition-all duration-200',
                // Status-based styling
                status === 'uploading' &&
                    'border-info-200 bg-info-50/50 dark:border-info-800 dark:bg-info-950/30',
                status === 'complete' &&
                    'border-success-200 bg-success-50/50 dark:border-success-800 dark:bg-success-950/30',
                status === 'error' &&
                    'border-destructive-200 bg-destructive-50/50 dark:border-destructive-800 dark:bg-destructive-950/30',
            )}
        >
            <div className="flex items-start gap-4">
                {/* File Icon */}
                <div
                    className={cn(
                        'flex-shrink-0 rounded-lg p-2.5 ring-1',
                        status === 'uploading' &&
                            'bg-info-100/50 text-info-600 ring-info-200 dark:bg-info-900/30 dark:text-info-400 dark:ring-info-800',
                        status === 'complete' &&
                            'bg-success-100/50 text-success-600 ring-success-200 dark:bg-success-900/30 dark:text-success-400 dark:ring-success-800',
                        status === 'error' &&
                            'bg-destructive-100/50 text-destructive-600 ring-destructive-200 dark:bg-destructive-900/30 dark:text-destructive-400 dark:ring-destructive-800',
                    )}
                >
                    {status === 'complete' ? (
                        <CheckCircleIcon className="size-5" weight="duotone" />
                    ) : status === 'error' ? (
                        <WarningCircleIcon className="size-5" weight="duotone" />
                    ) : (
                        <FileIcon className="size-5" weight="duotone" />
                    )}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1 space-y-2">
                    {/* File name and status */}
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-foreground truncate text-sm font-semibold">
                            {fileName || 'Uploading file...'}
                        </p>
                        {onCancel && status === 'uploading' && (
                            <Button
                                color="default"
                                size="icon-sm"
                                tooltipContent="Cancel upload"
                                type="button"
                                variant="plain"
                                onClick={onCancel}
                            >
                                <XIcon className="size-4" weight="bold" />
                            </Button>
                        )}
                    </div>

                    {/* Progress bar for uploading state */}
                    {status === 'uploading' && (
                        <div className="space-y-1.5">
                            <Progress color="info" size="md" value={progress} />
                            <p className="text-info-600 dark:text-info-400 text-xs font-medium">
                                Uploading... {progress}%
                            </p>
                        </div>
                    )}

                    {/* Success message */}
                    {status === 'complete' && (
                        <p className="text-success-600 dark:text-success-400 text-xs font-medium">
                            Upload complete
                        </p>
                    )}

                    {/* Error message with retry */}
                    {status === 'error' && (
                        <div className="space-y-2.5">
                            <p className="text-destructive-600 dark:text-destructive-400 text-xs font-medium">
                                {errorMessage || 'Upload failed'}
                            </p>
                            {onRetry && (
                                <Button
                                    color="destructive"
                                    size="sm"
                                    type="button"
                                    variant="outlined"
                                    onClick={onRetry}
                                >
                                    <ArrowCounterClockwiseIcon className="size-4" weight="duotone" />
                                    Retry
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
