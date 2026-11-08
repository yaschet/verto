/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { useMemo } from 'react';
import { PanelSection } from '@app/(protected)/account/components/shared/panel-section';
import { Switch } from '@components/ui/switch';
import { Label } from '@components/ui/label';
import { Separator } from '@components/ui/separator';
import { Skeleton } from '@components/ui/skeleton';
import { Button } from '@components/ui/button';
import {
    ArrowCounterClockwiseIcon,
    FileDocIcon,
    CloudCheckIcon,
    CloudSlashIcon,
    SpinnerIcon,
} from '@phosphor-icons/react';
import { HeaderSection } from '@components/branding/header-section';
import { FooterSection } from '@components/branding/footer-section';

import { BrandingPreview } from '@components/branding/branding-preview';
import { useUserData } from '@hooks/queries/auth/use-user-data';
import { useBrandingFormState } from '@hooks/use-branding-form-state';
import {
    CERTIFICATION_STAMP_PLACEMENTS,
    CERTIFICATION_STAMP_SIZES,
    parseHeaderContent,
    parseFooterContent,
    type CertificationStampPlacement,
    type CertificationStampSize,
    type ExtendedBrandingSettings,
} from '@/types/document/branding-settings';

/**
 * Document Branding Panel
 *
 * Allows users to customize headers and footers for translated documents
 * with company branding, logos, and certification information.
 */
export default function DocumentBrandingPanel() {
    return (
        <PanelSection
            vertical
            title="Document Branding"
            description="Customize headers and footers in your translated documents with company branding and certification."
        >
            <DocumentBrandingContent />
        </PanelSection>
    );
}

function DocumentBrandingContent() {
    const { data: userData, isLoading } = useUserData();

    const serverSettings = useMemo<ExtendedBrandingSettings | null>(() => {
        const profile = userData?.profile;
        if (!profile) return null;

        const stampPlacementRaw = profile.doc_certification_stamp_placement ?? null;
        const stampSizeRaw = profile.doc_certification_stamp_size ?? null;

        const certificationStampPlacement: CertificationStampPlacement =
            CERTIFICATION_STAMP_PLACEMENTS.includes(stampPlacementRaw as CertificationStampPlacement)
                ? (stampPlacementRaw as CertificationStampPlacement)
                : 'page_bottom_right_margin';

        const certificationStampSize: CertificationStampSize = CERTIFICATION_STAMP_SIZES.includes(
            stampSizeRaw as CertificationStampSize,
        )
            ? (stampSizeRaw as CertificationStampSize)
            : 'md';

        return {
            enabled: profile.doc_branding_enabled ?? false,
            logoUrl: profile.doc_logo_url ?? null,
            companyName: profile.doc_company_name ?? null,
            headerContent: parseHeaderContent(profile.doc_header_text ?? null),
            footerContent: parseFooterContent(profile.doc_footer_text ?? null),
            showCertificationStamp: profile.doc_show_certification_stamp ?? false,
            certificationNumber: profile.doc_certification_number ?? null,
            certificationStampUrl: profile.doc_certification_stamp_url ?? null,
            certificationStampPlacement,
            certificationStampSize,
            showPageNumbers: profile.doc_show_page_numbers ?? true,
            watermarkText: profile.doc_watermark_text ?? null,
            watermarkPreset:
                (profile.doc_watermark_preset as ExtendedBrandingSettings['watermarkPreset']) ?? 'light',
            showTranslationDirection: true, // Default to true (no DB column yet)
        };
    }, [userData?.profile]);

    // Local form state - SINGLE SOURCE OF TRUTH for UI
    const {
        settings,
        isInitialized,
        isDirty,
        isSaving,
        setEnabled,
        setLogoUrl,
        setCompanyName,
        setHeaderContent,
        setFooterContent,
        setShowCertificationStamp,
        setCertificationNumber,
        setCertificationStampUrl,
        setCertificationStampPlacement,
        setCertificationStampSize,
        setShowTranslationDirection,
        resetToDefaults,
    } = useBrandingFormState(serverSettings);

    // Loading state
    if (isLoading || !isInitialized) {
        return <BrandingSkeleton />;
    }

    return (
        <div className="w-full">
            {/* Master Toggle - Following adjust-credits-modal pattern */}
            <div className="flex items-center gap-4 rounded-2xl bg-surface-100 p-4 dark:bg-surface-900 mb-6">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30">
                    <FileDocIcon className="size-6 text-primary-600 dark:text-primary-400" weight="duotone" />
                </div>
                <div className="flex flex-1 flex-col gap-0.5">
                    <Label
                        htmlFor="enableBranding"
                        className="text-base font-semibold text-surface-900 dark:text-surface-100"
                    >
                        Enable Custom Branding
                    </Label>
                    <p className="text-sm text-surface-500">
                        Add your company branding to generated documents
                    </p>
                </div>
                {/* Save status indicator */}
                <div className="flex items-center gap-2 mr-2">
                    {isSaving ? (
                        <SpinnerIcon className="size-4 text-info animate-spin" />
                    ) : isDirty ? (
                        <CloudSlashIcon className="size-4 text-warning" weight="fill" />
                    ) : (
                        <CloudCheckIcon className="size-4 text-success" weight="fill" />
                    )}
                </div>
                <Switch id="enableBranding" checked={settings.enabled} onCheckedChange={setEnabled} />
            </div>

            {/* Branding Settings (shown when enabled) */}
            {settings.enabled && (
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_350px] gap-8">
                    {/* Settings Form */}
                    <div className="space-y-8">
                        {/* Header Section */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4 text-surface-900 dark:text-surface-100">
                                Document Header
                            </h3>
                            <HeaderSection
                                companyName={settings.companyName}
                                logoUrl={settings.logoUrl}
                                headerContent={settings.headerContent}
                                onCompanyNameChange={setCompanyName}
                                onLogoChange={setLogoUrl}
                                onHeaderContentChange={setHeaderContent}
                            />
                        </div>

                        <Separator className="bg-surface-200 dark:bg-surface-800" />

                        {/* Footer Section */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4 text-surface-900 dark:text-surface-100">
                                Document Footer
                            </h3>
                            <FooterSection
                                footerContent={settings.footerContent}
                                showCertificationStamp={settings.showCertificationStamp}
                                certificationNumber={settings.certificationNumber}
                                certificationStampUrl={settings.certificationStampUrl}
                                certificationStampPlacement={settings.certificationStampPlacement}
                                certificationStampSize={settings.certificationStampSize}
                                showTranslationDirection={settings.showTranslationDirection}
                                onFooterContentChange={setFooterContent}
                                onShowCertificationStampChange={setShowCertificationStamp}
                                onCertificationNumberChange={setCertificationNumber}
                                onCertificationStampUrlChange={setCertificationStampUrl}
                                onCertificationStampPlacementChange={setCertificationStampPlacement}
                                onCertificationStampSizeChange={setCertificationStampSize}
                                onShowTranslationDirectionChange={setShowTranslationDirection}
                            />
                        </div>

                        <Separator className="bg-surface-200 dark:bg-surface-800" />

                        <Separator className="bg-surface-200 dark:bg-surface-800" />

                        {/* Reset Button */}
                        <div className="flex justify-end">
                            <Button
                                variant="outlined"
                                onClick={resetToDefaults}
                                disabled={isSaving}
                                className="gap-2"
                            >
                                <ArrowCounterClockwiseIcon className="size-4" />
                                Reset to Defaults
                            </Button>
                        </div>
                    </div>

                    {/* Live Preview */}
                    <div className="xl:sticky xl:top-20 h-fit">
                        <h3 className="text-lg font-semibold mb-4 text-surface-900 dark:text-surface-100">
                            Preview
                        </h3>
                        <BrandingPreview settings={settings} />
                        <p className="text-xs text-surface-500 mt-3 text-center">
                            Changes apply to future document generations
                        </p>
                    </div>
                </div>
            )}

            {/* Disabled state message - Following adjust-credits-form pattern */}
            {!settings.enabled && (
                <div className="flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-dashed border-surface-300 dark:border-surface-700 text-center">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-surface-100 dark:bg-surface-800">
                        <FileDocIcon className="size-7 text-surface-400" weight="duotone" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
                            Branding disabled
                        </p>
                        <p className="text-sm text-surface-500 max-w-md">
                            Enable custom branding above to add your company logo, header, and footer to
                            translated documents.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Skeleton loading state for branding panel
 */
function BrandingSkeleton() {
    return (
        <div className="w-full space-y-6">
            {/* Toggle skeleton */}
            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/20">
                <div className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-5 w-10 rounded-full" />
            </div>

            {/* Content skeleton */}
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_350px] gap-8">
                <div className="space-y-6">
                    <Skeleton className="h-6 w-36" />
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                            <Skeleton className="h-24" />
                            <Skeleton className="h-24" />
                            <Skeleton className="h-24" />
                        </div>
                        <Skeleton className="h-10" />
                    </div>

                    <Skeleton className="h-px w-full" />

                    <Skeleton className="h-6 w-36" />
                    <div className="space-y-4">
                        <Skeleton className="h-24" />
                        <Skeleton className="h-24" />
                        <Skeleton className="h-10" />
                        <Skeleton className="h-10" />
                    </div>
                </div>

                <div>
                    <Skeleton className="h-6 w-20 mb-4" />
                    <Skeleton className="h-[400px]" />
                </div>
            </div>
        </div>
    );
}
