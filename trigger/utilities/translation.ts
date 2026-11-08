/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { logError, timedOperation } from '@/trigger/logging';
import { ApiError } from '@errors/api-errors';
import type { Enums } from '@/types/database/database';
import type { ExtendedDatabase } from '@/types/database/database.extended';
import type { OriginalTranslationRow } from '@schemas/translation-schemas';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Retrieves a Translation record from the database.
 *
 * @param supabaseClient
 * @param translationId
 */
export async function retrieveTranslationRecord(
    supabaseClient: SupabaseClient<ExtendedDatabase>,
    translationId: OriginalTranslationRow['id'],
): Promise<
    | {
          data: OriginalTranslationRow;
          error: null;
      }
    | {
          data: null;
          error: ApiError;
      }
> {
    return timedOperation('retrieve-translation-record', async (span) => {
        span.setAttribute('translationId', translationId);

        const { data: translation, error: retrievalError } = await supabaseClient
            .from('translations')
            .select()
            .eq('id', translationId)
            .single();

        if (retrievalError || !translation) {
            const errorMessage = retrievalError?.message ?? 'Failed to retrieve the Translation.';

            // Log structured error
            logError('Failed to retrieve translation record', new Error(errorMessage), {
                translationId,
                code: retrievalError?.code,
                hint: retrievalError?.hint,
            });

            // Span attributes for observability
            span.setAttribute('error', true);
            span.setAttribute('error.message', errorMessage);

            return {
                data: null,
                error: new ApiError('Failed to retrieve the Translation.', {
                    description: retrievalError?.message,
                    status: 500,
                    title: 'Failed to Retrieve Translation',
                    code: 'FAILED_TO_RETRIEVE_TRANSLATION',
                }),
            };
        }

        return { data: translation, error: retrievalError };
    });
}

export async function updateTranslationRecord(
    supabase: SupabaseClient<ExtendedDatabase>,
    translationId: OriginalTranslationRow['id'],
    updateFields: Partial<OriginalTranslationRow>,
): Promise<
    | {
          data: OriginalTranslationRow;
          error: null;
      }
    | {
          data: null;
          error: ApiError;
      }
> {
    return timedOperation('update-translation-record', async (span) => {
        span.setAttribute('translationId', translationId);
        // Avoid logging full update fields if they might contain sensitive data or be huge
        // span.setAttribute('updateFields', JSON.stringify(updateFields));

        const { data, error: updateError } = await supabase
            .from('translations')
            .update(updateFields)
            .eq('id', translationId)
            .select()
            .single();

        if (updateError) {
            logError('Failed to update translation record', new Error(updateError.message), {
                translationId,
                code: updateError.code,
            });

            span.setAttribute('error', true);
            span.setAttribute('error.message', updateError.message);

            return {
                data: null,
                error: new ApiError('Failed to update the Translation.', {
                    description: updateError.message,
                    status: 500,
                    title: 'Failed to Update Translation',
                    code: 'FAILED_TO_UPDATE_TRANSLATION',
                }),
            };
        }

        return { data, error: updateError };
    });
}

/**
 * Options for dynamic AI-reported progress labels.
 * These are stored in the `details` JSONB column and displayed in the UI.
 */
export type DynamicProgressOptions = {
    /** Short label (2-3 words) for UI display. Examples: "Analyzing Layout", "Translating Section 3" */
    dynamic_label?: string;
    /** Longer description for tooltip */
    stage_message?: string;
};

export async function updateTranslationStatus(
    supabaseClient: SupabaseClient<ExtendedDatabase>,
    translationId: OriginalTranslationRow['id'],
    status: Enums<'translation_status'>,
    progress?: number,
    dynamicProgress?: DynamicProgressOptions,
    clearLabels = false, // Explicitly clear labels on phase transition
): Promise<
    | {
          data: OriginalTranslationRow;
          error: null;
      }
    | {
          data: null;
          error: ApiError;
      }
> {
    // NOTE: Removed logger.trace() wrapper - was creating 13-30 spans per document
    // This is a high-frequency operation that doesn't need individual tracing

    // First fetch current record to check if status is changing
    const { data: current } = await supabaseClient
        .from('translations')
        .select('details, status')
        .eq('id', translationId)
        .single();

    const currentDetails = (current?.details as Record<string, unknown>) || {};
    const statusChanged = current?.status !== status;

    // Build update object with optional progress
    const updateFields: Partial<OriginalTranslationRow> = { status };

    if (progress !== undefined) {
        // Clamp progress to 0-100 range
        const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));
        updateFields.progress = clampedProgress;
    }

    // Build progress history entry for auditing
    const progressEntry = {
        timestamp: new Date().toISOString(),
        status,
        progress: progress !== undefined ? Math.min(100, Math.max(0, Math.round(progress))) : undefined,
        dynamic_label: dynamicProgress?.dynamic_label || null,
        stage_message: dynamicProgress?.stage_message || null,
        statusChanged,
    };

    // Get existing progress history (keep last 50 entries to avoid bloat)
    const existingHistory = (currentDetails.progress_history as (typeof progressEntry)[]) || [];
    const updatedHistory = [...existingHistory, progressEntry].slice(-50);

    // Handle dynamic progress labels (AI-reported during translating/polishing)
    // Clear labels when status changes OR when explicitly requested
    // This prevents stale labels from persisting across phases
    if (statusChanged || clearLabels) {
        updateFields.details = {
            ...currentDetails,
            dynamic_label: dynamicProgress?.dynamic_label ?? null,
            stage_message: dynamicProgress?.stage_message ?? null,
            progress_history: updatedHistory,
        };
    } else if (dynamicProgress && (dynamicProgress.dynamic_label || dynamicProgress.stage_message)) {
        // Same status, just updating labels
        updateFields.details = {
            ...currentDetails,
            dynamic_label: dynamicProgress.dynamic_label,
            stage_message: dynamicProgress.stage_message,
            progress_history: updatedHistory,
        };
    } else {
        // Just progress update, still track in history
        updateFields.details = {
            ...currentDetails,
            progress_history: updatedHistory,
        };
    }

    const { data, error } = await supabaseClient
        .from('translations')
        .update(updateFields)
        .eq('id', translationId)
        .select()
        .single();

    if (error) {
        logError('Failed to update translation status', new Error(error.message), {
            translationId,
            status,
            code: error.code,
        });

        return {
            data: null,
            error: new ApiError(
                'Failed to update the Translation status.',
                {
                    description: error.message,
                    status: 500,
                    title: 'Failed to Update Translation Status',
                    code: 'FAILED_TO_UPDATE_TRANSLATION_STATUS',
                },
                {
                    code: error.code,
                    details: error.details,
                    hint: error.hint,
                },
            ),
        };
    }

    return { data, error };
}
