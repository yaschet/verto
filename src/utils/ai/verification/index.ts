/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

// Main orchestrator
export {
    verifyTranslation,
    quickVerify,
    verifyCompletenessWithAI,
    type VerificationResult,
    type VerificationConfig,
    type DocumentContext,
    type CompletenessVerificationResult,
} from './verify-translation';

// Untranslated content detection (kept for segment-level fixes)
export {
    detectUntranslatedContent,
    type UntranslatedResult,
    type UntranslatedSegment,
    type DetectionContext,
} from './detect-untranslated';

// Auto-fix for untranslated segments
export { fixUntranslatedSegments, type FixResult, type TranslationContext } from './fix-untranslated';
