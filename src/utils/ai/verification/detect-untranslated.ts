/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

/**
 * Untranslated Content Detector
 *
 * Uses GPT-5-mini to scan translated documents for content that
 * remains in the source language when it should have been translated.
 *
 * Key Features:
 * - Extracts all text nodes with JSON paths for precise location
 * - Distinguishes between untranslated content and protected entities (names, addresses)
 * - Returns actionable segments with paths for auto-fix
 * - Uses document context (type, domain) for accurate detection
 *
 * Model: GPT-5-mini with reasoning_effort: 'high'
 */

import OpenAI from 'openai';
import { env } from '@/env';
import { UntranslatedDetectionResponseSchema } from '@schemas/verification-schemas';
import { parseAndValidateJSONSafe } from '@utils/ai/schema-validation';
import { logError, logPhase, logWarning, timedOperation } from '@/trigger/logging';
import type { ContentNode, NormalisedDocument, TextNode } from '@/engine/document/types';

/**
 * Document context for improved detection accuracy.
 */
export type DetectionContext = {
    /** Document type affects what terminology is expected */
    documentType: 'legal' | 'medical' | 'financial' | 'certificate' | 'general';
    /** Document name helps identify purpose */
    documentName?: string;
};

const openai = new OpenAI({
    apiKey: env.OPEN_AI_API_KEY,
});

export type UntranslatedSegment = {
    /** The text that appears untranslated */
    text: string;
    /** JSON path to the text node (e.g., "content[3].content[0].text") */
    path: string;
    /** Index in the extracted text array */
    index: number;
    /** Confidence that this is truly untranslated (0-1) */
    confidence: number;
    /** Brief reason why this was flagged */
    reason: string;
};

export type UntranslatedResult = {
    /** Whether any untranslated content was detected */
    hasIssues: boolean;
    /** List of untranslated segments */
    untranslatedSegments: UntranslatedSegment[];
    /** Total text segments analyzed */
    segmentsAnalyzed: number;
    /** Tokens used for detection */
    tokensUsed: number;
};

type ExtractedText = {
    text: string;
    path: string;
    index: number;
};

/**
 * Extracts all text content from a document with JSON paths.
 */
function extractTextWithPaths(doc: NormalisedDocument): ExtractedText[] {
    const extracted: ExtractedText[] = [];
    let index = 0;

    function traverse(nodes: ContentNode[], basePath: string) {
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            const nodePath = `${basePath}[${i}]`;

            if (node.type === 'text') {
                const textNode = node as TextNode;
                if (textNode.text && textNode.text.trim().length > 0) {
                    extracted.push({
                        text: textNode.text,
                        path: `${nodePath}.text`,
                        index: index++,
                    });
                }
            }

            // Handle keyValuePair specially - extract both key and value
            if (node.type === 'keyValuePair' && 'attrs' in node) {
                const kvNode = node;
                if (kvNode.attrs?.key) {
                    extracted.push({
                        text: kvNode.attrs.key,
                        path: `${nodePath}.attrs.key`,
                        index: index++,
                    });
                }
                if (kvNode.attrs?.value) {
                    extracted.push({
                        text: kvNode.attrs.value,
                        path: `${nodePath}.attrs.value`,
                        index: index++,
                    });
                }
            }

            // Recurse into content
            if ('content' in node && Array.isArray(node.content)) {
                traverse(node.content as ContentNode[], `${nodePath}.content`);
            }
        }
    }

    traverse(doc.content, 'content');
    return extracted;
}

/**
 * Domain-specific terminology that should NOT be flagged as untranslated.
 */
const DOMAIN_PROTECTED_TERMS: Record<string, string[]> = {
    legal: [
        'et al.',
        'ad hoc',
        'pro bono',
        'de facto',
        'de jure',
        'habeas corpus',
        'quid pro quo',
        'ex parte',
        'in re',
        'inter alia',
        'prima facie',
    ],
    medical: [
        'in vitro',
        'in vivo',
        'per os',
        'stat',
        'prn',
        'qid',
        'bid',
        'tid',
        'mg',
        'ml',
        'kg',
        'IU',
        'BP',
        'HR',
        'SpO2',
        'BMI',
        'CT',
        'MRI',
        'ECG',
    ],
    financial: [
        'IBAN',
        'SWIFT',
        'BIC',
        'SEPA',
        'USD',
        'EUR',
        'GBP',
        'ROI',
        'P&L',
        'EBITDA',
        'YTD',
        'QoQ',
        'YoY',
        'APR',
        'APY',
    ],
    certificate: [
        'N°',
        'No.',
        'ID',
        'Ref.',
        'Vol.',
        'Art.',
        'Dr.',
        'Mr.',
        'Mrs.',
        'Ms.',
        // Academic degree titles - often kept in original language on certificates
        'Bachelor',
        'Master',
        'Doctor',
        'PhD',
        'MBA',
        'MSc',
        'BSc',
        'BA',
        'MA',
        'Bachelor of Science',
        'Master of Science',
        'Bachelor of Arts',
        'Master of Arts',
        'Doctor of Philosophy',
        'Magister',
        'Licenciado',
        'Laurea',
        'Diplom',
    ],
    general: [],
};

/**
 * Builds the system prompt with domain expertise.
 */
function buildSystemPrompt(
    sourceLanguage: string,
    targetLanguage: string,
    context?: DetectionContext,
): string {
    const domainExpertise = context?.documentType
        ? `You specialize in ${context.documentType} document translation verification.`
        : 'You verify translations across all document types.';

    return `You are an expert SWORN TRANSLATOR QUALITY AUDITOR.

${domainExpertise}

Your task is to identify text that remains in ${sourceLanguage} when it should have been translated to ${targetLanguage}.

CRITICAL: You must achieve 100% accuracy. False positives waste resources. False negatives damage translation quality.

DECISION FRAMEWORK:
1. Is this text in ${sourceLanguage}? If no → DO NOT FLAG
2. Should this text be translated? If no (proper noun, technical term) → DO NOT FLAG
3. Is the ${sourceLanguage} text intentional? (quoted text, reference) → DO NOT FLAG
4. Only if YES to #1 and NO to #2 and #3 → FLAG IT

Respond ONLY with valid JSON. No explanations outside JSON.`;
}

/**
 * Builds the detection prompt with concrete examples and clear criteria.
 */
function buildDetectionPrompt(
    segments: ExtractedText[],
    sourceLanguage: string,
    targetLanguage: string,
    context?: DetectionContext,
): string {
    // Build numbered list with character counts for context
    const textList = segments
        .map((seg, idx) => `[${idx}] "${seg.text}" (${seg.text.length} chars)`)
        .join('\n');

    // Get domain-specific protected terms
    const domainTerms = context?.documentType ? DOMAIN_PROTECTED_TERMS[context.documentType] : [];
    const allProtectedTerms = [...DOMAIN_PROTECTED_TERMS.general, ...domainTerms];

    // Build context section
    const contextSection = context
        ? `DOCUMENT CONTEXT:
- Type: ${context.documentType.toUpperCase()} document
- Name: ${context.documentName || 'Unknown'}
- Domain-specific terms that should NOT be translated: ${allProtectedTerms.join(', ') || 'None'}`
        : '';

    return `${contextSection}

LANGUAGE PAIR:
- Source (original): ${sourceLanguage}
- Target (translated): ${targetLanguage}

TEXT SEGMENTS TO VERIFY:
${textList}

PROTECTED CATEGORIES (DO NOT FLAG):
1. PROPER NOUNS: Personal names, company names, brand names, place names
   Examples: "Sample Person", "Google LLC", "Mercedes-Benz", "New York"

2. TECHNICAL/INTERNATIONAL TERMS: Universally used without translation
   Examples: "Email", "PDF", "URL", "Wi-Fi", "COVID-19", "DNA", "RNA"

3. REFERENCE IDENTIFIERS: Numbers, codes, IDs
   Examples: "REF-A001", "ISBN 978-3-16-148410-0", "123456789"

4. INTENTIONAL FOREIGN TEXT: Quoted passages, titles in original language
   Examples: Text in quotation marks referring to original documents

5. ACADEMIC DEGREE TITLES: Often kept in English/Latin on official documents
   Examples: "Master of Science", "Bachelor of Arts", "Doctor of Philosophy", "PhD", "MBA"
   CRITICAL: Degree names like "Master of Science in Computer Science" are INTENTIONALLY in English on certificates!

6. DOMAIN-SPECIFIC PROTECTED TERMS: ${allProtectedTerms.length > 0 ? allProtectedTerms.join(', ') : 'None for this document type'}

FLAG ONLY segments where:
- The text is clearly in ${sourceLanguage}
- The text should logically be in ${targetLanguage} for a complete translation
- The text is NOT a proper noun, technical term, or reference

RESPONSE FORMAT:
{
  "analysis_summary": "<1 sentence summary of findings>",
  "untranslated": [
    {
      "index": <number>,
      "text": "<the flagged text>",
      "confidence": <0.80-1.00>,
      "reason": "<specific reason: what word/phrase is untranslated and why it should be>"
    }
  ]
}

Return empty array if all segments are correctly translated:
{ "analysis_summary": "All segments properly translated", "untranslated": [] }`;
}

/**
 * Detects untranslated content in a translated document.
 *
 * @param doc - The translated document to verify
 * @param sourceLanguage - The original document's language (e.g., "en", "English")
 * @param targetLanguage - The language it was translated to (e.g., "fr", "French")
 * @param context - Optional document context for improved accuracy
 */
export async function detectUntranslatedContent(
    doc: NormalisedDocument,
    sourceLanguage: string,
    targetLanguage: string,
    context?: DetectionContext,
): Promise<UntranslatedResult> {
    return timedOperation('detect-untranslated-content', async (span) => {
        // Extract all text with paths
        const segments = extractTextWithPaths(doc);

        if (segments.length === 0) {
            return {
                hasIssues: false,
                untranslatedSegments: [],
                segmentsAnalyzed: 0,
                tokensUsed: 0,
            };
        }

        // For very large documents, batch the analysis
        const MAX_SEGMENTS_PER_BATCH = 200;
        const batches: ExtractedText[][] = [];

        for (let i = 0; i < segments.length; i += MAX_SEGMENTS_PER_BATCH) {
            batches.push(segments.slice(i, i + MAX_SEGMENTS_PER_BATCH));
        }

        const allUntranslated: UntranslatedSegment[] = [];
        let totalTokens = 0;

        // Build system prompt once (same for all batches)
        const systemPrompt = buildSystemPrompt(sourceLanguage, targetLanguage, context);

        for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
            const batch = batches[batchIdx];
            const batchOffset = batchIdx * MAX_SEGMENTS_PER_BATCH;

            logPhase('VERIFY', `Detecting untranslated content (Batch ${batchIdx + 1}/${batches.length})`, {
                segmentsInBatch: batch.length,
                documentType: context?.documentType || 'general',
            });

            const userPrompt = buildDetectionPrompt(batch, sourceLanguage, targetLanguage, context);

            try {
                // GPT-5 series uses reasoning_effort instead of temperature
                // 'high' for sworn translator quality - 100% accuracy required
                const response = await openai.chat.completions.create({
                    model: 'gpt-5-mini',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt },
                    ],
                    max_completion_tokens: 4096, // Increased for detailed analysis
                    reasoning_effort: 'high',
                    response_format: { type: 'json_object' },
                });

                const text = response.choices[0]?.message?.content || '{}';
                totalTokens += response.usage?.total_tokens || 0;

                // Validate AI response against schema
                const validationResult = parseAndValidateJSONSafe(
                    UntranslatedDetectionResponseSchema,
                    text,
                    `untranslated-detection-batch-${batchIdx}`,
                );

                if (!validationResult.success) {
                    logWarning('Detection response failed schema validation', {
                        batch: batchIdx,
                        error: validationResult.error.message,
                    });
                    continue;
                }

                const parsed = validationResult.data;
                const untranslatedItems = parsed.untranslated ?? [];

                for (const item of untranslatedItems) {
                    const globalIndex = batchOffset + item.index;
                    const segment = segments[globalIndex];

                    if (segment && item.confidence >= 0.8) {
                        allUntranslated.push({
                            text: item.text, // Use validated text from AI
                            path: segment.path,
                            index: globalIndex,
                            confidence: item.confidence,
                            reason: item.reason,
                        });
                    }
                }
            } catch (error) {
                logError('Untranslated detection failed for batch', error, {
                    batch: batchIdx,
                });
                // Continue with other batches
            }
        }

        logPhase('VERIFY', 'Untranslated detection complete', {
            segmentsAnalyzed: segments.length,
            issuesFound: allUntranslated.length,
            tokensUsed: totalTokens,
        });

        // Add span attributes for observability
        span.setAttribute('segments.analyzed', segments.length);
        span.setAttribute('issues.found', allUntranslated.length);
        span.setAttribute('tokens.used', totalTokens);

        return {
            hasIssues: allUntranslated.length > 0,
            untranslatedSegments: allUntranslated,
            segmentsAnalyzed: segments.length,
            tokensUsed: totalTokens,
        };
    });
}
