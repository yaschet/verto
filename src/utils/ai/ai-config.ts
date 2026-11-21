/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * Provider-Agnostic AI Configuration
 *
 * Abstracts AI model configuration from specific providers (OpenAI, Claude, Gemini).
 * Business logic uses abstract presets; adapters translate to provider-specific params.
 *
 * DESIGN PRINCIPLES:
 * 1. No hardcoded model names in business logic
 * 2. Behavior-driven configuration (what we want, not how to get it)
 * 3. Task-based model selection (translation needs power, metadata needs speed)
 * 4. Scalable to future providers (OpenRouter, Claude, Gemini, xAI Grok, etc)
 */

import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

// ─────────────────────────────────────────────────────────────────────────────
// ABSTRACT TYPES - Provider Independent
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reasoning effort levels - matches OpenAI Responses API.
 *
 * Per OpenAI SDK (shared.d.ts):
 * - gpt-5.2: supports 'none', 'low', 'medium', 'high' (defaults to 'none')
 * - gpt-5-mini, gpt-5-nano (pre-5.2): supports 'low', 'medium', 'high' only (defaults to 'medium')
 *
 * We use 'low' as minimum since we use gpt-5-mini for most tasks.
 * 'minimal' is available for gpt-5.2 to skip reasoning entirely for max speed.
 */
export type ReasoningLevel = 'minimal' | 'low' | 'medium' | 'high';

/**
 * Abstract output verbosity levels.
 * Controls how detailed the AI response should be.
 *
 * - concise: Short, to-the-point responses
 * - standard: Normal detail level
 * - detailed: Complete, thorough responses
 */
export type OutputVerbosity = 'concise' | 'standard' | 'detailed';

/**
 * Task categories for model selection.
 * Providers use this to select appropriate model tier.
 */
export type AITaskType = 'translation' | 'qa' | 'verification' | 'repair' | 'metadata';

/**
 * Provider-agnostic AI task configuration.
 * Defines WHAT we want, not HOW to get it.
 */
export type AITaskConfig = {
    /** Quality level for reasoning */
    reasoning: ReasoningLevel;
    /** Output verbosity preference */
    verbosity?: OutputVerbosity;
    /** Maximum output tokens (optional - omit for full context window) */
    maxOutputTokens?: number;
    /** Response format */
    responseFormat?: 'json' | 'text';
    /** Task category for model selection */
    taskType: AITaskType;
};

// ─────────────────────────────────────────────────────────────────────────────
// VISION CONTENT TYPES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Vision content for multimodal requests.
 */
export type VisionContent =
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string; detail?: 'low' | 'high' | 'auto' } };

// ─────────────────────────────────────────────────────────────────────────────
// RESPONSE TYPES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Standard AI completion response.
 */
export type AICompletionResponse = {
    /** The model's text response */
    content: string;
    /** Tokens used for this request */
    tokensUsed: number;
    /** Whether response was truncated */
    truncated: boolean;
    /** Finish reason from provider */
    finishReason: string | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// PRESET CONFIGURATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pre-defined configurations for common tasks.
 * Uses 'low' as minimum - gpt-5-mini doesn't support 'none'.
 */
export const AI_PRESETS = {
    /** Translation - medium reasoning for accurate table structure */
    translation: {
        reasoning: 'medium',
        verbosity: 'detailed',
        responseFormat: 'json',
        taskType: 'translation',
    } as const satisfies AITaskConfig,

    /** QA polish pass - medium reasoning for table verification */
    qa: {
        reasoning: 'medium',
        verbosity: 'detailed',
        responseFormat: 'json',
        taskType: 'qa',
    } as const satisfies AITaskConfig,

    /** Verification - low reasoning for comparison tasks */
    verification: {
        reasoning: 'medium',
        verbosity: 'standard',
        responseFormat: 'json',
        taskType: 'verification',
    } as const satisfies AITaskConfig,

    /** Repair - low reasoning for structural fixes */
    repair: {
        reasoning: 'medium',
        responseFormat: 'json',
        taskType: 'repair',
    } as const satisfies AITaskConfig,

    /** Metadata extraction - low reasoning */
    metadata: {
        reasoning: 'minimal',
        maxOutputTokens: 500,
        responseFormat: 'json',
        taskType: 'metadata',
    } as const satisfies AITaskConfig,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER INTERFACE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * AI Provider interface.
 * Implement this for each provider (OpenAI, Claude, Gemini, OpenRouter).
 */
export type AIProvider = {
    /** Provider name for logging */
    readonly name: string;

    /** Complete a chat request */
    complete(
        messages: ChatCompletionMessageParam[],
        config: AITaskConfig,
        systemPrompt?: string,
    ): Promise<AICompletionResponse>;

    /** Complete a vision request (images + text) */
    completeWithVision(
        content: VisionContent[],
        config: AITaskConfig,
        systemPrompt: string,
    ): Promise<AICompletionResponse>;
};

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY TYPES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Type for AI_PRESETS keys.
 */
export type AIPresetName = keyof typeof AI_PRESETS;

/**
 * Get a preset configuration by name.
 */
export function getPreset(name: AIPresetName): AITaskConfig {
    return AI_PRESETS[name];
}
