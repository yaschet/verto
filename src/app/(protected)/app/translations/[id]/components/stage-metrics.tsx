/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import {
    CheckCircleIcon,
    CoinsIcon,
    MagicWandIcon,
    ShieldCheckIcon,
    TimerIcon,
    TranslateIcon,
    UsersIcon,
    WarningCircleIcon,
} from '@phosphor-icons/react';
import { DefaultCard } from '@/components/ui/card';
import type { AIAuditData } from '@/types/ai-audit';

type StageMetricsProps = {
    aiAudit: AIAuditData | null | undefined;
    verificationMetadata?: {
        passed?: boolean;
        complete?: boolean;
        confidence?: number;
        tokensUsed?: number;
        missing_content?: string[];
        table_verification?: {
            issues?: string[];
            tablesMatch?: boolean;
            outputTableCount?: number;
            sourceTableCount?: number;
        };
    } | null;
};

function formatDuration(ms: number): string {
    if (ms < 1000) return '<1s';
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (remainingSeconds === 0) return `${minutes}m`;
    return `${minutes}m ${remainingSeconds}s`;
}

function formatTokens(tokens: number): string {
    if (tokens < 1000) return tokens.toString();
    return `${(tokens / 1000).toFixed(1)}k`;
}

export function StageMetrics({ aiAudit, verificationMetadata }: StageMetricsProps) {
    if (!aiAudit?.pipeline) {
        return null;
    }

    const { pipeline, qa, translation } = aiAudit;

    return (
        <div className="space-y-4">
            {/* Stage Cards Grid - matches the 8-card grid pattern */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Translation Stage Card */}
                {translation && (
                    <DefaultCard className="flex flex-col gap-3 p-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-lg">
                                <TranslateIcon className="text-primary size-5" weight="duotone" />
                            </div>
                            <div>
                                <p className="text-surface-500 text-xs font-medium">Translation</p>
                                <p className="text-surface-900 dark:text-surface-100 text-sm font-semibold">
                                    {Math.round(translation.confidence * 100)}% Confidence
                                </p>
                            </div>
                        </div>
                        <div className="bg-surface-100 dark:bg-surface-800 h-px w-full" />
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-surface-500">Duration</span>
                            <span className="text-surface-900 dark:text-surface-100 font-medium">
                                {formatDuration(translation.processing_ms)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-surface-500">Tokens Used</span>
                            <span className="text-surface-900 dark:text-surface-100 font-medium">
                                {formatTokens(translation.tokens_total)}
                            </span>
                        </div>
                        {translation.entities_protected && translation.entities_protected.length > 0 && (
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-surface-500 flex items-center gap-1.5">
                                    <UsersIcon className="size-3.5" weight="duotone" />
                                    Entities Protected
                                </span>
                                <span className="text-surface-900 dark:text-surface-100 font-medium">
                                    {translation.entities_protected.length}
                                </span>
                            </div>
                        )}
                    </DefaultCard>
                )}

                {/* QA Polish Stage Card */}
                {qa && (
                    <DefaultCard className="flex flex-col gap-3 p-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-info/10 flex size-10 shrink-0 items-center justify-center rounded-lg">
                                <MagicWandIcon className="text-info size-5" weight="duotone" />
                            </div>
                            <div>
                                <p className="text-surface-500 text-xs font-medium">QA Polish</p>
                                <p className="text-surface-900 dark:text-surface-100 text-sm font-semibold">
                                    {Math.round(qa.confidence * 100)}% Confidence
                                </p>
                            </div>
                        </div>
                        <div className="bg-surface-100 dark:bg-surface-800 h-px w-full" />
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-surface-500">Duration</span>
                            <span className="text-surface-900 dark:text-surface-100 font-medium">
                                {formatDuration(qa.processing_ms)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-surface-500">Tokens Used</span>
                            <span className="text-surface-900 dark:text-surface-100 font-medium">
                                {formatTokens(qa.tokens_total)}
                            </span>
                        </div>
                        {qa.issues_fixed !== undefined && (
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-surface-500 flex items-center gap-1.5">
                                    <CheckCircleIcon className="text-success-500 size-3.5" weight="duotone" />
                                    Issues Fixed
                                </span>
                                <span className="text-surface-900 dark:text-surface-100 font-medium">
                                    {qa.issues_fixed}
                                </span>
                            </div>
                        )}
                    </DefaultCard>
                )}

                {/* Verification Stage Card */}
                {verificationMetadata && (
                    <DefaultCard className="flex flex-col gap-3 p-4">
                        <div className="flex items-center gap-3">
                            <div
                                className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
                                    verificationMetadata.passed ? 'bg-success/10' : 'bg-warning/10'
                                }`}
                            >
                                <ShieldCheckIcon
                                    className={`size-5 ${
                                        verificationMetadata.passed ? 'text-success' : 'text-warning'
                                    }`}
                                    weight="duotone"
                                />
                            </div>
                            <div>
                                <p className="text-surface-500 text-xs font-medium">Verification</p>
                                <p className="text-surface-900 dark:text-surface-100 text-sm font-semibold">
                                    {verificationMetadata.passed ? 'Passed' : 'Needs Review'}
                                </p>
                            </div>
                        </div>
                        <div className="bg-surface-100 dark:bg-surface-800 h-px w-full" />
                        {verificationMetadata.confidence !== undefined && (
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-surface-500">Confidence</span>
                                <span className="text-surface-900 dark:text-surface-100 font-medium">
                                    {Math.round(verificationMetadata.confidence * 100)}%
                                </span>
                            </div>
                        )}
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-surface-500">Status</span>
                            <span className="text-surface-900 dark:text-surface-100 font-medium">
                                {verificationMetadata.complete ? 'Complete' : 'Partial'}
                            </span>
                        </div>
                        {verificationMetadata.tokensUsed !== undefined && (
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-surface-500">Tokens Used</span>
                                <span className="text-surface-900 dark:text-surface-100 font-medium">
                                    {formatTokens(verificationMetadata.tokensUsed)}
                                </span>
                            </div>
                        )}
                    </DefaultCard>
                )}
            </div>

            {/* Verification Issues Alert - Full width below grid */}
            {verificationMetadata &&
                !verificationMetadata.passed &&
                ((verificationMetadata.table_verification?.issues?.length ?? 0) > 0 ||
                    (verificationMetadata.missing_content?.length ?? 0) > 0) && (
                    <DefaultCard className="flex flex-col gap-5 p-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-warning/10 flex size-9 shrink-0 items-center justify-center rounded-lg">
                                <WarningCircleIcon
                                    className="text-warning-600 dark:text-warning-500 size-5"
                                    weight="duotone"
                                />
                            </div>
                            <div>
                                <h4 className="text-surface-900 dark:text-surface-100 text-base font-semibold">
                                    Review Verification
                                </h4>
                                <p className="text-surface-500 text-sm">
                                    Potential issues detected during AI verification.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6 pt-1">
                            {/* Table Issues */}
                            {(verificationMetadata.table_verification?.issues?.length ?? 0) > 0 && (
                                <div className="space-y-3">
                                    <h5 className="text-surface-900 dark:text-surface-100 flex items-center gap-2 text-sm font-medium">
                                        <span>Table Accuracy</span>
                                        <span className="bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 rounded-full px-2 py-0.5 text-[10px] font-semibold">
                                            {verificationMetadata.table_verification!.issues!.length}
                                        </span>
                                    </h5>
                                    <ul className="space-y-3 pl-1">
                                        {verificationMetadata.table_verification!.issues!.map((issue, i) => (
                                            <li key={i} className="group flex items-start gap-3 text-sm">
                                                <div className="bg-warning-500 mt-1.5 size-1.5 shrink-0 rounded-full transition-transform group-hover:scale-125" />
                                                <span className="text-surface-600 dark:text-surface-400 leading-relaxed">
                                                    {issue}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Missing Content */}
                            {(verificationMetadata.missing_content?.length ?? 0) > 0 && (
                                <div className="space-y-3">
                                    <h5 className="text-surface-900 dark:text-surface-100 flex items-center gap-2 text-sm font-medium">
                                        <span>Missing Content</span>
                                        <span className="bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 rounded-full px-2 py-0.5 text-[10px] font-semibold">
                                            {verificationMetadata.missing_content!.length}
                                        </span>
                                    </h5>
                                    <ul className="space-y-3 pl-1">
                                        {verificationMetadata.missing_content!.map((item, i) => (
                                            <li key={i} className="group flex items-start gap-3 text-sm">
                                                <div className="bg-destructive-500 mt-1.5 size-1.5 shrink-0 rounded-full transition-transform group-hover:scale-125" />
                                                <span className="text-surface-600 dark:text-surface-400 leading-relaxed">
                                                    {item}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </DefaultCard>
                )}

            {/* Summary Footer */}
            <DefaultCard className="flex flex-wrap items-center justify-between gap-4 p-4">
                <span className="text-surface-600 dark:text-surface-400 text-sm font-medium">
                    Total Processing
                </span>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <TimerIcon className="text-surface-400 size-4" />
                        <span className="text-surface-900 dark:text-surface-100 text-sm font-semibold">
                            {formatDuration(pipeline.total_processing_ms)}
                        </span>
                    </div>
                    <span className="text-surface-300 dark:text-surface-600">•</span>
                    <div className="flex items-center gap-1.5">
                        <CoinsIcon className="text-surface-400 size-4" />
                        <span className="text-surface-900 dark:text-surface-100 text-sm font-semibold">
                            {formatTokens(pipeline.total_tokens)} tokens
                        </span>
                    </div>
                    <span className="text-surface-300 dark:text-surface-600">•</span>
                    <div className="flex items-center gap-1.5">
                        <CheckCircleIcon className="text-success-500 size-4" />
                        <span className="text-surface-900 dark:text-surface-100 text-sm font-semibold">
                            {pipeline.stages_completed?.length || 0} stages
                        </span>
                    </div>
                </div>
            </DefaultCard>
        </div>
    );
}
