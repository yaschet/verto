/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * Document Branding Settings
 *
 * Types for user branding configuration in generated documents.
 * These types map to the profiles table branding columns.
 */

/**
 * ProseMirror JSON structure (TipTap editor output)
 * Represents rich text content that can be serialized to JSON
 */
export type ProseMirrorMark = {
    type: string;
    attrs?: Record<string, unknown>;
};

export type ProseMirrorJSON = {
    type: string;
    content?: ProseMirrorJSON[];
    marks?: ProseMirrorMark[];
    attrs?: Record<string, unknown>;
    text?: string;
};

/**
 * Structured header content for 3-column layout
 * Left: Company info, address
 * Center: Logo (handled separately via doc_logo_url)
 * Right: Working languages, contact info
 */
export type HeaderTextContent = {
    left: ProseMirrorJSON | null;
    center: ProseMirrorJSON | null;
    right: ProseMirrorJSON | null;
};

/**
 * Structured footer content
 * Certification: "We certify that..." statement
 * Company Details: Legal info (registration, tax ID, etc.)
 */
export type FooterTextContent = {
    certification: ProseMirrorJSON | null;
    companyDetails: ProseMirrorJSON | null;
};

export const CERTIFICATION_STAMP_PLACEMENTS = [
    'page_bottom_right_margin',
    'page_bottom_right',
    'footer_bottom_right',
] as const;

export type CertificationStampPlacement = (typeof CERTIFICATION_STAMP_PLACEMENTS)[number];

export const CERTIFICATION_STAMP_SIZES = ['sm', 'md', 'lg'] as const;

export type CertificationStampSize = (typeof CERTIFICATION_STAMP_SIZES)[number];

/**
 * Database columns for document branding (as stored in profiles table)
 */
export type DocumentBrandingColumns = {
    doc_branding_enabled: boolean;
    doc_logo_url: string | null;
    doc_company_name: string | null;
    doc_header_text: string | null;
    doc_footer_text: string | null;
    doc_show_certification_stamp: boolean;
    doc_certification_number: string | null;
    doc_certification_stamp_url: string | null;
    doc_certification_stamp_placement: string | null;
    doc_certification_stamp_size: string | null;
    doc_show_page_numbers: boolean;
    doc_watermark_text: string | null;
    doc_watermark_preset: string | null;
};

/**
 * Branding settings as used in application code
 * Transformed from database columns to cleaner structure
 */
export type DocumentBrandingSettings = {
    enabled: boolean;
    logoUrl: string | null;
    companyName: string | null;
    headerText: string | null;

    footerText: string | null;
    showCertificationStamp: boolean;
    certificationNumber: string | null;
    certificationStampUrl: string | null;
    certificationStampPlacement: CertificationStampPlacement;
    certificationStampSize: CertificationStampSize;
    showPageNumbers: boolean;
    watermarkText: string | null;
    watermarkPreset: 'light' | 'dark' | 'off';
};

/**
 * Resolved branding settings with fetched logo data
 * Used when generating documents
 */
export type ResolvedBrandingSettings = {
    enabled: boolean;
    logoUrl: string | null;
    logoBuffer: Buffer | null;
    logoWidth: number | null;
    logoHeight: number | null;
    companyName: string | null;
    headerText: string | null;
    footerText: string | null;
    showCertificationStamp: boolean;
    certificationNumber: string | null;
    certificationStampUrl: string | null;
    certificationStampPlacement: CertificationStampPlacement;
    certificationStampSize: CertificationStampSize;
    certificationStampBuffer: Buffer | null;
    certificationStampWidth: number | null;
    certificationStampHeight: number | null;
    showPageNumbers: boolean;
    watermarkText: string | null;
    watermarkPreset: 'light' | 'dark' | 'off';
};

/**
 * Extended branding settings with parsed JSON content
 * Used in the UI for structured header/footer editing
 */
export type ExtendedBrandingSettings = {
    enabled: boolean;
    logoUrl: string | null;
    companyName: string | null;
    headerContent: HeaderTextContent | null;
    footerContent: FooterTextContent | null;
    showCertificationStamp: boolean;
    certificationNumber: string | null;
    certificationStampUrl: string | null;
    certificationStampPlacement: CertificationStampPlacement;
    certificationStampSize: CertificationStampSize;
    /** Show "Translation from X into Y" line in header */
    showTranslationDirection: boolean;
    showPageNumbers: boolean;
    watermarkText: string | null;
    watermarkPreset: 'light' | 'dark' | 'off';
};

/**
 * Extended resolved branding with parsed JSON for DOCX generation
 */
export type ExtendedResolvedBrandingSettings = ResolvedBrandingSettings & {
    headerContent: HeaderTextContent | null;
    footerContent: FooterTextContent | null;
};

/**
 * Default branding settings when user hasn't configured any
 */
export const DEFAULT_BRANDING_SETTINGS: DocumentBrandingSettings = {
    enabled: false,
    logoUrl: null,
    companyName: null,
    headerText: null,
    footerText: 'Certified Translation',
    showCertificationStamp: false,
    certificationNumber: null,
    certificationStampUrl: null,
    certificationStampPlacement: 'page_bottom_right_margin',
    certificationStampSize: 'md',
    showPageNumbers: true,
    watermarkText: null,
    watermarkPreset: 'light',
};

/**
 * Default resolved branding (no logo)
 */
export const DEFAULT_RESOLVED_BRANDING: ResolvedBrandingSettings = {
    enabled: false,
    logoUrl: null,
    logoBuffer: null,
    logoWidth: null,
    logoHeight: null,
    companyName: null,
    headerText: null,
    footerText: 'Certified Translation',
    showCertificationStamp: false,
    certificationNumber: null,
    certificationStampUrl: null,
    certificationStampPlacement: 'page_bottom_right_margin',
    certificationStampSize: 'md',
    certificationStampBuffer: null,
    certificationStampWidth: null,
    certificationStampHeight: null,
    showPageNumbers: true,
    watermarkText: null,
    watermarkPreset: 'light',
};

/**
 * Logo upload constraints
 * Based on best practices for document headers:
 * - Upload at 2x display size for crispness
 * - SVG preferred, PNG for transparency
 * - Document headers display at ~200px max width
 */
export const LOGO_CONSTRAINTS = {
    // Upload constraints
    minWidthPx: 200, // Minimum width to avoid blurriness
    recommendedWidthPx: 400, // 2x display size for Retina
    maxFileSizeBytes: 1048576, // 1MB max file size
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/svg+xml'],

    // Display constraints (for document generation)
    displayMaxWidthPx: 200, // Max width in document header
    displayMaxHeightPx: 75, // Max height in document header

    // Preview constraints (UI)
    previewMaxWidthPx: 160, // Preview container max width
    previewMaxHeightPx: 60, // Preview container max height
} as const;

/**
 * Certification stamp upload constraints
 *
 * Notes:
 * - APNGs still use `image/png` MIME type; Word/PDF will typically render the first frame.
 * - Prefer a transparent background for best results over scanned documents.
 */
export const CERTIFICATION_STAMP_CONSTRAINTS = {
    // Upload constraints
    minWidthPx: 250,
    minHeightPx: 250,
    recommendedWidthPx: 600,
    maxFileSizeBytes: 2097152, // 2MB
    allowedMimeTypes: ['image/png'],

    // Display sizes (document generation)
    displaySizePx: {
        sm: 90,
        md: 120,
        lg: 150,
    } satisfies Record<CertificationStampSize, number>,
} as const;

/**
 * Transform database columns to branding settings
 */
export function transformColumnsToBranding(
    columns: Partial<DocumentBrandingColumns>,
): DocumentBrandingSettings {
    const placementRaw = columns.doc_certification_stamp_placement ?? null;
    const sizeRaw = columns.doc_certification_stamp_size ?? null;

    const certificationStampPlacement: CertificationStampPlacement = CERTIFICATION_STAMP_PLACEMENTS.includes(
        placementRaw as CertificationStampPlacement,
    )
        ? (placementRaw as CertificationStampPlacement)
        : 'page_bottom_right_margin';

    const certificationStampSize: CertificationStampSize = CERTIFICATION_STAMP_SIZES.includes(
        sizeRaw as CertificationStampSize,
    )
        ? (sizeRaw as CertificationStampSize)
        : 'md';

    return {
        enabled: columns.doc_branding_enabled ?? false,
        logoUrl: columns.doc_logo_url ?? null,
        companyName: columns.doc_company_name ?? null,
        headerText: columns.doc_header_text ?? null,
        footerText: columns.doc_footer_text ?? 'Certified Translation',
        showCertificationStamp: columns.doc_show_certification_stamp ?? false,

        certificationNumber: columns.doc_certification_number ?? null,
        certificationStampUrl: columns.doc_certification_stamp_url ?? null,
        certificationStampPlacement,
        certificationStampSize,
        showPageNumbers: columns.doc_show_page_numbers ?? true,
        watermarkText: columns.doc_watermark_text ?? null,
        watermarkPreset:
            (columns.doc_watermark_preset as ExtendedBrandingSettings['watermarkPreset']) ?? 'light',
    };
}

/**
 * Transform branding settings to database columns for updates
 */
export function transformBrandingToColumns(
    settings: Partial<DocumentBrandingSettings>,
): Partial<DocumentBrandingColumns> {
    const columns: Partial<DocumentBrandingColumns> = {};

    if (settings.enabled !== undefined) columns.doc_branding_enabled = settings.enabled;
    if (settings.logoUrl !== undefined) columns.doc_logo_url = settings.logoUrl;
    if (settings.companyName !== undefined) columns.doc_company_name = settings.companyName;
    if (settings.headerText !== undefined) columns.doc_header_text = settings.headerText;
    if (settings.footerText !== undefined) columns.doc_footer_text = settings.footerText;
    if (settings.showCertificationStamp !== undefined)
        columns.doc_show_certification_stamp = settings.showCertificationStamp;
    if (settings.certificationNumber !== undefined)
        columns.doc_certification_number = settings.certificationNumber;
    if (settings.certificationStampUrl !== undefined)
        columns.doc_certification_stamp_url = settings.certificationStampUrl;
    if (settings.certificationStampPlacement !== undefined) {
        columns.doc_certification_stamp_placement = settings.certificationStampPlacement;
    }
    if (settings.certificationStampSize !== undefined)
        columns.doc_certification_stamp_size = settings.certificationStampSize;
    if (settings.showPageNumbers !== undefined) columns.doc_show_page_numbers = settings.showPageNumbers;
    if (settings.watermarkText !== undefined) columns.doc_watermark_text = settings.watermarkText;
    if (settings.watermarkPreset !== undefined) columns.doc_watermark_preset = settings.watermarkPreset;

    return columns;
}

/**
 * Safely parse JSON string to HeaderTextContent
 */
export function parseHeaderContent(jsonString: string | null): HeaderTextContent | null {
    if (!jsonString) return null;
    try {
        const parsed = JSON.parse(jsonString);
        // Validate structure
        if (typeof parsed === 'object' && parsed !== null) {
            return {
                left: parsed.left ?? null,
                right: parsed.right ?? null,
                // Center is not stored in JSON (it's the logo)
                center: null,
            };
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Safely parse JSON string to FooterTextContent
 */
export function parseFooterContent(jsonString: string | null): FooterTextContent | null {
    if (!jsonString) return null;
    try {
        const parsed = JSON.parse(jsonString);
        // Validate structure
        if (typeof parsed === 'object' && parsed !== null) {
            return {
                certification: parsed.certification ?? null,
                companyDetails: parsed.companyDetails ?? null,
            };
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Stringify HeaderTextContent to JSON for database storage
 */
export function stringifyHeaderContent(content: HeaderTextContent | null): string | null {
    if (!content) return null;
    // Don't store empty content
    if (!content.left && !content.right) return null;
    return JSON.stringify(content);
}

/**
 * Stringify FooterTextContent to JSON for database storage
 */
export function stringifyFooterContent(content: FooterTextContent | null): string | null {
    if (!content) return null;
    // Don't store empty content
    if (!content.certification && !content.companyDetails) return null;
    return JSON.stringify(content);
}

/**
 * Transform database columns to extended branding settings with parsed JSON
 */
export function transformColumnsToExtendedBranding(
    columns: Partial<DocumentBrandingColumns>,
): ExtendedBrandingSettings {
    const placementRaw = columns.doc_certification_stamp_placement ?? null;
    const sizeRaw = columns.doc_certification_stamp_size ?? null;

    const certificationStampPlacement: CertificationStampPlacement = CERTIFICATION_STAMP_PLACEMENTS.includes(
        placementRaw as CertificationStampPlacement,
    )
        ? (placementRaw as CertificationStampPlacement)
        : 'page_bottom_right_margin';

    const certificationStampSize: CertificationStampSize = CERTIFICATION_STAMP_SIZES.includes(
        sizeRaw as CertificationStampSize,
    )
        ? (sizeRaw as CertificationStampSize)
        : 'md';

    return {
        enabled: columns.doc_branding_enabled ?? false,
        logoUrl: columns.doc_logo_url ?? null,
        companyName: columns.doc_company_name ?? null,
        headerContent: parseHeaderContent(columns.doc_header_text ?? null),
        footerContent: parseFooterContent(columns.doc_footer_text ?? null),
        showCertificationStamp: columns.doc_show_certification_stamp ?? false,
        certificationNumber: columns.doc_certification_number ?? null,
        certificationStampUrl: columns.doc_certification_stamp_url ?? null,
        certificationStampPlacement,
        certificationStampSize,
        showTranslationDirection: true, // Default to true (no DB column yet)
        showPageNumbers: columns.doc_show_page_numbers ?? true,
        watermarkText: columns.doc_watermark_text ?? null,
        watermarkPreset:
            (columns.doc_watermark_preset as ExtendedBrandingSettings['watermarkPreset']) ?? 'light',
    };
}

/**
 * Transform extended branding settings to database columns
 */
export function transformExtendedBrandingToColumns(
    settings: Partial<ExtendedBrandingSettings>,
): Partial<DocumentBrandingColumns> {
    const columns: Partial<DocumentBrandingColumns> = {};

    if (settings.enabled !== undefined) columns.doc_branding_enabled = settings.enabled;
    if (settings.logoUrl !== undefined) columns.doc_logo_url = settings.logoUrl;
    if (settings.companyName !== undefined) columns.doc_company_name = settings.companyName;
    if (settings.headerContent !== undefined) {
        columns.doc_header_text = stringifyHeaderContent(settings.headerContent);
    }
    if (settings.footerContent !== undefined) {
        columns.doc_footer_text = stringifyFooterContent(settings.footerContent);
    }
    if (settings.showCertificationStamp !== undefined) {
        columns.doc_show_certification_stamp = settings.showCertificationStamp;
    }
    if (settings.certificationNumber !== undefined) {
        columns.doc_certification_number = settings.certificationNumber;
    }
    if (settings.certificationStampUrl !== undefined) {
        columns.doc_certification_stamp_url = settings.certificationStampUrl;
    }
    if (settings.certificationStampPlacement !== undefined) {
        columns.doc_certification_stamp_placement = settings.certificationStampPlacement;
    }
    if (settings.certificationStampSize !== undefined) {
        columns.doc_certification_stamp_size = settings.certificationStampSize;
    }
    if (settings.showPageNumbers !== undefined) columns.doc_show_page_numbers = settings.showPageNumbers;
    if (settings.watermarkText !== undefined) columns.doc_watermark_text = settings.watermarkText;
    if (settings.watermarkPreset !== undefined) columns.doc_watermark_preset = settings.watermarkPreset;

    return columns;
}

/**
 * Translation export record (from translation_exports table)
 */
export type TranslationExport = {
    id: string;
    translation_id: string;
    format: 'docx' | 'pdf' | 'html';
    storage_provider: 'supabase' | 'drive';
    storage_path: string;
    file_id: string | null;
    file_size_bytes: number | null;
    download_url: string | null;
    expires_at: string | null;
    created_at: string;
    updated_at: string;
};

/**
 * Export status for UI display
 */
export type ExportStatus = {
    format: 'docx' | 'pdf' | 'html';
    status: 'not_started' | 'processing' | 'ready' | 'expired' | 'failed';
    downloadUrl: string | null;
    expiresAt: Date | null;
    fileSizeBytes: number | null;
};

/**
 * Export request payload
 */
export type ExportRequest = {
    translationId: string;
    formats: ('pdf' | 'html')[];
};

/**
 * Export result from task
 */
export type ExportResult = {
    format: 'docx' | 'pdf' | 'html';
    success: boolean;
    storagePath?: string;
    downloadUrl?: string;
    expiresAt?: Date;
    fileSizeBytes?: number;
    error?: string;
};
