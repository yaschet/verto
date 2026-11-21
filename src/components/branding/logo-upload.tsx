/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import ImageIcon from 'next/image';
import {
    TrashIcon,
    ImageIcon as PhosphorImageIcon,
    SpinnerIcon,
    PencilSimpleIcon,
    ImageBrokenIcon,
} from '@phosphor-icons/react';
import { cn } from '@library/utils';
import { useTusUpload } from '@components/ui/file-dropzone/use-tus-upload';
import { validateLogoFile } from '@schemas/branding-schemas';
import { LOGO_CONSTRAINTS } from '@/types/document/branding-settings';
import useSession from '@hooks/queries/auth/use-session';
import { toast } from 'sonner';
import { env } from '@/env';

type LogoUploadProps = {
    value: string | null;
    onChange: (url: string | null) => void;
    disabled?: boolean;
};

/**
 * Logo upload component for document branding
 * Compact design: click to upload/change, hover overlay for actions
 */
export function LogoUpload({ value, onChange, disabled = false }: LogoUploadProps) {
    const session = useSession();
    const [isDragging, setIsDragging] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(value);
    const [imageError, setImageError] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync previewUrl when value prop changes (e.g., from server)
    useEffect(() => {
        setPreviewUrl(value);
        setImageError(false);
    }, [value]);

    // TUS upload hook
    const { startUpload, progress, status, reset, abort } = useTusUpload({
        userId: session?.user?.id || '',
        accessToken: session?.access_token || '',
        bucketName: 'document_logos',
        onSuccess: (fileName) => {
            const publicUrl = `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/document_logos/${fileName}`;
            onChange(publicUrl);
            setPreviewUrl(publicUrl);
            setImageError(false);
            toast.success('Logo uploaded');
        },
        onError: (error) => {
            toast.error('Upload failed', { description: error.message });
            setImageError(true);
            reset();
        },
    });

    const handleFileSelect = useCallback(
        (file: File) => {
            const validation = validateLogoFile(file);
            if (!validation.success) {
                toast.error('Invalid file', { description: validation.error });
                return;
            }

            if (!session?.user?.id) {
                toast.error('Please sign in to upload');
                return;
            }

            const extension = file.name.split('.').pop() || 'png';
            const fileName = `${session.user.id}/${Date.now()}.${extension}`;

            setPreviewUrl(URL.createObjectURL(file));
            setImageError(false);
            startUpload(file, fileName);
        },
        [session, startUpload],
    );

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            if (disabled || status === 'uploading') return;

            const file = e.dataTransfer.files[0];
            if (file) handleFileSelect(file);
        },
        [disabled, status, handleFileSelect],
    );

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
            e.target.value = '';
        },
        [handleFileSelect],
    );

    const handleRemove = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            if (status === 'uploading') abort();
            setPreviewUrl(null);
            onChange(null);
        },
        [status, abort, onChange],
    );

    const triggerFileInput = useCallback(() => {
        if (!disabled && status !== 'uploading') {
            inputRef.current?.click();
        }
    }, [disabled, status]);

    const isUploading = status === 'uploading';
    const hasLogo = !!previewUrl || !!value;

    return (
        <div className="space-y-1.5">
            {/* Hidden file input */}
            <input
                ref={inputRef}
                type="file"
                accept={LOGO_CONSTRAINTS.allowedMimeTypes.join(',')}
                onChange={handleInputChange}
                disabled={disabled || isUploading}
                className="sr-only"
            />

            {/* Upload zone / Preview */}
            <div
                role="button"
                tabIndex={disabled ? -1 : 0}
                onClick={triggerFileInput}
                onKeyDown={(e) => e.key === 'Enter' && triggerFileInput()}
                onDrop={handleDrop}
                onDragOver={(e) => {
                    e.preventDefault();
                    if (!disabled && !isUploading) setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                className={cn(
                    'group relative flex items-center justify-center',
                    'w-full h-[80px] rounded-xl',
                    'transition-all duration-150 cursor-pointer',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
                    // Empty state
                    !hasLogo && 'border-2 border-dashed',
                    !hasLogo &&
                        !isDragging &&
                        'border-surface-300 dark:border-surface-700 bg-surface-50 dark:bg-surface-900/50',
                    !hasLogo &&
                        !isDragging &&
                        'hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-950/30',
                    // Dragging state
                    isDragging && 'border-primary-500 bg-primary-50 dark:bg-primary-950/40',
                    // Has logo state
                    hasLogo &&
                        'border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900',
                    // Disabled
                    disabled && 'opacity-50 cursor-not-allowed',
                )}
            >
                {hasLogo ? (
                    <>
                        {/* Logo preview or error fallback */}
                        {imageError ? (
                            <div className="flex flex-col items-center justify-center gap-1 text-surface-400">
                                <ImageBrokenIcon className="size-6" weight="duotone" />
                                <span className="text-xs">Failed to load</span>
                            </div>
                        ) : (
                            <ImageIcon
                                src={previewUrl || value || ''}
                                alt="Company logo"
                                fill
                                className="object-contain p-3"
                                unoptimized
                                onError={() => setImageError(true)}
                            />
                        )}

                        {/* Hover overlay - Change/Remove */}
                        {!isUploading && !disabled && (
                            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-150 rounded-xl">
                                <span className="flex items-center gap-1.5 text-white text-xs font-medium">
                                    <PencilSimpleIcon className="size-4" weight="bold" />
                                    Change
                                </span>
                                <span className="text-white/50">|</span>
                                <button
                                    type="button"
                                    onClick={handleRemove}
                                    className="flex items-center gap-1 text-red-400 hover:text-red-300 text-xs font-medium transition-colors"
                                >
                                    <TrashIcon className="size-4" weight="bold" />
                                    Remove
                                </button>
                            </div>
                        )}

                        {/* Upload progress overlay */}
                        {isUploading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-xl">
                                <div className="flex items-center gap-2 text-white">
                                    <SpinnerIcon className="size-5 animate-spin" />
                                    <span className="text-sm font-medium">{progress}%</span>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    // Empty state
                    <div className="flex flex-col items-center justify-center gap-1">
                        <PhosphorImageIcon
                            className={cn(
                                'size-6 transition-colors',
                                isDragging
                                    ? 'text-primary-500'
                                    : 'text-surface-400 group-hover:text-primary-500',
                            )}
                        />
                        <span
                            className={cn(
                                'text-xs transition-colors',
                                isDragging
                                    ? 'text-primary-600 dark:text-primary-400'
                                    : 'text-surface-500 group-hover:text-primary-600 dark:group-hover:text-primary-400',
                            )}
                        >
                            {isDragging ? 'Drop here' : 'Click or drag to upload'}
                        </span>
                    </div>
                )}
            </div>

            {/* File constraints hint */}
            <p className="text-[10px] text-surface-400 text-center">
                PNG, JPG, SVG · {LOGO_CONSTRAINTS.recommendedWidthPx}px+ wide recommended · Max{' '}
                {LOGO_CONSTRAINTS.maxFileSizeBytes / 1024 / 1024}MB
            </p>
        </div>
    );
}
