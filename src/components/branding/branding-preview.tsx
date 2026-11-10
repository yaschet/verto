/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { ImageBrokenIcon } from '@phosphor-icons/react';
import { cn } from '@library/utils';
import type { ExtendedBrandingSettings, ProseMirrorJSON } from '@/types/document/branding-settings';

type BrandingPreviewProps = {
    settings: Partial<ExtendedBrandingSettings>;
    sourceLanguage?: string;
    targetLanguage?: string;
    className?: string;
};

// TipTap extensions for HTML rendering
const extensions = [
    StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
    }),
    Link.configure({
        openOnClick: false,
    }),
];

/**
 * Convert ProseMirror JSON to HTML string
 */
function renderProseMirror(content: ProseMirrorJSON | null | undefined): string {
    if (!content) return '';
    try {
        return generateHTML(content as Parameters<typeof generateHTML>[0], extensions);
    } catch {
        return '';
    }
}

/**
 * Check if ProseMirror content has actual text
 */
function hasContent(content: ProseMirrorJSON | null | undefined): boolean {
    if (!content || !content.content) return false;
    return content.content.some((node) => {
        if (node.text) return true;
        if (node.content) return hasContent(node as ProseMirrorJSON);
        return false;
    });
}

/**
 * Live document preview showing header and footer with branding
 */
export function BrandingPreview({
    settings,
    sourceLanguage = 'French',
    targetLanguage = 'English',
    className,
}: BrandingPreviewProps) {
    const {
        headerContent,
        footerContent,
        logoUrl,
        companyName,
        showPageNumbers = true,
        showCertificationStamp = false,
        certificationNumber,
        certificationStampUrl,
        watermarkText,
        watermarkPreset = 'light',
        showTranslationDirection = true,
    } = settings;

    // Track logo loading errors
    const [logoError, setLogoError] = useState(false);

    // Reset error state when logoUrl changes
    useEffect(() => {
        setLogoError(false);
    }, [logoUrl]);

    // Memoize rendered HTML
    const headerLeftHtml = useMemo(() => renderProseMirror(headerContent?.left), [headerContent?.left]);
    const headerRightHtml = useMemo(() => renderProseMirror(headerContent?.right), [headerContent?.right]);
    const certificationHtml = useMemo(
        () => renderProseMirror(footerContent?.certification),
        [footerContent?.certification],
    );
    const companyDetailsHtml = useMemo(
        () => renderProseMirror(footerContent?.companyDetails),
        [footerContent?.companyDetails],
    );

    // Check if we have 3-column header content (left, right, or logo)
    const hasThreeColumnContent =
        hasContent(headerContent?.left) || hasContent(headerContent?.right) || logoUrl;

    // Check if we have any header content (including fallback company name)
    const hasHeader = hasThreeColumnContent || companyName;

    // Check if we have any footer content
    const hasFooter =
        hasContent(footerContent?.certification) ||
        hasContent(footerContent?.companyDetails) ||
        showPageNumbers ||
        (showCertificationStamp && (certificationNumber || certificationStampUrl));

    const watermark = useMemo(() => watermarkText?.trim().toUpperCase() ?? '', [watermarkText]);
    const watermarkStyle = useMemo(() => {
        switch (watermarkPreset) {
            case 'dark':
                return { opacity: 0.26, fontSize: 22, gapX: 56, gapY: 34 };
            case 'light':
            default:
                return { opacity: 0.12, fontSize: 18, gapX: 72, gapY: 42 };
            case 'off':
                return { opacity: 0, fontSize: 0, gapX: 0, gapY: 0 };
        }
    }, [watermarkPreset]);

    return (
        <div className={cn('relative', className)}>
            {/* Background "desk" surface - gives context for floating paper */}
            <div className="rounded-2xl bg-gradient-to-b from-surface-100 to-surface-200 dark:from-surface-900 dark:to-surface-800 p-4 sm:p-6 pb-3 sm:pb-4">
                {/* Floating Paper - with layered shadows (Josh Comeau technique)
                    Responsive: constrained width maintains A4 ratio, centered in desk
                    Max width calculated: 420px height × (8.5/11) = 324px
                */}
                <div
                    className="mx-auto w-full max-w-[280px] sm:max-w-[324px] bg-white dark:bg-surface-950 rounded-sm overflow-hidden"
                    style={{
                        // Layered shadows for realistic paper depth
                        // Color-matched to surface (not pure black)
                        boxShadow: [
                            '0 1px 1px hsl(220deg 60% 50% / 0.04)',
                            '0 2px 2px hsl(220deg 60% 50% / 0.04)',
                            '0 4px 4px hsl(220deg 60% 50% / 0.04)',
                            '0 8px 8px hsl(220deg 60% 50% / 0.04)',
                            '0 16px 16px hsl(220deg 60% 50% / 0.04)',
                            '0 0 0 1px hsl(220deg 20% 80% / 0.3)', // Subtle border
                        ].join(', '),
                    }}
                >
                    {/* Document Preview - A4/Letter aspect ratio (8.5:11)
                        Font size mapping (document → preview):
                        - 12pt body → 10px (not shown, placeholder bars)
                        - 11pt company name → 10px
                        - 9pt header columns, translation direction, certification → 8px
                        - 8pt company details, page numbers → 7px
                    */}
                    <div className="aspect-[8.5/11] relative">
                        {/* Watermark preview (behind content) */}
                        {!!watermark && (
                            <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden">
                                <div
                                    className="absolute left-1/2 top-1/2"
                                    style={{ transform: 'translate(-50%, -50%) rotate(-45deg)' }}
                                >
                                    <div
                                        className="grid"
                                        style={{
                                            gap: watermarkStyle.gapY,
                                            opacity: watermarkStyle.opacity,
                                        }}
                                    >
                                        {Array.from({ length: 4 }).map((_, rowIndex) => (
                                            <div
                                                key={rowIndex}
                                                className="flex whitespace-nowrap"
                                                style={{ gap: watermarkStyle.gapX }}
                                            >
                                                {Array.from({ length: 6 }).map((__, colIndex) => (
                                                    <span
                                                        key={colIndex}
                                                        className="font-bold tracking-[0.35em] text-surface-700 dark:text-surface-200"
                                                        style={{ fontSize: watermarkStyle.fontSize }}
                                                    >
                                                        {watermark}
                                                    </span>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="relative z-10 flex h-full flex-col leading-tight">
                            {/* Header Section */}
                            {hasHeader && (
                                <div className="border-b border-surface-100 dark:border-surface-800 px-2 sm:px-3 py-2 sm:py-2.5 bg-surface-50/50 dark:bg-surface-900/30">
                                    {/* 3-Column Header - only render if there's column content */}
                                    {/* Font sizes: columns = 9pt (8px preview), logo centered */}
                                    {hasThreeColumnContent && (
                                        <div className="grid grid-cols-3 gap-1 sm:gap-1.5 items-start min-h-[28px] sm:min-h-[32px]">
                                            {/* Left Column - 9pt (8px preview) */}
                                            <div
                                                className="prose prose-xs dark:prose-invert max-w-none [&_*]:m-0 [&_*]:text-[6px] sm:[&_*]:text-[7px] [&_*]:leading-tight [&_a]:text-primary"
                                                dangerouslySetInnerHTML={{ __html: headerLeftHtml }}
                                            />

                                            {/* Center - Logo */}
                                            <div className="flex justify-center items-center h-full">
                                                {logoUrl && (
                                                    <div className="relative w-full max-w-[60px] sm:max-w-[80px] h-[22px] sm:h-[28px] flex items-center justify-center">
                                                        {logoError ? (
                                                            <ImageBrokenIcon className="size-3 text-surface-400" />
                                                        ) : (
                                                            <Image
                                                                src={logoUrl}
                                                                alt="Logo"
                                                                fill
                                                                className="object-contain"
                                                                unoptimized
                                                                onError={() => setLogoError(true)}
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right Column - 9pt (8px preview) */}
                                            <div
                                                className="prose prose-xs dark:prose-invert max-w-none text-right [&_*]:m-0 [&_*]:text-[6px] sm:[&_*]:text-[7px] [&_*]:leading-tight [&_a]:text-primary"
                                                dangerouslySetInnerHTML={{ __html: headerRightHtml }}
                                            />
                                        </div>
                                    )}

                                    {/* Company Name - shown as fallback when no 3-column content, or below columns if columns exist */}
                                    {companyName &&
                                        !hasContent(headerContent?.left) &&
                                        !hasContent(headerContent?.right) && (
                                            <div
                                                className={cn(
                                                    'text-center font-semibold text-[7px] sm:text-[8px] text-surface-800 dark:text-surface-200',
                                                    hasThreeColumnContent && 'mt-1',
                                                )}
                                            >
                                                {companyName}
                                            </div>
                                        )}

                                    {/* Language Direction Line */}
                                    {showTranslationDirection && (
                                        <div className="mt-1 sm:mt-1.5 pt-1 sm:pt-1.5 border-t border-surface-200/60 dark:border-surface-700/60 text-center text-surface-500 dark:text-surface-400 italic text-[5px] sm:text-[6px]">
                                            Translation from {sourceLanguage} into {targetLanguage}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Body Placeholder */}
                            <div className="flex-1 px-2 sm:px-3 py-2 sm:py-2.5 overflow-hidden">
                                <div className="space-y-0.5 sm:space-y-1">
                                    {/* Title placeholder */}
                                    <div className="h-2 sm:h-2.5 bg-surface-200/80 dark:bg-surface-700/80 rounded-sm w-2/3" />

                                    {/* Body text placeholders */}
                                    {/* Body text placeholders */}
                                    {[...Array(3)].map((_, i) => (
                                        <div
                                            key={i}
                                            className={cn(
                                                'h-1 sm:h-1.5 bg-surface-100 dark:bg-surface-800 rounded-sm',
                                                i === 2 && 'w-3/4',
                                            )}
                                        />
                                    ))}

                                    {/* Paragraph break */}
                                    <div className="h-1 sm:h-1.5" />

                                    {/* More text */}
                                    {[...Array(2)].map((_, i) => (
                                        <div
                                            key={`b-${i}`}
                                            className={cn(
                                                'h-1 sm:h-1.5 bg-surface-100 dark:bg-surface-800 rounded-sm',
                                                i === 1 && 'w-2/3',
                                            )}
                                        />
                                    ))}
                                </div>

                                {/* Certification Statement - Moved to End of Body */}
                                {hasContent(footerContent?.certification) && (
                                    <div
                                        className="mt-4 mb-2 prose prose-xs dark:prose-invert max-w-none text-left [&_*]:my-0.5 [&_*]:text-[7px] sm:[&_*]:text-[8px] [&_*]:leading-tight text-black dark:text-white"
                                        dangerouslySetInnerHTML={{ __html: certificationHtml }}
                                    />
                                )}

                                {/* Certification Stamp - Inline, End of Document (Right Aligned) */}
                                {showCertificationStamp && certificationStampUrl && (
                                    <div className="flex justify-end mt-4">
                                        <div className="relative w-8 h-8 sm:w-10 sm:h-10">
                                            <Image
                                                src={certificationStampUrl}
                                                alt="Certification stamp"
                                                fill
                                                className="object-contain"
                                                unoptimized
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer Section */}
                            {/* Font sizes: certification = 9pt (8px), company details = 8pt (7px), page numbers = 8pt (7px) */}
                            {hasFooter && (
                                <div className="border-t border-surface-100 dark:border-surface-800 px-2 sm:px-3 py-1.5 sm:py-2 bg-surface-50/50 dark:bg-surface-900/30">
                                    {/* Company Details - 8pt (6-7px preview) */}
                                    {hasContent(footerContent?.companyDetails) && (
                                        <div
                                            className="prose prose-xs dark:prose-invert max-w-none text-center text-surface-500 [&_*]:my-0.5 [&_*]:text-[5px] sm:[&_*]:text-[6px] [&_*]:leading-tight"
                                            dangerouslySetInnerHTML={{ __html: companyDetailsHtml }}
                                        />
                                    )}

                                    {/* Certification Stamp Number (Text Only) */}
                                    {showCertificationStamp && certificationNumber && (
                                        <div className="text-center text-[5px] sm:text-[6px] text-surface-500 italic mt-0.5">
                                            Cert #: {certificationNumber}
                                        </div>
                                    )}

                                    {/* Page Numbers - 8pt (6-7px preview) */}
                                    {showPageNumbers && (
                                        <div className="text-center text-[5px] sm:text-[6px] text-surface-400 mt-0.5">
                                            Page 1 of 1
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Subtle Preview Label - positioned below paper */}
                <p className="text-center mt-2.5 sm:mt-3 text-[9px] sm:text-[10px] text-surface-400 dark:text-surface-500 tracking-wide uppercase">
                    Preview
                </p>
            </div>
        </div>
    );
}
