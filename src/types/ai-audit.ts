/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * AI Audit Types
 *
 * Comprehensive audit logging for the translation pipeline.
 * Persisted to Supabase `translations.details.ai_audit` for permanent storage.
 *
 * Design decisions:
 * - Added alongside existing vision_metadata/qa_metadata (no breaking changes)
 * - Full preset snapshots for reproducibility
 * - Per-batch breakdown for detailed analysis
 */

/**
 * Audit data for a single batch within a stage.
 */
export type BatchAudit = {
    /** Batch index (0-based) */
    index: number;
    /** Page numbers processed in this batch */
    pages: number[];
    /** Total tokens used for this batch */
    tokens_used: number;
    /** Prompt tokens (input) */
    tokens_prompt: number;
    /** Completion tokens (output) */
    tokens_completion: number;
    /** Processing time in milliseconds */
    processing_ms: number;
    /** API finish reason */
    finish_reason: string;
    /** Whether response was truncated */
    truncated: boolean;
};

/**
 * Audit data for the translation stage.
 */
export type TranslationStageAudit = {
    /** Model used (e.g., "gpt-5.1") */
    model: string;
    /** OpenAI reasoning_effort setting (gpt-5-mini supports low/medium/high only) */
    reasoning_effort: 'minimal' | 'low' | 'medium' | 'high' | 'none';
    /** OpenAI verbosity setting */
    verbosity: 'low' | 'medium' | 'high';
    /** Image detail level used */
    image_detail: 'low' | 'high' | 'auto';
    /** Total prompt tokens across all batches */
    tokens_prompt: number;
    /** Total completion tokens across all batches */
    tokens_completion: number;
    /** Total tokens (prompt + completion) */
    tokens_total: number;
    /** Total processing time in milliseconds */
    processing_ms: number;
    /** Final finish reason (from last batch or aggregated) */
    finish_reason: string;
    /** Whether any batch was truncated */
    truncated: boolean;
    /** Number of batches processed */
    batch_count: number;
    /** Per-batch audit data */
    batches: BatchAudit[];
    /** Confidence score (0-1) */
    confidence: number;
    /** Detected source language */
    detected_language: string;
    /** Entities that were protected from translation */
    entities_protected: string[];
    /** Any warnings encountered during processing */
    warnings: string[];
};

/**
 * Issue type breakdown for QA stage.
 */
export type QAIssueBreakdown = {
    alignment: number;
    table: number;
    heading: number;
    formatting: number;
    spacing: number;
    translation: number;
    entity: number;
};

/**
 * Audit data for the QA (quality assurance) stage.
 */
export type QAStageAudit = {
    /** Model used (e.g., "gpt-5.1") */
    model: string;
    /** OpenAI reasoning_effort setting (gpt-5-mini supports low/medium/high only) */
    reasoning_effort: 'minimal' | 'low' | 'medium' | 'high' | 'none';
    /** OpenAI verbosity setting */
    verbosity: 'low' | 'medium' | 'high';
    /** Total prompt tokens across all batches */
    tokens_prompt: number;
    /** Total completion tokens across all batches */
    tokens_completion: number;
    /** Total tokens (prompt + completion) */
    tokens_total: number;
    /** Total processing time in milliseconds */
    processing_ms: number;
    /** Final finish reason */
    finish_reason: string;
    /** Whether any batch was truncated */
    truncated: boolean;
    /** Number of batches processed */
    batch_count: number;
    /** Per-batch audit data */
    batches: BatchAudit[];
    /** Total issues fixed */
    issues_fixed: number;
    /** Breakdown by issue type */
    issue_breakdown: QAIssueBreakdown;
    /** Confidence score (0-1) */
    confidence: number;
    /** Any warnings encountered during processing */
    warnings: string[];
};

/**
 * Audit data for the processing stage (document preparation).
 * Tracks document download, PDF conversion, and metadata extraction.
 */
export type ProcessingStageAudit = {
    /** Processing time in milliseconds */
    processing_ms: number;
    /** Whether document was successfully downloaded */
    document_downloaded: boolean;
    /** Number of pages converted to images */
    pages_converted: number;
    /** Whether metadata was extracted from document */
    metadata_extracted: boolean;
    /** File size in bytes (optional) */
    file_size_bytes?: number;
};

/**
 * Audit data for metadata generation stage.
 */
export type MetadataStageAudit = {
    /** Model used */
    model: string;
    /** OpenAI reasoning_effort setting (gpt-5-mini supports low/medium/high only) */
    reasoning_effort: 'minimal' | 'low' | 'medium' | 'high' | 'none';
    /** Total tokens used */
    tokens_used: number;
    /** Processing time in milliseconds */
    processing_ms: number;
    /** Source of metadata extraction */
    source: 'images' | 'text';
    /** Finish reason */
    finish_reason: string;
};

/**
 * Snapshot of AI configuration at time of processing.
 * Used for reproducibility and debugging.
 */
export type AIConfigSnapshot = {
    /** Translation model from env or default */
    AI_MODEL_TRANSLATION: string;
    /** QA model from env or default */
    AI_MODEL_QA: string;
    /** Metadata model from env or default */
    AI_MODEL_METADATA: string;
    /** Full translation preset at time of processing */
    preset_translation: {
        reasoning: string;
        verbosity?: string;
        responseFormat?: string;
        taskType: string;
    };
    /** Full QA preset at time of processing */
    preset_qa: {
        reasoning: string;
        verbosity?: string;
        responseFormat?: string;
        taskType: string;
    };
    /** Full metadata preset at time of processing */
    preset_metadata: {
        reasoning: string;
        maxOutputTokens?: number;
        responseFormat?: string;
        taskType: string;
    };
};

/**
 * Pipeline-level summary of the entire translation process.
 */
export type PipelineSummary = {
    /** Total processing time across all stages */
    total_processing_ms: number;
    /** Total tokens used across all stages */
    total_tokens: number;
    /** Stages that were completed successfully */
    stages_completed: ('processing' | 'metadata' | 'translation' | 'qa')[];
    /** Any errors encountered (non-fatal) */
    errors: string[];
    /** Timestamp when processing started */
    started_at: string;
    /** Timestamp when processing completed */
    completed_at: string;
    /** Configuration snapshot for reproducibility */
    config_snapshot: AIConfigSnapshot;
};

/**
 * Complete AI audit data for a translation.
 * Stored in `translations.details.ai_audit`.
 */
export type AIAuditData = {
    schema_version: 1;
    /** Processing stage audit (document download, conversion, metadata extraction) */
    processing?: ProcessingStageAudit;
    /** Translation stage audit (always present for completed translations) */
    translation: TranslationStageAudit;
    /** QA stage audit (present if QA was run) */
    qa?: QAStageAudit;
    /** Metadata stage audit (present if metadata was generated) */
    metadata?: MetadataStageAudit;
    /** Pipeline-level summary */
    pipeline: PipelineSummary;
};

export type PartialAIAuditData = Partial<AIAuditData>;

/**
 * Extended translation result that includes audit data.
 */
export type TranslationResultWithAudit<T> = {
    /** The translation result */
    result: T;
    /** Audit data for this stage */
    audit: TranslationStageAudit;
};

/**
 * Extended QA result that includes audit data.
 */
export type QAResultWithAudit<T> = {
    /** The QA result */
    result: T;
    /** Audit data for this stage */
    audit: QAStageAudit;
};
