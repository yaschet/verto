/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { env } from '@/env';
import { getSignedUrl } from '@/actions/storage/get-signed-url';
import { standardizeError } from '@/errors/api-errors';
import type { ApiErrorType } from '@/types/rest/errors';

type UseDownloadOriginalOptions = {
    fileUrl: string;
};

export function useDownloadOriginal({ fileUrl }: UseDownloadOriginalOptions) {
    const mutation = useMutation({
        mutationFn: async () => {
            const bucketName = env.NEXT_PUBLIC_FILE_UPLOAD_BUCKET;

            // 1. Get Signed URL
            const response = await getSignedUrl({
                bucket: bucketName,
                fileName: fileUrl,
            });

            if (response?.error) {
                throw response;
            }

            const signedUrl = response?.data?.signedUrl;

            if (!signedUrl) {
                throw standardizeError({
                    description: 'Could not generate a secure download link. Please try again.',
                    message: 'Download failed',
                    title: 'Error',
                });
            }

            // 2. Open in new tab
            if (typeof window !== 'undefined') {
                window.open(signedUrl, '_blank');
            } else {
                throw standardizeError({
                    description: 'Window not available for redirect.',
                    message: 'Download failed',
                    title: 'Error',
                });
            }

            return response;
        },
        onError: (error: (Error & Partial<ApiErrorType>) | ApiErrorType | unknown) => {
            const err = error as { title?: string; message?: string; description?: string };
            toast.error(err.title ?? err.message ?? 'Error', {
                description: err.description ?? 'Failed to download original file. Please try again.',
            });
        },
        // No success toast needed as the browser handling the download is sufficient feedback
    });

    return {
        download: mutation.mutate,
        isDownloading: mutation.isPending,
    };
}
