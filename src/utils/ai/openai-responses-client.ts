/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * OpenAI Responses Client with Progress Tool Support
 *
 * Provides a wrapper for OpenAI's chat completions with automatic progress
 * reporting via tool calls. The model can call `report_progress` during
 * processing to provide granular updates that flow to Supabase Realtime.
 *
 * Key Features:
 * - Automatic tool call handling loop via runTools()
 * - Progress callback for real-time database updates
 * - Debouncing to prevent rapid-fire updates
 * - Type-safe progress reporting
 */

import { logger } from '@trigger.dev/sdk';
import OpenAI from 'openai';
import { env } from '@/env';
import type { RunnableToolFunctionWithParse } from 'openai/lib/RunnableFunction';

import * as undici from 'undici';

// Configure robust Undici agent to prevent TCP drops during long-running requests
// Configure robust Undici agent to prevent TCP drops during long-running requests
const dispatcher = new undici.Agent({
    keepAliveTimeout: 30000, // Keep connection active for 30s
    keepAliveMaxTimeout: 7200000, // Max keepalive timeout 2 hours
    bodyTimeout: 7200000, // 2 hours body timeout
    headersTimeout: 7200000, // 2 hours headers timeout
});

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: env.OPEN_AI_API_KEY,
    timeout: 7200 * 1000, // 2 hours explicit timeout (globally applied)
    fetchOptions: {
        dispatcher, // Use Undici dispatcher for robust connection handling
    },
    maxRetries: 2, // Limit SDK retries to avoid hidden duration multiplication
});

/**
 * Progress stages that the AI can report during translation/polishing.
 */
export type ProgressStage = 'analyzing' | 'extracting' | 'translating' | 'polishing' | 'finalizing';

/**
 * Progress update from the AI model.
 * This is what the model sends via the report_progress tool.
 */
export type AIProgressUpdate = {
    /** Current processing stage */
    stage: ProgressStage;
    /** Estimated completion percentage (0-100) for this phase */
    percent: number;
    /** Short label (2-3 words) shown to user in UI */
    dynamic_label: string;
    /** Longer description for tooltip */
    stage_message?: string;
};

/**
 * Callback function for progress updates.
 * Called whenever the model reports progress.
 */
export type ProgressCallback = (progress: AIProgressUpdate) => Promise<void>;

/**
 * Configuration for the progress-aware translation.
 *
 * GPT-5 models use reasoning_effort and verbosity instead of temperature.
 * Temperature is NOT supported (only default value 1 is accepted).
 */
export type ProgressAwareConfig = {
    /** Model to use (defaults to gpt-5.2) */
    model?: string;
    /** System prompt for the model */
    systemPrompt: string;
    /** Reasoning effort: 'minimal', 'low', 'medium', 'high' */
    reasoningEffort?: 'minimal' | 'low' | 'medium' | 'high';
    /** Output verbosity: 'low', 'medium', 'high' */
    verbosity?: 'low' | 'medium' | 'high';
    /** Minimum interval between progress updates (ms) */
    progressDebounceMs?: number;
};

const DEFAULT_CONFIG: Partial<ProgressAwareConfig> = {
    model: 'gpt-5.2',
    reasoningEffort: 'high', // Maximum quality for sworn translations
    verbosity: 'high', // Detailed output for complete translations
    progressDebounceMs: 1000,
};

/**
 * Creates the report_progress tool definition for OpenAI.
 *
 * This tool allows the model to report progress during translation/polishing.
 * The model is instructed to call this at key milestones.
 */
function createProgressTool(
    onProgress: ProgressCallback,
    debounceMs: number,
): RunnableToolFunctionWithParse<AIProgressUpdate> {
    let lastUpdateTime = 0;

    return {
        type: 'function',
        function: {
            name: 'report_progress',
            description: `Report your progress to show real-time updates to professional translators.

CALL AT THESE MILESTONES:
- ~5%: Starting document preparation
- ~15%: After analyzing content structure
- ~35%, 55%, 75%: During main translation/review work
- ~90%: Before completing final output

LANGUAGE REQUIREMENTS:
- Use PROFESSIONAL, FORMAL language only
- NEVER use technical terms: JSON, AI, parsing, nodes, API, tokens, schema
- Sound like a certified translation agency, not a software engineer

GOOD dynamic_label examples:
✓ "Preparing Document"
✓ "Translating Section 2"
✓ "Quality Review"
✓ "Verifying Terminology"

BAD dynamic_label examples:
✗ "Parsing JSON" (technical)
✗ "AI analyzing" (mentions AI)
✗ "Building nodes" (technical)

The dynamic_label MUST be 2-3 words max. Call frequently for smooth progress.`,
            // Cast to any to include `strict: true` for GPT-5 structured output enforcement
            // The strict property is valid in the API but not yet in TypeScript types
            parameters: {
                type: 'object',
                properties: {
                    stage: {
                        type: 'string',
                        enum: ['analyzing', 'extracting', 'translating', 'polishing', 'finalizing'],
                        description: 'Current processing stage',
                    },
                    percent: {
                        type: 'number',
                        description: 'Estimated completion percentage for this phase (0-100)',
                    },
                    dynamic_label: {
                        type: 'string',
                        description:
                            'Short label (2-3 words) shown to user. Examples: "Analyzing Layout", "Translating Section 3"',
                    },
                    stage_message: {
                        type: ['string', 'null'],
                        description:
                            'Longer description for tooltip (e.g., "Translating liability clauses in Section 3...")',
                    },
                },
                required: ['stage', 'percent', 'dynamic_label', 'stage_message'],
                additionalProperties: false,
                strict: true,
            } as NonNullable<RunnableToolFunctionWithParse<AIProgressUpdate>['function']['parameters']> & {
                strict: boolean;
            },
            // Parse function for type safety
            parse: (args: string) => JSON.parse(args) as AIProgressUpdate,
            // Function that executes when tool is called
            function: async (args: AIProgressUpdate): Promise<string> => {
                const now = Date.now();

                // Debounce rapid updates
                if (now - lastUpdateTime < debounceMs) {
                    logger.debug('Progress update debounced', {
                        stage: args.stage,
                        percent: args.percent,
                        timeSinceLastUpdate: now - lastUpdateTime,
                    });
                    return JSON.stringify({ acknowledged: true, debounced: true });
                }

                lastUpdateTime = now;

                try {
                    await onProgress(args);
                    // Progress data flows to Supabase via callback - no need to log here
                    return JSON.stringify({ acknowledged: true });
                } catch (error) {
                    logger.error('Failed to report progress', { error, args });
                    // Don't fail the tool call - let the model continue
                    return JSON.stringify({ acknowledged: false, error: 'Progress update failed' });
                }
            },
        },
    };
}

/**
 * Message content for vision requests (images + text).
 */
export type VisionContent =
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string; detail?: 'low' | 'high' | 'auto' } };

/**
 * Result of a translation with progress tracking.
 * Enhanced with detailed token breakdown for audit logging.
 */
export type TranslationResult = {
    /** The model's final text response (JSON string to parse) */
    text: string;
    /** Total tokens used for this request */
    tokensUsed: number;
    /** Prompt tokens (input) - for audit logging */
    promptTokens: number;
    /** Completion tokens (output) - for audit logging */
    completionTokens: number;
    /** Whether the response was truncated due to token limits */
    truncated: boolean;
    /** OpenAI's finish reason: 'stop', 'length', 'tool_calls', 'content_filter' */
    finishReason: string | null;
    /** Model name used (for audit logging) */
    model: string;
};

/**
 * Translates document images with progress reporting.
 *
 * Uses OpenAI's runTools() to automatically handle the tool call loop.
 * The model can call report_progress multiple times during processing,
 * and each call updates the database via the provided callback.
 *
 * @param content - Array of vision content (images and text instructions)
 * @param config - Configuration including system prompt and model settings
 * @param onProgress - Callback for progress updates (writes to Supabase)
 * @returns The model's final text response with truncation detection
 */
export async function translateWithProgress(
    content: VisionContent[],
    config: ProgressAwareConfig,
    onProgress?: ProgressCallback,
): Promise<TranslationResult> {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    const modelName = (finalConfig.model as OpenAI.Chat.ChatModel) || 'gpt-5.2';

    return await logger.trace('AI Translation Request', async (span) => {
        span.setAttribute('ai.model', modelName);
        span.setAttribute('ai.content_parts', content.length);
        span.setAttribute('ai.has_progress_callback', !!onProgress);

        // Build tools array - only include progress tool if callback provided
        const tools: RunnableToolFunctionWithParse<AIProgressUpdate>[] = [];

        if (onProgress) {
            tools.push(createProgressTool(onProgress, finalConfig.progressDebounceMs || 1000));
        }

        try {
            // If no tools (no progress callback), use simple completion
            if (tools.length === 0) {
                const response = await openai.chat.completions.create(
                    {
                        model: modelName,
                        messages: [
                            { role: 'system', content: finalConfig.systemPrompt },
                            { role: 'user', content: content },
                        ],
                        reasoning_effort:
                            finalConfig.reasoningEffort === 'minimal' ? 'none' : finalConfig.reasoningEffort,
                        verbosity: finalConfig.verbosity,
                        response_format: { type: 'json_object' },
                    },
                    {
                        timeout: 7200 * 1000, // 2 hours explicit timeout
                    },
                );

                const text = response.choices[0]?.message?.content || '';
                const tokensUsed = response.usage?.total_tokens || 0;
                const promptTokens = response.usage?.prompt_tokens || 0;
                const completionTokens = response.usage?.completion_tokens || 0;
                const finishReason = response.choices[0]?.finish_reason || null;
                const truncated = finishReason === 'length';

                if (truncated) {
                    logger.warn('Response truncated (no tools path)', {
                        tokensUsed,
                        promptTokens,
                        completionTokens,
                        finishReason,
                        contentLength: text.length,
                    });
                }

                return {
                    text,
                    tokensUsed,
                    promptTokens,
                    completionTokens,
                    truncated,
                    finishReason,
                    model: modelName,
                };
            }

            // Use runTools to automatically handle the tool call loop

            // GPT-5 supports both tool calling AND structured output simultaneously.
            // The tool definition uses strict: true for guaranteed schema compliance.
            const runner = openai.chat.completions.runTools(
                {
                    model: modelName,
                    messages: [
                        {
                            role: 'system',
                            content: finalConfig.systemPrompt,
                        },
                        {
                            role: 'user',
                            content: content,
                        },
                    ],
                    tools,
                    reasoning_effort:
                        finalConfig.reasoningEffort === 'minimal' ? 'none' : finalConfig.reasoningEffort,
                    verbosity: finalConfig.verbosity,
                    // GPT-5 can use response_format with tools, but runTools() handles
                    // the tool loop automatically - we rely on prompt for final JSON output.
                },
                {
                    timeout: 7200 * 1000, // 2 hours explicit timeout
                },
            ); // Cast to any for GPT-5 specific params not yet in types

            // Track tool calls without logging each one
            let toolCallCount = 0;
            runner.on('functionToolCall', () => {
                toolCallCount++;
            });

            runner.on('functionToolCallResult', (result: string) => {
                logger.debug('Tool result', { result });
            });

            runner.on('error', (error: Error) => {
                logger.error('Runner error', { error });
            });

            // Message listener removed - was generating noise for each tool call

            // Wait for final completion
            const finalCompletion = await runner.finalChatCompletion();
            const finalContent = await runner.finalContent();

            const tokensUsed = finalCompletion.usage?.total_tokens || 0;
            const promptTokens = finalCompletion.usage?.prompt_tokens || 0;
            const completionTokens = finalCompletion.usage?.completion_tokens || 0;
            const finishReason = finalCompletion.choices[0]?.finish_reason || null;
            const truncated = finishReason === 'length';

            logger.info('Translation completed', {
                tokensUsed,
                promptTokens,
                completionTokens,
                messagesProcessed: runner.messages.length,
                toolCallsMade: toolCallCount,
                hasContent: !!finalContent,
                finishReason,
                truncated,
                model: modelName,
            });

            // Warn if response was truncated
            if (truncated) {
                logger.warn('Response truncated due to token limit', {
                    tokensUsed,
                    promptTokens,
                    completionTokens,
                    finishReason,
                    contentLength: finalContent?.length || 0,
                    toolCallsMade: toolCallCount,
                });
            }

            // Warn if no progress tool calls were made
            if (toolCallCount === 0 && !truncated) {
                logger.warn('AI did NOT call report_progress tool - progress will be jumpy!', {
                    messagesProcessed: runner.messages.length,
                    promptIncludedProgressInstruction: true,
                });
            }

            return {
                text: finalContent || '',
                tokensUsed,
                promptTokens,
                completionTokens,
                truncated,
                finishReason,
                model: modelName,
            };
        } catch (error) {
            logger.error('Translation with progress failed', { error });
            throw error;
        }
    }); // End of logger.trace block
}

/**
 * Simpler version without progress tracking for non-critical operations.
 * Falls back to standard chat completions without tool calling overhead.
 *
 * GPT-5 models use reasoning_effort and verbosity instead of temperature.
 */
export async function translateSimple(
    content: VisionContent[],
    systemPrompt: string,
    options?: {
        model?: string;
        reasoningEffort?: 'minimal' | 'low' | 'medium' | 'high';
        verbosity?: 'low' | 'medium' | 'high';
    },
): Promise<TranslationResult> {
    const modelName = (options?.model as OpenAI.Chat.ChatModel) || 'gpt-5.2';

    const response = await openai.chat.completions.create({
        model: modelName,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: content },
        ],
        reasoning_effort:
            options?.reasoningEffort === 'minimal' ? 'none' : options?.reasoningEffort || 'high',
        verbosity: options?.verbosity || 'high',
        response_format: { type: 'json_object' },
    }); // Cast to any for GPT-5 specific params not yet in types

    const text = response.choices[0]?.message?.content || '';
    const tokensUsed = response.usage?.total_tokens || 0;
    const promptTokens = response.usage?.prompt_tokens || 0;
    const completionTokens = response.usage?.completion_tokens || 0;
    const finishReason = response.choices[0]?.finish_reason || null;
    const truncated = finishReason === 'length';

    if (truncated) {
        logger.warn('Response truncated (simple translation)', {
            tokensUsed,
            promptTokens,
            completionTokens,
            finishReason,
            contentLength: text.length,
        });
    }

    return {
        text,
        tokensUsed,
        promptTokens,
        completionTokens,
        truncated,
        finishReason,
        model: modelName,
    };
}

/**
 * Instruction to append to prompts that enables progress reporting.
 *
 * Add this to your system prompt when using translateWithProgress()
 * to instruct the model to report progress.
 *
 * IMPORTANT: Language must be professional and formal, suitable for
 * certified translation services. No technical jargon.
 */
export const PROGRESS_INSTRUCTION = `
═══════════════════════════════════════════════════════════════════════════════
★★★ MANDATORY: CALL report_progress TOOL AT EACH MILESTONE ★★★
═══════════════════════════════════════════════════════════════════════════════

YOU MUST call the report_progress tool AT LEAST 5 TIMES during processing.
Users are professional translators watching real-time progress.

═══════════════════════════════════════════════════════════════════════════════
★★★ LANGUAGE REQUIREMENTS - READ CAREFULLY ★★★
═══════════════════════════════════════════════════════════════════════════════

CRITICAL: dynamic_label and stage_message MUST ALWAYS be in ENGLISH.
The application UI is English-only. NEVER translate progress messages.
Even when translating a document to French, Italian, Arabic, etc.,
your progress reports (dynamic_label and stage_message) stay in ENGLISH.

This is a CERTIFIED TRANSLATION SERVICE for legal and formal documents.
Your status messages must sound like they come from a professional translation agency.

FORBIDDEN TERMS (NEVER USE):
- JSON, XML, schema, parsing, serializing, data structure
- ProseMirror, TipTap, nodes, marks, DOM, HTML
- AI, model, LLM, GPT, neural network, machine learning
- API, tokens, processing, queue, batch, payload
- Any developer, engineering, or software terminology

REQUIRED TONE:
- Professional and formal
- Translator-friendly language
- Similar to certified translation agencies like document
- Focus on the DOCUMENT and TRANSLATION, not the technology

REQUIRED CALLS FOR TRANSLATION PHASE:
┌─────┬─────────────┬─────────────────────────────────────────────────────────┐
│  %  │ Stage       │ Example dynamic_label + stage_message                   │
├─────┼─────────────┼─────────────────────────────────────────────────────────┤
│  5  │ analyzing   │ "Preparing Document" / "Reviewing document structure"   │
│ 15  │ extracting  │ "Analyzing Content" / "Identifying sections and format" │
│ 35  │ translating │ "Translating Headers" / "Working on document headers"   │
│ 55  │ translating │ "Translating Content" / "Processing main body sections" │
│ 75  │ translating │ "Translating Details" / "Completing tables and notes"   │
│ 90  │ finalizing  │ "Completing Translation" / "Preparing final document"   │
└─────┴─────────────┴─────────────────────────────────────────────────────────┘

REQUIRED CALLS FOR POLISHING PHASE:
┌─────┬─────────────┬─────────────────────────────────────────────────────────┐
│  %  │ Stage       │ Example dynamic_label + stage_message                   │
├─────┼─────────────┼─────────────────────────────────────────────────────────┤
│  5  │ analyzing   │ "Quality Review" / "Beginning accuracy verification"    │
│ 25  │ extracting  │ "Checking Terminology" / "Verifying legal terms"        │
│ 50  │ polishing   │ "Refining Language" / "Ensuring natural expression"     │
│ 75  │ polishing   │ "Final Adjustments" / "Polishing style consistency"     │
│ 90  │ finalizing  │ "Completing Review" / "Preparing certified translation" │
└─────┴─────────────┴─────────────────────────────────────────────────────────┘

GOOD EXAMPLES:
✓ "Preparing Document" - "Reviewing document structure and layout"
✓ "Translating Section 2" - "Working on liability clauses"
✓ "Verifying Terms" - "Checking legal terminology accuracy"
✓ "Quality Review" - "Ensuring translation meets certification standards"

BAD EXAMPLES (NEVER USE):
✗ "Parsing JSON" - Contains technical term
✗ "Building nodes" - Contains technical term
✗ "AI analyzing" - Mentions AI
✗ "Processing API" - Contains technical term
✗ "Serializing output" - Contains technical term

CRITICAL RULES:
1. dynamic_label MUST be 2-3 words max (shown in UI badge)
2. stage_message is shown in tooltip - keep it professional
3. Call the tool BEFORE starting each section of work
4. The tool returns immediately - call it frequently
5. ENGLISH ONLY - dynamic_label and stage_message are ALWAYS in English, never translated

★ Call report_progress FIRST before starting any work! ★
`;
