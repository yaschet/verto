/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

export const AI_CONFIG = {
    /**
     * The primary model for high-intelligence tasks (Translation, QA, Verification).
     * @see https://openai.com/index/introducing-gpt-5-2/
     */
    model: 'gpt-5.2',

    /**
     * The fast/cost-effective model for simple tasks (Metadata, Repair).
     */
    fastModel: 'gpt-5-mini',

    tasks: {
        translation: 'gpt-5.2', // Critical: requires high precision
        qa: 'gpt-5.2', // Critical: table structure verification
        verification: 'gpt-5.2', // Critical: completeness checks
        repair: 'gpt-5-mini', // Simple structured output task
        metadata: 'gpt-5-mini', // Simple extraction task
    },
} as const;
