/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import dynamic from 'next/dynamic';
import { PdfSkeleton } from './pdf-skeleton';

// Dynamically import viewers to avoid SSR issues
const PdfViewer = dynamic(() => import('./pdf-viewer').then((mod) => ({ default: mod.PdfViewer })), {
    ssr: false,
    loading: () => <PdfSkeleton />,
});

const ImageViewer = dynamic(() => import('./image-viewer').then((mod) => ({ default: mod.ImageViewer })), {
    ssr: false,
    loading: () => <PdfSkeleton />,
});

type DocumentViewerProps = {
    fileUrl: string;
    className?: string;
    isCollapsed?: boolean;
    isResizing?: boolean;
};

/**
 * Detects file type from URL and returns the appropriate type
 */
function getFileType(url: string): 'pdf' | 'image' {
    const urlLower = url.toLowerCase();

    // Extract file extension (handle query params and signed URLs)
    const urlParts = urlLower.split('?')[0];
    const extension = urlParts.split('.').pop() || '';

    // Check for PDF
    if (extension === 'pdf' || urlLower.includes('.pdf')) {
        return 'pdf';
    }

    // Default to image for all other supported types
    // (jpg, jpeg, png, heic, heif)
    return 'image';
}

export function DocumentViewer({ className, fileUrl, isCollapsed, isResizing }: DocumentViewerProps) {
    const fileType = getFileType(fileUrl);

    if (fileType === 'pdf') {
        return (
            <PdfViewer
                className={className}
                fileUrl={fileUrl}
                isCollapsed={isCollapsed}
                isResizing={isResizing}
            />
        );
    }

    return (
        <ImageViewer
            className={className}
            fileUrl={fileUrl}
            isCollapsed={isCollapsed}
            isResizing={isResizing}
        />
    );
}
