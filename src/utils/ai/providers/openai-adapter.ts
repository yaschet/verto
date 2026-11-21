/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { logger } from '@trigger.dev/sdk';
import OpenAI from 'openai';
import { env } from '@/env';
import type {
    AICompletionResponse,
    AIProvider,
    AITaskConfig,
    AITaskType,
    OutputVerbosity,
    VisionContent,
} from '@/utils/ai/ai-config';
import type { ResponseCreateParamsNonStreaming } from 'openai/resources/responses/responses';

// ─────────────────────────────────────────────────────────────────────────────
// OPENAI CLIENT
// ─────────────────────────────────────────────────────────────────────────────

const openai = new OpenAI({
    apiKey: env.OPEN_AI_API_KEY,
    timeout: 3600 * 1000, // 1 hour timeout (SaaS needs durability for long docs)
});

/**
 * Maps abstract verbosity levels to Responses API verbosity.
 * Controls output length preference.
 */
type ResponsesVerbosity = 'low' | 'medium' | 'high';

const VERBOSITY_MAP: Record<OutputVerbosity, ResponsesVerbosity> = {
    concise: 'low',
    standard: 'medium',
    detailed: 'high',
};

import { AI_CONFIG } from '@/config/ai';

/**
 * Gets the model for a task type from centralized config.
 *
 * Source of Truth: src/config/ai.ts
 */
function getModelForTaskType(taskType: AITaskType): string {
    switch (taskType) {
        case 'translation':
            return AI_CONFIG.tasks.translation;
        case 'qa':
            return AI_CONFIG.tasks.qa;
        case 'metadata':
            return AI_CONFIG.tasks.metadata;
        case 'verification':
            return AI_CONFIG.tasks.verification;
        case 'repair':
            return AI_CONFIG.tasks.repair;
        default:
            return AI_CONFIG.model;
    }
}
// Track deprecation warning
getModelForTaskType._deprecationWarned = false;

// ─────────────────────────────────────────────────────────────────────────────
// ADAPTER IMPLEMENTATION - RESPONSES API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * OpenAI Provider implementation using Responses API.
 *
 * Key differences from Chat Completions:
 * - Uses `input` instead of `messages`
 * - Uses `instructions` instead of system message
 * - Uses `reasoning: { effort }` instead of `reasoning_effort`
 * - Uses `text: { verbosity }` for output control
 * - Response text via `response.output_text` (SDK convenience)
 */
export const openaiProvider: AIProvider = {
    name: 'OpenAI',

    async complete(
        messages: { role: string; content?: unknown }[],
        config: AITaskConfig,
        systemPrompt?: string,
    ): Promise<AICompletionResponse> {
        // Extract user content from messages
        const userContent = messages
            .filter((m) => m.role === 'user')
            .map((m) => (typeof m.content === 'string' ? m.content : JSON.stringify(m.content)))
            .join('\n\n');

        const model = getModelForTaskType(config.taskType);
        const reasoningEffort = config.reasoning;
        const verbosity = config.verbosity ? VERBOSITY_MAP[config.verbosity] : 'medium';

        logger.debug('OpenAI Responses API request', {
            model,
            reasoning: reasoningEffort,
            verbosity,
            maxTokens: config.maxOutputTokens || 'unlimited',
            taskType: config.taskType,
        });

        try {
            const params: ResponseCreateParamsNonStreaming = {
                model,
                input: userContent,
                instructions: systemPrompt,
                reasoning: { effort: reasoningEffort === 'minimal' ? 'none' : reasoningEffort },
                text: { verbosity },
                store: false, // Don't store in OpenAI's conversation memory
            };

            // Add max tokens if specified
            if (config.maxOutputTokens !== undefined) {
                params.max_output_tokens = config.maxOutputTokens;
            }

            // Add JSON response format if needed
            if (config.responseFormat === 'json') {
                params.text = {
                    ...params.text,
                    format: { type: 'json_object' },
                };
            }

            const response = await openai.responses.create(params, {
                timeout: 7200 * 1000, // 2 hours explicit timeout
            });

            // Extract response using SDK convenience property
            const content = response.output_text || '';
            const tokensUsed = response.usage?.total_tokens || 0;
            const truncated = response.status === 'incomplete';
            const finishReason = response.status || null;

            if (truncated) {
                logger.warn('Response truncated', {
                    model,
                    tokensUsed,
                    status: response.status,
                    taskType: config.taskType,
                });
            }

            return {
                content,
                tokensUsed,
                truncated,
                finishReason,
            };
        } catch (error) {
            logger.error('OpenAI Responses API request failed', {
                error: (error as Error).message,
                model,
                taskType: config.taskType,
            });
            throw error;
        }
    },

    async completeWithVision(
        content: VisionContent[],
        config: AITaskConfig,
        systemPrompt: string,
    ): Promise<AICompletionResponse> {
        const model = getModelForTaskType(config.taskType);
        const reasoningEffort = config.reasoning;
        const verbosity = config.verbosity ? VERBOSITY_MAP[config.verbosity] : 'medium';

        logger.debug('OpenAI Responses API vision request', {
            model,
            reasoning: reasoningEffort,
            verbosity,
            maxTokens: config.maxOutputTokens || 'unlimited',
            taskType: config.taskType,
            contentParts: content.length,
        });

        try {
            // Convert VisionContent to Responses API content items
            // input_text/input_image are CONTENT types, not INPUT types
            // They must be wrapped in a message object
            const contentItems = content.map((item) => {
                if (item.type === 'text') {
                    return { type: 'input_text' as const, text: item.text };
                } else {
                    return {
                        type: 'input_image' as const,
                        image_url: item.image_url.url,
                        detail: item.image_url.detail || 'auto',
                    };
                }
            });

            // Wrap content in a user message - Responses API requires message objects at top level
            const inputMessage = {
                role: 'user' as const,
                content: contentItems,
            };

            const params: ResponseCreateParamsNonStreaming = {
                model,
                input: [inputMessage],
                instructions: systemPrompt,
                reasoning: { effort: reasoningEffort === 'minimal' ? 'none' : reasoningEffort },
                text: { verbosity },
                store: false,
            };

            // Add max tokens if specified
            if (config.maxOutputTokens !== undefined) {
                params.max_output_tokens = config.maxOutputTokens;
            }

            // Add JSON response format if needed
            if (config.responseFormat === 'json') {
                params.text = {
                    ...params.text,
                    format: { type: 'json_object' },
                };
            }

            const response = await openai.responses.create(params, {
                timeout: 7200 * 1000, // 2 hours explicit timeout
            });

            const responseContent = response.output_text || '';
            const tokensUsed = response.usage?.total_tokens || 0;
            const truncated = response.status === 'incomplete';
            const finishReason = response.status || null;

            if (truncated) {
                logger.warn('Vision response truncated', {
                    model,
                    tokensUsed,
                    status: response.status,
                    taskType: config.taskType,
                });
            }

            return {
                content: responseContent,
                tokensUsed,
                truncated,
                finishReason,
            };
        } catch (error) {
            logger.error('OpenAI Responses API vision request failed', {
                error: (error as Error).message,
                model,
                taskType: config.taskType,
            });
            throw error;
        }
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Default provider export.
 * Other parts of the app import this and use it through the abstract interface.
 */
export default openaiProvider;

/**
 * Get the model name for a task type (for logging/debugging only).
 * Uses environment variables with fallbacks.
 */
export function getModelForTask(taskType: AITaskType): string {
    return getModelForTaskType(taskType);
}
