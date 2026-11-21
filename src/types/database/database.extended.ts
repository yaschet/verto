/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import type { AIAuditData } from '@/types/ai-audit';
import type { Database as PostgresSchema } from '@/types/database/database';
import type { NormalisedDocument } from '@/engine/document/types';
import type { NormalisedDocumentSchema } from '@schemas/document/refinement-schema';
import type { UploadedDocumentUrls } from '@utils/gcp/docx/functions/generate-google-doc-and-exports';
import type { AutoParseableResponseFormat } from 'openai/lib/parser';
import type { z } from 'zod';

type PostgresTables = PostgresSchema['public']['Tables'];

export type CreditsTransactionDetails = {
    conversion_details: string;
    credits: number;
    discount_amount: string;
    discount_percentage: number;
    invoice_link: string | null;
    invoice_pdf: string | null;
    is_currency_different: boolean;
    payment_intent_id: string | null;
    payment_method: string;
    payment_status: string;
    receipt_link: string | null;
    receipt_pdf: string | null;
    session_id: string;
    subtotal: string;
    total: string;
    total_paid: string;
    transaction_timestamp: string;
};

export type TranslationDetails = {
    processed_document?: NormalisedDocument;
    refined_document?: NormalisedDocument;
    refinement_schema?: AutoParseableResponseFormat<z.infer<typeof NormalisedDocumentSchema>>;
    translated_document?: NormalisedDocument;
    generated_docx?: UploadedDocumentUrls;
    /** Number of pages in the document */
    page_count?: number;
    /** Metadata from vision-first translation pipeline */
    vision_metadata?: {
        tokensUsed: number;
        processingTimeMs: number;
        batchesProcessed: number;
        detectedLanguage?: string;
        confidence?: number;
        entitiesProtected?: string[];
    };
    /** Metadata from QA/polish pass */
    qa_metadata?: {
        issuesFixed: number;
        tokensUsed: number;
        confidence: number;
    };
    /** Metadata from post-QA verification pass (mandatory AI verification) */
    verification_metadata?: {
        /** Overall pass status (false only if high-confidence issues detected) */
        passed: boolean;
        /** Whether translation is complete (no missing content) */
        complete: boolean;
        /** List of missing content items (if any) */
        missing_content: string[];
        /** Table verification details */
        table_verification: {
            sourceTableCount: number;
            outputTableCount: number;
            tablesMatch: boolean;
            issues: string[];
        };
        /** Confidence score (0-1) for verification result */
        confidence: number;
        untranslatedSegments: number;
        segmentsAutoFixed: number;
        tokensUsed: number;
    };
    /** User's edited document from TipTap editor */
    user_edits?: NormalisedDocument;
    /** Timestamp of last user edit */
    last_edited_at?: string;
    /** AI-reported dynamic label for real-time UI display */
    dynamic_label?: string | null;
    /** AI-reported stage message for tooltip */
    stage_message?: string | null;
    /** Progress history for auditing */
    progress_history?: {
        timestamp: string;
        status: string;
        progress?: number;
        dynamic_label?: string | null;
        stage_message?: string | null;
        statusChanged?: boolean;
    }[];
    /** Comprehensive AI audit data for the entire translation pipeline */
    ai_audit?: AIAuditData;
};

// THIS IS THE ONLY THING YOU EDIT
// <START>
type TableExtensions = {
    /** My_existing_table_name: { my_json_column_override: { tel: string; name?: string; preset_id?: number; }; }; */
    credits_transactions: {
        details: CreditsTransactionDetails;
    };
    translations: {
        details?: TranslationDetails;
    };
};
// <END>
// ☝️ this is the only thing you edit

type TakeDefinitionFromSecond<T extends object, P extends object> = Omit<T, keyof P> & P;

type ExtendedNewTables = {
    [k in keyof PostgresTables]: {
        Row: k extends keyof TableExtensions
            ? TakeDefinitionFromSecond<PostgresTables[k]['Row'], TableExtensions[k]>
            : PostgresTables[k]['Row'];
        Insert: k extends keyof TableExtensions
            ? TakeDefinitionFromSecond<PostgresTables[k]['Insert'], TableExtensions[k]>
            : PostgresTables[k]['Insert'];
        Update: k extends keyof TableExtensions
            ? Partial<TakeDefinitionFromSecond<PostgresTables[k]['Update'], TableExtensions[k]>>
            : PostgresTables[k]['Update'];
    };
    // Postgres Views:
};

export type ExtendedDatabase = {
    public: Omit<PostgresSchema['public'], 'Tables'> & {
        Tables: ExtendedNewTables;
    };
};

export type ExtendedTableName = keyof ExtendedDatabase['public']['Tables'];
export type ExtendedTableRow<T extends ExtendedTableName> = ExtendedDatabase['public']['Tables'][T]['Row'];

export type ExtendedTableView<View extends keyof ExtendedDatabase['public']['Views']> =
    ExtendedDatabase['public']['Views'][View]['Row'];
