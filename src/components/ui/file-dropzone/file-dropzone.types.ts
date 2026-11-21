/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

export type UploadStatus = 'idle' | 'uploading' | 'complete' | 'error';

export type UseTusUploadOptions = {
    accessToken: string;
    userId: string;
    bucketName?: string;
    chunkSize?: number;
    onSuccess?: (fileName: string) => void;
    onError?: (error: Error) => void;
};

export type UseTusUploadReturn = {
    startUpload: (file: File, generatedFileName: string) => void;
    abort: () => void;
    progress: number;
    status: UploadStatus;
    error: Error | null;
    reset: () => void;
};

export type FileDropzoneProps = {
    /** Current file path (controlled) */
    value?: string;

    /** Called with generated file path on successful upload */
    onChange: (value: string) => void;

    /** Called when file is removed - should clean up storage */
    onRemove?: (fileName: string) => Promise<void>;

    /** User ID for file path generation */
    userId: string;

    /** Supabase access token for authenticated uploads */
    accessToken?: string;

    /** Custom bucket name (defaults to env variable) */
    bucketName?: string;

    /** Accepted MIME types */
    accept?: string[];

    /** Maximum file size in bytes (default: 50MB) */
    maxSize?: number;

    /** Additional className */
    className?: string;

    /** Disabled state */
    disabled?: boolean;

    /** Custom idle label */
    idleLabel?: string;

    /** Custom uploading label */
    uploadingLabel?: string;
};

export type UploadProgressProps = {
    /** Upload progress percentage (0-100) */
    progress: number;

    /** Current upload status */
    status: UploadStatus;

    /** File name being uploaded */
    fileName?: string;

    /** Error message if status is 'error' */
    errorMessage?: string;

    /** Called when user clicks retry */
    onRetry?: () => void;

    /** Called when user clicks cancel */
    onCancel?: () => void;
};
