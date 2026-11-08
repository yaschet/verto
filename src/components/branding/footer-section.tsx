/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { useCallback } from 'react';
import { BrandingEditor } from '@components/branding/branding-editor';
import { CertificationStampUpload } from '@components/branding/certification-stamp-upload';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Switch } from '@components/ui/switch';
import type {
    CertificationStampPlacement,
    CertificationStampSize,
    FooterTextContent,
    ProseMirrorJSON,
} from '@/types/document/branding-settings';

type FooterSectionProps = {
    footerContent: FooterTextContent | null;
    showCertificationStamp: boolean;
    certificationNumber: string | null;
    certificationStampUrl: string | null;
    certificationStampPlacement: CertificationStampPlacement;
    certificationStampSize: CertificationStampSize;
    showTranslationDirection: boolean;
    onFooterContentChange: (content: FooterTextContent | null) => void;
    onShowCertificationStampChange: (value: boolean) => void;
    onCertificationNumberChange: (value: string | null) => void;
    onCertificationStampUrlChange: (value: string | null) => void;
    onCertificationStampPlacementChange: (value: CertificationStampPlacement) => void;
    onCertificationStampSizeChange: (value: CertificationStampSize) => void;
    onShowTranslationDirectionChange: (value: boolean) => void;
    disabled?: boolean;
};

/**
 * Footer configuration section with certification and company details
 */
export function FooterSection({
    footerContent,
    showCertificationStamp,
    certificationNumber,
    certificationStampUrl,
    showTranslationDirection,
    onFooterContentChange,
    onShowCertificationStampChange,
    onCertificationNumberChange,
    onCertificationStampUrlChange,
    onShowTranslationDirectionChange,
    disabled = false,
}: FooterSectionProps) {
    // Update specific field in footer content
    const updateFooterContent = useCallback(
        (field: keyof FooterTextContent, value: ProseMirrorJSON | null) => {
            const newContent: FooterTextContent = {
                certification: footerContent?.certification || null,
                companyDetails: footerContent?.companyDetails || null,
                [field]: value,
            };
            // Check if content is completely empty
            const isEmpty = !newContent.certification && !newContent.companyDetails;
            onFooterContentChange(isEmpty ? null : newContent);
        },
        [footerContent, onFooterContentChange],
    );

    return (
        <div className="space-y-6">
            {/* Certification Statement */}
            <div className="space-y-2">
                <Label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                    Certification Statement
                </Label>
                <BrandingEditor
                    content={footerContent?.certification || null}
                    onChange={(c) => updateFooterContent('certification', c)}
                    placeholder="We, [Company Name], certify that the above is an exact and accurate translation of the original document, and that we are competent in the source and target languages to render such a translation."
                    disabled={disabled}
                />
                <p className="text-xs text-surface-500">
                    Certification text appears first in the document footer
                </p>
            </div>

            {/* Company Details */}
            <div className="space-y-2">
                <Label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                    Company Details
                </Label>
                <BrandingEditor
                    content={footerContent?.companyDetails || null}
                    onChange={(c) => updateFooterContent('companyDetails', c)}
                    placeholder="Company Name | Capital: EUR XX,XXX | Registration: XXXXX | Address | Tax ID: XX XXX XXX XXX"
                    disabled={disabled}
                />
                <p className="text-xs text-surface-500">Legal information displayed below a separator line</p>
            </div>

            {/* Toggle Options - Following adjust-credits-form pattern */}
            <div className="space-y-4 pt-5 mt-5 border-t border-surface-200 dark:border-surface-800">
                {/* Show Translation Direction */}
                <div className="flex items-center justify-between rounded-xl bg-surface-50 dark:bg-surface-900/50 p-3">
                    <div className="space-y-0.5">
                        <Label
                            htmlFor="showTranslationDirection"
                            className="text-sm font-medium text-surface-700 dark:text-surface-300"
                        >
                            Show Translation Direction
                        </Label>
                        <p className="text-xs text-surface-500">
                            Display &ldquo;Translation from X into Y&rdquo; in the header
                        </p>
                    </div>
                    <Switch
                        id="showTranslationDirection"
                        checked={showTranslationDirection}
                        onCheckedChange={onShowTranslationDirectionChange}
                        disabled={disabled}
                    />
                </div>

                {/* Show Certification Stamp */}
                <div className="flex items-center justify-between rounded-xl bg-surface-50 dark:bg-surface-900/50 p-3">
                    <div className="space-y-0.5">
                        <Label
                            htmlFor="showCertificationStamp"
                            className="text-sm font-medium text-surface-700 dark:text-surface-300"
                        >
                            Show Certification Stamp
                        </Label>
                        <p className="text-xs text-surface-500">
                            Add your stamp/seal image to the bottom-right of each page
                        </p>
                    </div>
                    <Switch
                        id="showCertificationStamp"
                        checked={showCertificationStamp}
                        onCheckedChange={onShowCertificationStampChange}
                        disabled={disabled}
                    />
                </div>

                {/* Certification Stamp Settings (conditional) */}
                {showCertificationStamp && (
                    <div className="space-y-4 pl-4 border-l-2 border-primary-300 dark:border-primary-700 ml-2">
                        <div className="space-y-4">
                            {/* Simplified: Upload Only */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                                    Stamp Image (PNG/APNG)
                                </Label>
                                <CertificationStampUpload
                                    value={certificationStampUrl}
                                    onChange={onCertificationStampUrlChange}
                                    disabled={disabled}
                                />
                                <p className="text-xs text-surface-500">
                                    Use a transparent PNG for best results. Stamp will be placed at the
                                    bottom-right of the document.
                                </p>
                            </div>

                            {/* Certification Number */}
                            <div className="space-y-2">
                                <Label
                                    htmlFor="certificationNumber"
                                    className="text-sm font-medium text-surface-700 dark:text-surface-300"
                                >
                                    Certification Number
                                </Label>
                                <Input
                                    id="certificationNumber"
                                    value={certificationNumber || ''}
                                    onChange={(e) => onCertificationNumberChange(e.target.value || null)}
                                    placeholder={`CERT-${new Date().getFullYear()}-XXXX`}
                                    disabled={disabled}
                                    maxLength={100}
                                    className="border-surface-200 dark:border-surface-800"
                                />
                                <p className="text-xs text-surface-500">
                                    Shown as text in the footer (in addition to the image).
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
