/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { z } from 'zod';
import {
    CERTIFICATION_STAMP_CONSTRAINTS,
    CERTIFICATION_STAMP_PLACEMENTS,
    CERTIFICATION_STAMP_SIZES,
    LOGO_CONSTRAINTS,
} from '@/types/document/branding-settings';

/**
 * ProseMirror mark schema (formatting like bold, italic, link)
 */
const proseMirrorMarkSchema = z.object({
    type: z.string(),
    attrs: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Recursive ProseMirror node schema
 * Represents TipTap/ProseMirror JSON document structure
 */
const proseMirrorNodeSchema: z.ZodType<unknown> = z.lazy(() =>
    z.object({
        type: z.string(),
        content: z.array(proseMirrorNodeSchema).optional(),
        marks: z.array(proseMirrorMarkSchema).optional(),
        attrs: z.record(z.string(), z.unknown()).optional(),
        text: z.string().optional(),
    }),
);

/**
 * Header content schema (3-column layout)
 * Left: Company info, address
 * Right: Working languages, contact
 */
export const headerTextContentSchema = z.object({
    left: proseMirrorNodeSchema.nullable(),
    right: proseMirrorNodeSchema.nullable(),
});

/**
 * Footer content schema (2-section layout)
 * Certification: Statement of accuracy
 * Company Details: Legal info
 */
export const footerTextContentSchema = z.object({
    certification: proseMirrorNodeSchema.nullable(),
    companyDetails: proseMirrorNodeSchema.nullable(),
});

/**
 * Logo URL validation
 */
const logoUrlSchema = z.string().url('Logo URL must be a valid URL').nullable().optional();

/**
 * Company name validation
 */
const companyNameSchema = z
    .string()
    .max(200, 'Company name must be 200 characters or less')
    .nullable()
    .optional();

/**
 * Certification number validation
 */
const certificationNumberSchema = z
    .string()
    .max(100, 'Certification number must be 100 characters or less')
    .nullable()
    .optional();

/**
 * Certification stamp URL validation
 */
const certificationStampUrlSchema = z.string().url('Stamp URL must be a valid URL').nullable().optional();

/**
 * Full branding settings update schema
 * Used for validating partial updates from the settings form
 */
export const brandingSettingsUpdateSchema = z.object({
    enabled: z.boolean().optional(),
    logoUrl: logoUrlSchema,
    companyName: companyNameSchema,
    headerContent: headerTextContentSchema.nullable().optional(),
    footerContent: footerTextContentSchema.nullable().optional(),
    showPageNumbers: z.boolean().optional(),
    showCertificationStamp: z.boolean().optional(),
    certificationNumber: certificationNumberSchema,
    certificationStampUrl: certificationStampUrlSchema,
    certificationStampPlacement: z
        .enum(CERTIFICATION_STAMP_PLACEMENTS as unknown as [string, ...string[]])
        .optional(),
    certificationStampSize: z.enum(CERTIFICATION_STAMP_SIZES as unknown as [string, ...string[]]).optional(),

    // UI-only setting (not saved to DB yet, but needs to pass validation)
    showTranslationDirection: z.boolean().optional(),
});

/**
 * Complete branding settings schema (all fields required)
 * Used for validating complete branding settings objects
 */
export const brandingSettingsSchema = z.object({
    enabled: z.boolean(),
    logoUrl: z.string().url().nullable(),
    companyName: z.string().max(200).nullable(),
    headerContent: headerTextContentSchema.nullable(),
    footerContent: footerTextContentSchema.nullable(),
    showPageNumbers: z.boolean(),
    showCertificationStamp: z.boolean(),
    certificationNumber: z.string().max(100).nullable(),
    certificationStampUrl: z.string().url().nullable(),
    certificationStampPlacement: z.enum(CERTIFICATION_STAMP_PLACEMENTS as unknown as [string, ...string[]]),
    certificationStampSize: z.enum(CERTIFICATION_STAMP_SIZES as unknown as [string, ...string[]]),
});

/**
 * Logo file validation schema
 */
export const logoFileSchema = z.object({
    size: z
        .number()
        .max(
            LOGO_CONSTRAINTS.maxFileSizeBytes,
            `Logo must be ${LOGO_CONSTRAINTS.maxFileSizeBytes / 1024 / 1024}MB or less`,
        ),
    type: z.enum(LOGO_CONSTRAINTS.allowedMimeTypes as unknown as [string, ...string[]], {
        message: `Logo must be PNG, JPEG, or SVG`,
    }),
});

/**
 * Certification stamp file validation schema
 */
export const certificationStampFileSchema = z.object({
    size: z
        .number()
        .max(
            CERTIFICATION_STAMP_CONSTRAINTS.maxFileSizeBytes,
            `Stamp must be ${CERTIFICATION_STAMP_CONSTRAINTS.maxFileSizeBytes / 1024 / 1024}MB or less`,
        ),
    type: z.enum(CERTIFICATION_STAMP_CONSTRAINTS.allowedMimeTypes as unknown as [string, ...string[]], {
        message: `Stamp must be PNG`,
    }),
});

/**
 * Type inference from schemas
 */
export type BrandingSettingsUpdate = z.infer<typeof brandingSettingsUpdateSchema>;
export type BrandingSettings = z.infer<typeof brandingSettingsSchema>;
export type HeaderTextContent = z.infer<typeof headerTextContentSchema>;
export type FooterTextContent = z.infer<typeof footerTextContentSchema>;
export type LogoFile = z.infer<typeof logoFileSchema>;
export type CertificationStampFile = z.infer<typeof certificationStampFileSchema>;

/**
 * Validate branding settings update
 */
export function validateBrandingUpdate(data: unknown): {
    success: boolean;
    data?: BrandingSettingsUpdate;
    error?: z.ZodError;
} {
    const result = brandingSettingsUpdateSchema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    return { success: false, error: result.error };
}

/**
 * Validate logo file before upload
 */
export function validateLogoFile(file: File): {
    success: boolean;
    error?: string;
} {
    const result = logoFileSchema.safeParse({
        size: file.size,
        type: file.type,
    });

    if (!result.success) {
        const firstError = result.error.issues[0];
        return { success: false, error: firstError?.message || 'Invalid file' };
    }

    return { success: true };
}

/**
 * Validate certification stamp file before upload
 */
export function validateCertificationStampFile(file: File): {
    success: boolean;
    error?: string;
} {
    const result = certificationStampFileSchema.safeParse({
        size: file.size,
        type: file.type,
    });

    if (!result.success) {
        const firstError = result.error.issues[0];
        return { success: false, error: firstError?.message || 'Invalid file' };
    }

    return { success: true };
}
