/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import {
    CheckCircleIcon,
    CloudArrowUpIcon,
    FileIcon as PhosphorFileIcon,
    ImageIcon as PhosphorImageIcon,
    TrashIcon,
    UploadSimpleIcon,
} from '@phosphor-icons/react';
import { useCallback, useRef, useState } from 'react';
import ShortUniqueId from 'short-unique-id';
import { UploadProgress } from '@/components/ui/file-dropzone/upload-progress';
import { useTusUpload } from '@/components/ui/file-dropzone/use-tus-upload';
import { env } from '@/env';
import { Button } from '@components/ui/button';
import { cn } from '@library/utils';
import type { FileDropzoneProps } from '@/components/ui/file-dropzone/file-dropzone.types';

// Default allowed MIME types
const DEFAULT_ACCEPT = env.NEXT_PUBLIC_FILE_UPLOAD_BUCKET_ALLOWED_MIME_TYPES?.split(',').map((type: string) =>
    type.trim(),
) ?? ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'application/pdf'];

// Default max size: 50MB
const DEFAULT_MAX_SIZE = 50 * 1024 * 1024;

/**
 * Generate a standardized file name for storage.
 * Preserves the naming convention from the original FilePond implementation.
 */
function generateFileName(file: File, userId: string): string {
    // Clean the filename
    const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, '');
    const cleanName = nameWithoutExtension
        .replace(/[^a-zA-Z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_');

    // Get extension
    const extension = file.name.split('.').pop() || 'bin';

    // Generate unique ID
    const uid = new ShortUniqueId({ length: 12, shuffle: true });
    const uniqueId = uid.rnd();

    // Create folder path with date
    const folder = `${userId}/uploads/${new Date().toISOString().split('T')[0]}`;

    return `${folder}/${uniqueId}_${cleanName}.${extension}`;
}

/**
 * Format file size for display.
 */
function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Get human-readable file type labels.
 */
function getAcceptedTypesLabel(accept: string[]): string {
    const typeMap: Record<string, string> = {
        'image/jpeg': 'JPEG',
        'image/jpg': 'JPG',
        'image/png': 'PNG',
        'image/heic': 'HEIC',
        'image/heif': 'HEIF',
        'application/pdf': 'PDF',
    };

    const labels = accept.map((type) => typeMap[type] || type.split('/')[1]?.toUpperCase() || type);

    if (labels.length === 1) return labels[0];
    if (labels.length === 2) return `${labels[0]} or ${labels[1]}`;

    const allButLast = labels.slice(0, -1).join(', ');
    return `${allButLast}, or ${labels[labels.length - 1]}`;
}

/**
 * FileDropzone Component
 *
 * A beautiful, responsive file upload dropzone with TUS resumable upload support.
 * Fully styled for light and dark modes.
 */
export function FileDropzone({
    accept = DEFAULT_ACCEPT,
    accessToken,
    bucketName,
    className,
    disabled = false,
    idleLabel,
    maxSize = DEFAULT_MAX_SIZE,
    onChange,
    onRemove,
    userId,
    value,
}: FileDropzoneProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [currentFile, setCurrentFile] = useState<File | null>(null);
    const [generatedFileName, setGeneratedFileName] = useState<string | null>(null);

    // TUS upload hook
    const { abort, error, progress, reset, startUpload, status } = useTusUpload({
        accessToken: accessToken || '',
        userId,
        bucketName,
        onSuccess: (fileName) => {
            onChange(fileName);
        },
        onError: (err) => {
            console.error('Upload failed:', err.message);
        },
    });

    // Validate file
    const validateFile = useCallback(
        (file: File): string | null => {
            // Check type
            if (!accept.includes(file.type)) {
                return `File type not allowed. Accepted: ${getAcceptedTypesLabel(accept)}`;
            }

            // Check size
            if (file.size > maxSize) {
                return `File too large. Maximum size: ${formatFileSize(maxSize)}`;
            }

            return null;
        },
        [accept, maxSize],
    );

    // Handle file selection
    const handleFileSelect = useCallback(
        (file: File) => {
            setValidationError(null);
            reset();

            // Validate
            const error = validateFile(file);
            if (error) {
                setValidationError(error);
                return;
            }

            // Generate file name
            const fileName = generateFileName(file, userId);

            // Store file and name
            setCurrentFile(file);
            setGeneratedFileName(fileName);

            // Start upload
            startUpload(file, fileName);
        },
        [userId, validateFile, reset, startUpload],
    );

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
        // Reset input so same file can be selected again
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    // Drag handlers
    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (disabled) return;

        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    // Handle click to open file picker
    const handleClick = () => {
        if (!disabled && status !== 'uploading') {
            inputRef.current?.click();
        }
    };

    // Handle file removal
    const handleRemove = async () => {
        if (value && onRemove) {
            await onRemove(value);
        }
        setCurrentFile(null);
        setGeneratedFileName(null);
        reset();
        onChange('');
    };

    // Handle retry
    const handleRetry = () => {
        if (currentFile && generatedFileName) {
            reset();
            startUpload(currentFile, generatedFileName);
        }
    };

    // Determine what to render
    const isUploading = status === 'uploading';
    const isComplete = status === 'complete' || !!value;
    const isError = status === 'error' || !!validationError;

    // Get file icon based on type
    const FileTypeIcon = currentFile?.type.startsWith('image/') ? PhosphorImageIcon : PhosphorFileIcon;

    return (
        <div className={cn('mt-1 w-full space-y-3', className)}>
            {/* Validation Error */}
            {validationError && (
                <div className="border-destructive-200 bg-destructive-50/50 text-destructive-600 dark:border-destructive-800 dark:bg-destructive-950/30 dark:text-destructive-400 rounded-lg border p-3 text-sm">
                    {validationError}
                </div>
            )}

            {/* Upload Progress */}
            {(isUploading || (isError && !validationError)) && currentFile && (
                <UploadProgress
                    errorMessage={error?.message}
                    fileName={currentFile.name}
                    progress={progress}
                    status={status}
                    onCancel={abort}
                    onRetry={handleRetry}
                />
            )}

            {/* Completed State - File Preview */}
            {isComplete && !isUploading && currentFile && (
                <div className="border-success-200 bg-success-50/50 dark:border-success-800 dark:bg-success-950/30 flex items-center gap-4 rounded-xl border p-4">
                    {/* File Icon */}
                    <div className="bg-success-100/50 text-success-600 ring-success-200 dark:bg-success-900/30 dark:text-success-400 dark:ring-success-800 flex-shrink-0 rounded-lg p-2.5 ring-1">
                        <FileTypeIcon className="size-5" weight="duotone" />
                    </div>

                    {/* File Info */}
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <p className="text-foreground truncate text-sm font-semibold">
                                {currentFile.name}
                            </p>
                            <CheckCircleIcon
                                className="text-success-600 dark:text-success-400 size-4 flex-shrink-0"
                                weight="fill"
                            />
                        </div>
                        <p className="text-success-600 dark:text-success-400 text-xs">
                            Uploaded ({formatFileSize(currentFile.size)})
                        </p>
                    </div>

                    {/* Remove Button */}
                    <Button
                        color="destructive"
                        size="icon-sm"
                        tooltipContent="Remove file"
                        type="button"
                        variant="soft"
                        onClick={handleRemove}
                    >
                        <TrashIcon className="size-4" weight="duotone" />
                    </Button>
                </div>
            )}

            {/* Dropzone - Only show when no file is uploaded */}
            {!isComplete && !isUploading && (
                <div
                    className={cn(
                        // Base styles
                        'group relative isolate cursor-pointer overflow-hidden',
                        'flex flex-col items-center justify-center',
                        'rounded-2xl border-2 border-dashed',
                        'transition-all duration-200 ease-out',

                        // Responsive sizing
                        'min-h-[180px] p-6',
                        'sm:min-h-[200px] sm:p-8',
                        'lg:min-h-[240px] lg:p-12',

                        // Default state
                        'border-surface-300 bg-surface-50/50',
                        'hover:border-primary-400 hover:bg-surface-100/60',
                        'dark:border-surface-700 dark:bg-surface-900/30',
                        'dark:hover:border-primary-600 dark:hover:bg-surface-800/40',

                        // Focus state
                        'focus-visible:ring-4 focus-visible:outline-none',
                        'focus-visible:ring-primary-200/50 dark:focus-visible:ring-primary-800/40',

                        // Dragging state
                        isDragging && [
                            'border-primary-400 bg-primary-50/80 scale-[1.02]',
                            'dark:border-primary-600 dark:bg-primary-950/30',
                        ],

                        // Disabled state
                        disabled && 'pointer-events-none cursor-not-allowed opacity-50',
                    )}
                    onClick={handleClick}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    {/* Background Pattern */}
                    <div className="absolute inset-0 -z-10 opacity-[0.03] dark:opacity-[0.02]">
                        <div className="from-primary-500 to-accent-500 absolute inset-0 bg-gradient-to-br" />
                    </div>

                    <div className="relative z-10 flex flex-col items-center gap-4">
                        {/* Upload Icon */}
                        <div
                            className={cn(
                                'relative rounded-2xl p-5 transition-all duration-200',
                                'from-surface-100 to-surface-200 bg-gradient-to-br',
                                'dark:from-surface-800 dark:to-surface-900',
                                'ring-surface-200 dark:ring-surface-700 ring-1',
                                'group-hover:from-primary-50 group-hover:to-primary-100',
                                'dark:group-hover:from-primary-900 dark:group-hover:to-primary-800',
                                'group-hover:ring-primary-200 dark:group-hover:ring-primary-600',
                                isDragging && [
                                    'from-primary-100 to-primary-200 scale-110',
                                    'dark:from-primary-900 dark:to-primary-800',
                                ],
                            )}
                        >
                            {isDragging ? (
                                <CloudArrowUpIcon
                                    className="text-primary-600 dark:text-primary-400 size-10 sm:size-12"
                                    weight="duotone"
                                />
                            ) : (
                                <UploadSimpleIcon
                                    className={cn(
                                        'size-10 transition-colors duration-200 sm:size-12',
                                        'text-surface-600 dark:text-surface-400',
                                        'group-hover:text-primary-500 dark:group-hover:text-primary-400',
                                    )}
                                    weight="duotone"
                                />
                            )}
                        </div>

                        {/* Text */}
                        <div className="flex flex-col items-center gap-2">
                            <p className="text-foreground text-center text-sm font-semibold sm:text-base">
                                {idleLabel || (
                                    <>
                                        <span className="text-muted-foreground">
                                            Drag & drop your file or{' '}
                                        </span>
                                        <span className="text-primary">Browse</span>
                                    </>
                                )}
                            </p>
                            <p className="text-muted-foreground/70 max-w-xs text-center text-xs sm:text-sm">
                                {getAcceptedTypesLabel(accept)} &bull; Max {formatFileSize(maxSize)}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden File Input */}
            <input
                ref={inputRef}
                accept={accept.join(',')}
                className="hidden"
                disabled={disabled || isUploading}
                type="file"
                onChange={handleInputChange}
            />
        </div>
    );
}
