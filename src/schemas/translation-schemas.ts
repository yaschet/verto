/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { z } from 'zod';
import { AUTO_DETECT_LANGUAGE, BCP_47_SUPPORTED_LANGUAGE } from '@/constants/translations';
import type { Enums } from '@/types/database/database';
import type { ExtendedTableRow, ExtendedTableView } from '@/types/database/database.extended';

/**
 * Schema for source language that includes auto-detect option.
 * 'auto' means the AI will detect the source language automatically.
 */
export const sourceLanguageSchema = z.union([
    z.literal(AUTO_DETECT_LANGUAGE),
    z.nativeEnum(BCP_47_SUPPORTED_LANGUAGE),
]);

export type OriginalTranslationRow = ExtendedTableRow<'translations'>;
export type TranslationRow = ExtendedTableView<'extended_translation_view'>;

// Extract the keys of 'extended_translation_view' dynamically:
export type TranslationColumn = keyof TranslationRow;

// Utility function to create an enum from a union type
function createEnum<T extends string>(keys: T[]): { [K in T]: K } {
    return keys.reduce(
        (acc, key) => {
            acc[key] = key;
            return acc;
        },
        Object.create(null) as { [K in T]: K },
    );
}

// Create the enum dynamically from the TranslationColumn type
export const TranslationColumnEnum = createEnum<TranslationColumn>(
    Object.keys({} as TranslationRow) as TranslationColumn[],
);

// TypeScript type for the enum
export type TranslationColumnEnumType = typeof TranslationColumnEnum;

export const TranslationColumnList: [TranslationColumn, ...TranslationColumn[]] = [
    'completed_at',
    'created_at',
    'customer_email',
    'customer_id',
    'customer_name',
    'description',
    'details',
    'display_name',
    'file_url',
    'progress',
    'status',
    'source_language',
    'target_language',
];

// Make an object out of the original type to use it in the Zod schema:
export const TranslationColumnObject = TranslationColumnList.reduce(
    (acc, key) => {
        acc[key] = z.string();
        return acc;
    },
    {} as Record<TranslationColumn, z.ZodString>,
);

// Convert the object to a Zod Enum compatible array:
export const TranslationKeysArray = Object.keys(TranslationColumnObject) as [
    TranslationColumn,
    ...TranslationColumn[],
];

// Convert the object to a Zod Enum compatible list:
export const TranslationKeysList = Object.keys(TranslationColumnObject) as TranslationColumn[];

// Define the Zod schema for the translation query parameters
export const TranslationColumnEnumSchema = z.enum(TranslationKeysArray, {
    error: `The page sort by field is invalid, and must be one of the following: ${TranslationKeysList.join(', ')}.`,
});

// Define the TranslationStatus type
export type TranslationStatus = Enums<'translation_status'>;

// Status groupings for UI logic
export const TRANSLATION_PENDING_STATUSES: TranslationStatus[] = ['queued'];
export const TRANSLATION_COMPLETED_STATUSES: TranslationStatus[] = [
    'ready',
    'completed',
    'failed',
    'canceled',
];
export const TRANSLATION_READY_STATUSES: TranslationStatus[] = ['ready', 'completed'];
export const TRANSLATION_FAILED_STATUSES: TranslationStatus[] = ['failed', 'canceled'];
export const TRANSLATION_QUEUED_STATUSES: TranslationStatus[] = ['queued'];
export const TRANSLATION_PROCESSING_STATUSES: TranslationStatus[] = [
    'retrying',
    'processing',
    'translating',
    'polishing',
    'generating',
];

export const CreateTranslationSchema = z
    .object({
        displayName: z
            .string({
                message: 'Please enter a valid display name.',
            })
            .min(3, { message: 'Please enter a valid display name.' })
            .optional(),
        description: z
            .string({
                message: 'Please enter a valid description.',
            })
            .min(1, { message: 'Please enter a valid description.' })
            .optional(),
        customerId: z
            .string({
                message: 'Please select a valid customer.',
            })
            .uuid({ message: 'Please select a valid customer.' })
            .optional(),
        templateId: z
            .string({
                message: 'Please select a valid template.',
            })
            .uuid({ message: 'Please select a valid template.' })
            .optional(),
        sourceLanguage: sourceLanguageSchema.default(AUTO_DETECT_LANGUAGE),
        targetLanguage: z.nativeEnum(BCP_47_SUPPORTED_LANGUAGE, {
            message: 'Please enter a valid target language.',
        }),
        scannedDocumentFile: z
            .string({ message: 'Please upload a file.' })
            .min(1, { message: 'Please upload a file.' })
            .refine(
                (value) =>
                    value.endsWith('.jpg') ||
                    value.endsWith('.jpeg') ||
                    value.endsWith('.png') ||
                    value.endsWith('.heic') ||
                    value.endsWith('.heif') ||
                    value.endsWith('.pdf'),
                {
                    message: 'File must be a JPEG, PNG, HEIC, or PDF file.',
                },
            ),
    })
    .refine(
        (data) => {
            // Allow 'auto' source with any target (will be detected during translation)
            if (data.sourceLanguage === AUTO_DETECT_LANGUAGE) {
                return true;
            }
            return data.sourceLanguage !== data.targetLanguage;
        },
        {
            message: 'Source and target languages cannot be the same.',
            path: ['sourceLanguage', 'targetLanguage'],
        },
    );
