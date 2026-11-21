/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import mime from 'mime-types';
import { useCallback, useRef, useState } from 'react';
import * as tus from 'tus-js-client';
import { env } from '@/env';
import type {
    UploadStatus,
    UseTusUploadOptions,
    UseTusUploadReturn,
} from '@/components/ui/file-dropzone/file-dropzone.types';

export function useTusUpload(options: UseTusUploadOptions): UseTusUploadReturn {
    const {
        accessToken,
        bucketName = env.NEXT_PUBLIC_FILE_UPLOAD_BUCKET,
        chunkSize = 6 * 1024 * 1024,
        onError, // 6MB chunks
        onSuccess,
    } = options;

    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState<UploadStatus>('idle');
    const [error, setError] = useState<Error | null>(null);
    const uploadRef = useRef<tus.Upload | null>(null);

    const startUpload = useCallback(
        (file: File, generatedFileName: string) => {
            // Reset state
            setStatus('uploading');
            setProgress(0);
            setError(null);

            // Determine MIME type
            const mimeType: string = mime.contentType(file.name) || 'application/octet-stream';

            const upload = new tus.Upload(file, {
                endpoint: `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/upload/resumable`,
                retryDelays: [0, 3000, 5000, 10000, 20000],
                headers: {
                    authorization: `Bearer ${accessToken}`,
                    'x-upsert': 'true',
                },
                uploadDataDuringCreation: true,
                uploadLengthDeferred: false,
                removeFingerprintOnSuccess: true,
                metadata: {
                    bucketName,
                    objectName: generatedFileName,
                    contentType: mimeType,
                    cacheControl: '3600',
                },
                chunkSize,

                onProgress(bytesUploaded, bytesTotal) {
                    const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
                    setProgress(percentage);
                },

                onSuccess() {
                    console.log('Upload complete:', generatedFileName);
                    setStatus('complete');
                    setProgress(100);
                    onSuccess?.(generatedFileName);
                },

                onError(err) {
                    console.error('Upload error:', err.message);
                    setStatus('error');
                    setError(err);
                    onError?.(err);
                },

                onShouldRetry(err) {
                    const statusCode = err.originalResponse ? err.originalResponse.getStatus() : 0;
                    // Don't retry on: 403 (forbidden), 409 (conflict), 429 (rate limited), 404 (not found)
                    return !(
                        statusCode === 403 ||
                        statusCode === 409 ||
                        statusCode === 429 ||
                        statusCode === 404
                    );
                },
            });

            uploadRef.current = upload;

            upload.findPreviousUploads().then((previousUploads) => {
                if (previousUploads.length) {
                    console.log('Resuming previous upload...');
                    upload.resumeFromPreviousUpload(previousUploads[0]);
                }
                upload.start();
            });
        },
        [accessToken, bucketName, chunkSize, onSuccess, onError],
    );

    const abort = useCallback(() => {
        if (uploadRef.current) {
            uploadRef.current.abort();
            uploadRef.current = null;
        }
        setStatus('idle');
        setProgress(0);
    }, []);

    const reset = useCallback(() => {
        if (uploadRef.current) {
            uploadRef.current.abort();
            uploadRef.current = null;
        }
        setStatus('idle');
        setProgress(0);
        setError(null);
    }, []);

    return {
        startUpload,
        abort,
        progress,
        status,
        error,
        reset,
    };
}
