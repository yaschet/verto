/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * Auto-Fix Module for Untranslated Content
 *
 * Takes detected untranslated segments and translates them using GPT-5-mini.
 * Patches the document at the specific JSON paths to avoid re-translating
 * the entire document.
 *
 * Model: GPT-5-mini with reasoning_effort: 'high'
 * Quality: Sworn translator standard - 100% accuracy required
 */

import OpenAI from 'openai';
import { env } from '@/env';
import { TranslationFixResponseSchema } from '@schemas/verification-schemas';
import { parseAndValidateJSONSafe } from '@utils/ai/schema-validation';
import { logError, logPhase, logWarning, timedOperation } from '@/trigger/logging';
import type { NormalisedDocument } from '@/engine/document/types';
import type { UntranslatedSegment } from '@/utils/ai/verification/detect-untranslated';

const openai = new OpenAI({
    apiKey: env.OPEN_AI_API_KEY,
});

/**
 * Document context for translation accuracy.
 */
export type TranslationContext = {
    /** Document type for domain-specific terminology */
    documentType: 'legal' | 'medical' | 'financial' | 'certificate' | 'general';
    /** Source language for reference */
    sourceLanguage: string;
};

export type FixResult = {
    /** The document with fixed content */
    fixedDocument: NormalisedDocument;
    /** Number of segments successfully fixed */
    segmentsFixed: number;
    /** Number of segments that failed to fix */
    segmentsFailed: number;
    /** Tokens used for fixing */
    tokensUsed: number;
    /** Details of each fix attempt */
    fixDetails: {
        original: string;
        translated: string;
        path: string;
        success: boolean;
        error?: string;
    }[];
};

/**
 * Builds the system prompt for translation.
 */
function buildTranslationSystemPrompt(targetLanguage: string, context?: TranslationContext): string {
    const domainGuidance = context?.documentType
        ? `You are translating a ${context.documentType.toUpperCase()} document. Use appropriate formal register and domain-specific terminology.`
        : 'Translate with professional accuracy.';

    return `You are an expert SWORN TRANSLATOR producing legally certified translations.

${domainGuidance}

QUALITY STANDARD: Your translations must be indistinguishable from work produced by a certified human translator.

CRITICAL RULES:
1. Translate meaning accurately - never word-for-word if it sounds unnatural
2. Preserve the EXACT formality level (formal documents stay formal)
3. Keep proper nouns unchanged (names, companies, addresses)
4. Preserve numbers, dates, and reference codes exactly
5. Match the grammatical structure appropriate for ${targetLanguage}

Respond ONLY with valid JSON.`;
}

/**
 * Builds the user prompt with segments to translate.
 */
function buildTranslationUserPrompt(
    segments: { text: string; index: number; reason?: string }[],
    targetLanguage: string,
    context?: TranslationContext,
): string {
    // Include the detection reason if available (helps AI understand context)
    const textList = segments
        .map((seg) => {
            const reasonNote = seg.reason ? ` [Flagged: ${seg.reason}]` : '';
            return `[${seg.index}] "${seg.text}"${reasonNote}`;
        })
        .join('\n');

    const sourceNote = context?.sourceLanguage
        ? `These segments were detected as ${context.sourceLanguage} text that should be ${targetLanguage}.`
        : `These segments need translation to ${targetLanguage}.`;

    return `${sourceNote}

SEGMENTS TO TRANSLATE:
${textList}

TRANSLATION REQUIREMENTS:
- Each segment is independent - translate each one completely
- Preserve any punctuation at the start/end of the text
- If a segment contains a proper noun that should NOT be translated, return it unchanged
- If context is ambiguous, choose the most formal/official interpretation

RESPONSE FORMAT:
{
  "translations": {
    "0": "<translated text for segment 0>",
    "1": "<translated text for segment 1>"
  }
}

IMPORTANT: Every index in the input MUST have a corresponding translation in the output.`;
}

/**
 * Translates a batch of text segments to the target language.
 */
async function translateSegments(
    segments: { text: string; index: number; reason?: string }[],
    targetLanguage: string,
    context?: TranslationContext,
): Promise<{ translations: Map<number, string>; tokensUsed: number }> {
    if (segments.length === 0) {
        return { translations: new Map(), tokensUsed: 0 };
    }

    const systemPrompt = buildTranslationSystemPrompt(targetLanguage, context);
    const userPrompt = buildTranslationUserPrompt(segments, targetLanguage, context);

    try {
        // GPT-5 series uses reasoning_effort instead of temperature
        // 'high' for sworn translator quality - 100% accuracy required
        const response = await openai.chat.completions.create({
            model: 'gpt-5-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            max_completion_tokens: 4096, // Increased for proper translations
            reasoning_effort: 'high',
            response_format: { type: 'json_object' },
        });

        const text = response.choices[0]?.message?.content || '{}';
        const tokensUsed = response.usage?.total_tokens || 0;

        // Validate AI response against schema
        const validationResult = parseAndValidateJSONSafe(
            TranslationFixResponseSchema,
            text,
            'translation-fix',
        );

        if (!validationResult.success) {
            logError(
                'Translation response failed schema validation',
                new Error(validationResult.error.message),
            );
            return { translations: new Map(), tokensUsed };
        }

        const parsed = validationResult.data;
        const translations = new Map<number, string>();

        for (const [indexStr, translation] of Object.entries(parsed.translations)) {
            const index = parseInt(indexStr, 10);
            if (!isNaN(index)) {
                translations.set(index, translation);
            }
        }

        // Log if any segments didn't get translations
        const missingTranslations = segments.filter((s) => !translations.has(s.index));
        if (missingTranslations.length > 0) {
            logWarning('Some segments missing translations', {
                expected: segments.length,
                received: translations.size,
                missing: missingTranslations.map((s) => s.index),
            });
        }

        return { translations, tokensUsed };
    } catch (error) {
        logError('Translation request failed', error);
        return { translations: new Map(), tokensUsed: 0 };
    }
}

/**
 * Sets a value at a JSON path in an object.
 * Path format: "content[0].content[1].text"
 */
function setAtPath(obj: object, path: string, value: unknown): boolean {
    const parts = path.match(/(\w+)|\[(\d+)\]/g);
    if (!parts) return false;

    let current: unknown = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (part.startsWith('[')) {
            const index = parseInt(part.slice(1, -1), 10);
            if (!Array.isArray(current) || index >= current.length) return false;
            current = current[index];
        } else {
            if (!(part in (current as object))) return false;
            current = (current as Record<string, unknown>)[part];
        }
    }

    const lastPart = parts[parts.length - 1];
    if (lastPart.startsWith('[')) {
        const index = parseInt(lastPart.slice(1, -1), 10);
        if (!Array.isArray(current) || index >= current.length) return false;
        current[index] = value;
    } else {
        (current as Record<string, unknown>)[lastPart] = value;
    }

    return true;
}

/**
 * Fixes untranslated segments in a document.
 *
 * @param doc - The document with untranslated content
 * @param segments - The detected untranslated segments
 * @param targetLanguage - The language to translate to
 * @param context - Optional context for improved translation accuracy
 */
export async function fixUntranslatedSegments(
    doc: NormalisedDocument,
    segments: UntranslatedSegment[],
    targetLanguage: string,
    context?: TranslationContext,
): Promise<FixResult> {
    return timedOperation('auto-fix-untranslated', async (span) => {
        if (segments.length === 0) {
            return {
                fixedDocument: doc,
                segmentsFixed: 0,
                segmentsFailed: 0,
                tokensUsed: 0,
                fixDetails: [],
            };
        }

        logPhase('VERIFY', 'Fixing untranslated segments', {
            segmentCount: segments.length,
            targetLanguage,
            documentType: context?.documentType || 'general',
        });

        // Deep clone the document
        const fixedDoc = JSON.parse(JSON.stringify(doc)) as NormalisedDocument;

        // Batch translate all segments - include detection reason for context
        const toTranslate = segments.map((seg) => ({
            text: seg.text,
            index: seg.index,
            reason: seg.reason, // Pass the detection reason to help AI understand context
        }));

        const { tokensUsed, translations } = await translateSegments(toTranslate, targetLanguage, context);

        // Apply translations to the document
        const fixDetails: FixResult['fixDetails'] = [];
        let segmentsFixed = 0;
        let segmentsFailed = 0;

        for (const segment of segments) {
            const translation = translations.get(segment.index);

            if (!translation) {
                segmentsFailed++;
                fixDetails.push({
                    original: segment.text,
                    translated: '',
                    path: segment.path,
                    success: false,
                    error: 'No translation returned',
                });
                continue;
            }

            // Apply the fix at the path
            const success = setAtPath(fixedDoc, segment.path, translation);

            if (success) {
                segmentsFixed++;
                fixDetails.push({
                    original: segment.text,
                    translated: translation,
                    path: segment.path,
                    success: true,
                });
            } else {
                segmentsFailed++;
                fixDetails.push({
                    original: segment.text,
                    translated: translation,
                    path: segment.path,
                    success: false,
                    error: `Failed to apply fix at path: ${segment.path}`,
                });
            }
        }

        logPhase('VERIFY', 'Untranslated content fix complete', {
            segmentsFixed,
            segmentsFailed,
            tokensUsed,
        });

        // Add span attributes
        span.setAttribute('segments.fixed', segmentsFixed);
        span.setAttribute('segments.failed', segmentsFailed);
        span.setAttribute('tokens.used', tokensUsed);

        return {
            fixedDocument: fixedDoc,
            segmentsFixed,
            segmentsFailed,
            tokensUsed,
            fixDetails,
        };
    });
}
