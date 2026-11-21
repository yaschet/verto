/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { standardizeError } from '@errors/api-errors';
import { getLogger } from '@services/logger';
import { createServerClient } from '@utils/supabase/server';
import { brandingSettingsUpdateSchema, type BrandingSettingsUpdate } from '@schemas/branding-schemas';
import {
    transformExtendedBrandingToColumns,
    transformColumnsToExtendedBranding,
    type ExtendedBrandingSettings,
    type DocumentBrandingColumns,
} from '@/types/document/branding-settings';
import type { ApiResponseOrError } from '@/types/rest/response';

const logger = getLogger('ACTIONS:BRANDING:UPDATE');

/**
 * Branding columns to select from profiles table
 */
const BRANDING_COLUMNS = `
    doc_branding_enabled,
    doc_logo_url,
    doc_company_name,
    doc_header_text,
    doc_footer_text,
    doc_show_page_numbers,
    doc_show_certification_stamp,
    doc_certification_number,
    doc_certification_stamp_url,
    doc_certification_stamp_placement,
    doc_certification_stamp_size,
    doc_watermark_text,
    doc_watermark_preset
`;

/**
 * Update user's document branding settings
 */
export async function updateBrandingSettings(
    settings: BrandingSettingsUpdate,
): Promise<ApiResponseOrError<{ settings: ExtendedBrandingSettings }>> {
    try {
        const supabase = await createServerClient();

        // Validate input
        const parsed = brandingSettingsUpdateSchema.safeParse(settings);
        if (!parsed.success) {
            const errorResponse = standardizeError({
                code: 'INVALID_BRANDING_SETTINGS',
                description: parsed.error.issues[0]?.message || 'Invalid branding settings',
                error: true,
                message: 'Invalid branding settings.',
                status: 400,
                title: 'Validation Error',
            });
            logger.error(['Validation failed:', parsed.error.issues]);
            return errorResponse;
        }

        // Get authenticated user
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            const errorResponse = standardizeError(userError || new Error('Not authenticated'));
            logger.error(['User not authenticated:', errorResponse]);
            return errorResponse;
        }

        // Transform settings to database columns
        // Cast is safe because Zod validation has already been performed
        const updateData = transformExtendedBrandingToColumns(
            parsed.data as Partial<ExtendedBrandingSettings>,
        );

        // Check if there are any columns to update
        // (some settings like showTranslationDirection are UI-only and not persisted)
        const hasColumnsToUpdate = Object.keys(updateData).length > 0;

        const query = supabase.from('profiles');
        const result = hasColumnsToUpdate
            ? await query.update(updateData).eq('id', user.id).select(BRANDING_COLUMNS).single()
            : await query.select(BRANDING_COLUMNS).eq('id', user.id).single();
        if (result.error) {
            const errorResponse = standardizeError(result.error);
            logger.error(['Error updating branding settings:', errorResponse]);
            return errorResponse;
        }
        const data = result.data as DocumentBrandingColumns;

        // Transform back to extended settings
        const extendedSettings = transformColumnsToExtendedBranding(data as DocumentBrandingColumns);

        logger.info(['Branding settings updated successfully for user:', user.id]);

        return {
            success: true,
            code: 'BRANDING_SETTINGS_UPDATED',
            title: 'Settings Updated',
            message: 'Your document branding settings have been saved.',
            description: 'Changes will apply to future document generations.',
            data: {
                settings: extendedSettings,
            },
        };
    } catch (error) {
        const errorResponse = standardizeError(error);
        logger.error(['Unexpected error updating branding settings:', errorResponse]);
        return errorResponse;
    }
}

/**
 * Get user's current branding settings
 */
export async function getBrandingSettings(): Promise<
    ApiResponseOrError<{ settings: ExtendedBrandingSettings }>
> {
    try {
        const supabase = await createServerClient();

        // Get authenticated user
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            const errorResponse = standardizeError(userError || new Error('Not authenticated'));
            logger.error(['User not authenticated:', errorResponse]);
            return errorResponse;
        }

        // Fetch branding settings
        const { data, error } = await supabase
            .from('profiles')
            .select(BRANDING_COLUMNS)
            .eq('id', user.id)
            .single();

        if (error) {
            const errorResponse = standardizeError(error);
            logger.error(['Error fetching branding settings:', errorResponse]);
            return errorResponse;
        }

        // Transform to extended settings
        const extendedSettings = transformColumnsToExtendedBranding(data as DocumentBrandingColumns);

        return {
            success: true,
            code: 'BRANDING_SETTINGS_FETCHED',
            title: 'Settings Loaded',
            message: 'Your document branding settings have been loaded.',
            data: {
                settings: extendedSettings,
            },
        };
    } catch (error) {
        const errorResponse = standardizeError(error);
        logger.error(['Unexpected error fetching branding settings:', errorResponse]);
        return errorResponse;
    }
}

/**
 * Reset branding settings to defaults
 */
export async function resetBrandingSettings(): Promise<
    ApiResponseOrError<{ settings: ExtendedBrandingSettings }>
> {
    return updateBrandingSettings({
        enabled: false,
        logoUrl: null,
        companyName: null,
        headerContent: null,
        footerContent: null,
        showPageNumbers: true,
        showCertificationStamp: false,
        certificationNumber: null,
        certificationStampUrl: null,
        certificationStampPlacement: 'page_bottom_right_margin',
        certificationStampSize: 'md',
    });
}
