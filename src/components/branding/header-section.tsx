/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { useCallback } from 'react';
import { BrandingEditor } from '@components/branding/branding-editor';
import { LogoUpload } from '@components/branding/logo-upload';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import type { HeaderTextContent, ProseMirrorJSON } from '@/types/document/branding-settings';

type HeaderSectionProps = {
    companyName: string | null;
    logoUrl: string | null;
    headerContent: HeaderTextContent | null;
    onCompanyNameChange: (value: string | null) => void;
    onLogoChange: (url: string | null) => void;
    onHeaderContentChange: (content: HeaderTextContent | null) => void;
    disabled?: boolean;
};

/**
 * Header configuration section with 3-column layout
 * Left: Company info/address
 * Center: Logo
 * Right: Working languages/contact
 */
export function HeaderSection({
    companyName,
    logoUrl,
    headerContent,
    onCompanyNameChange,
    onLogoChange,
    onHeaderContentChange,
    disabled = false,
}: HeaderSectionProps) {
    // Update specific field in header content
    const updateHeaderContent = useCallback(
        (field: keyof HeaderTextContent, value: ProseMirrorJSON | null) => {
            const newContent: HeaderTextContent = {
                left: headerContent?.left || null,
                right: headerContent?.right || null,
                center: null,
                [field]: value,
            };
            // Check if content is completely empty
            const isEmpty = !newContent.left && !newContent.right;
            onHeaderContentChange(isEmpty ? null : newContent);
        },
        [headerContent, onHeaderContentChange],
    );

    return (
        <div className="space-y-6">
            {/* 3-Column Header Layout */}
            <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900/50 p-5">
                <p className="text-sm font-semibold mb-4 text-surface-700 dark:text-surface-300">
                    Header Layout (3 columns)
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Left Column */}
                    <div className="space-y-2">
                        <Label className="text-xs font-medium text-surface-500 dark:text-surface-400">
                            Left Column
                        </Label>
                        <BrandingEditor
                            content={headerContent?.left || null}
                            onChange={(c) => updateHeaderContent('left', c)}
                            placeholder="Company name, address, contact info..."
                            disabled={disabled}
                            className="text-left"
                        />
                    </div>

                    {/* Center Column - Logo */}
                    <div className="space-y-2">
                        <Label className="text-xs font-medium text-surface-500 dark:text-surface-400">
                            Center (Logo)
                        </Label>
                        <LogoUpload value={logoUrl} onChange={onLogoChange} disabled={disabled} />
                    </div>

                    {/* Right Column */}
                    <div className="space-y-2">
                        <Label className="text-xs font-medium text-surface-500 dark:text-surface-400">
                            Right Column
                        </Label>
                        <BrandingEditor
                            content={headerContent?.right || null}
                            onChange={(c) => updateHeaderContent('right', c)}
                            placeholder="Working languages, certifications..."
                            disabled={disabled}
                            className="text-right"
                        />
                    </div>
                </div>
            </div>

            {/* Company Name Fallback */}
            <div className="space-y-2">
                <Label
                    htmlFor="companyName"
                    className="text-sm font-medium text-surface-700 dark:text-surface-300"
                >
                    Company Name
                </Label>
                <Input
                    id="companyName"
                    value={companyName || ''}
                    onChange={(e) => onCompanyNameChange(e.target.value || null)}
                    placeholder="Your Company Name"
                    disabled={disabled}
                    maxLength={200}
                    className="border-surface-200 dark:border-surface-800"
                />
                <p className="text-xs text-surface-500">Used as fallback if header columns are empty</p>
            </div>
        </div>
    );
}
