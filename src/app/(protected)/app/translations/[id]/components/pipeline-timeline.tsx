/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import {
    CheckIcon,
    CircleIcon,
    FileDocIcon,
    GearIcon,
    HourglassIcon,
    MagicWandIcon,
    PlayIcon,
    SpinnerIcon,
    TranslateIcon,
    XIcon,
} from '@phosphor-icons/react';
import { differenceInSeconds, format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { useMemo } from 'react';
import { cn } from '@library/utils';
import { DefaultCard } from '@/components/ui/card';
import type { AIAuditData } from '@/types/ai-audit';

export type PipelineEntry = {
    timestamp: string;
    status: string;
    progress: number;
    dynamic_label: string | null;
    stage_message: string | null;
    statusChanged: boolean;
};

type PipelineTimelineProps = {
    entries: PipelineEntry[];
    aiAudit?: AIAuditData | null;
    startedAt: string | null;
    completedAt: string | null;
    currentStatus: string;
    progress: number;
};

type StageNodeData = {
    id: string;
    label: string;
    icon: typeof PlayIcon;
    status: 'completed' | 'active' | 'pending' | 'failed';
    timestamp?: string;
    duration?: string;
};

// State-based color system with smooth gradients (matching Status Card style)
// Colors communicate STATUS, not which stage it is
const STATE_COLORS = {
    pending: {
        // Subtle surface gradient
        bg: 'bg-gradient-to-b from-surface-100 via-surface-100 to-surface-200/80 dark:from-surface-800 dark:via-surface-800 dark:to-surface-700/80',
        icon: 'text-surface-400 dark:text-surface-500',
        label: 'text-surface-500',
    },
    active: {
        // Info gradient for processing states
        bg: 'bg-gradient-to-b from-info-100 via-info-100 to-info-200/80 dark:from-info-900 dark:via-info-900 dark:to-info-800/80',
        icon: 'text-info-600 dark:text-info-400',
        label: 'text-info-600 dark:text-info-400',
    },
    completed: {
        // Premium inverted style with gradient: black in light mode, white in dark mode
        bg: 'bg-gradient-to-b from-surface-900 via-surface-950 to-surface-950 dark:from-surface-100 dark:via-surface-50 dark:to-surface-50',
        icon: 'text-surface-100 dark:text-surface-900', // Inverted for contrast
        label: 'text-surface-900 dark:text-surface-100',
    },
    failed: {
        // Destructive gradient
        bg: 'bg-gradient-to-b from-destructive-100 via-destructive-100 to-destructive-200/80 dark:from-destructive-900 dark:via-destructive-900 dark:to-destructive-800/80',
        icon: 'text-destructive-600 dark:text-destructive-400',
        label: 'text-destructive-600 dark:text-destructive-400',
    },
} as const;

const PROCESSING_STATUSES = ['queued', 'processing', 'translating', 'polishing', 'retrying', 'generating'];
const SUCCESS_STATUSES = ['ready', 'completed'];
const FAILED_STATUSES = ['failed', 'canceled'];

function formatDuration(seconds: number): string {
    if (seconds < 1) return '<1s';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    if (remainingSeconds === 0) return `${minutes}m`;
    return `${minutes}m ${remainingSeconds}s`;
}

function buildStagesFromData(
    entries: PipelineEntry[],
    aiAudit: AIAuditData | null | undefined,
    currentStatus: string,
    startedAt: string | null,
    completedAt: string | null,
): StageNodeData[] {
    const stages: StageNodeData[] = [];
    const isFailed = FAILED_STATUSES.includes(currentStatus);
    const isComplete = SUCCESS_STATUSES.includes(currentStatus);

    // Determine completion status of each stage
    // Status flow: queued → processing → translating → polishing → generating → ready
    const startTime = aiAudit?.pipeline?.started_at || startedAt;
    const hasTranslation = aiAudit?.pipeline?.stages_completed?.includes('translation');
    const isTranslatingOrBeyond = ['translating', 'polishing', 'generating', 'ready', 'completed'].includes(
        currentStatus,
    );
    const hasProcessing =
        aiAudit?.pipeline?.stages_completed?.includes('processing') ||
        hasTranslation ||
        isTranslatingOrBeyond;
    const hasQA = aiAudit?.pipeline?.stages_completed?.includes('qa');
    const isPolishingOrBeyond = ['polishing', 'generating', 'ready', 'completed'].includes(currentStatus);
    const isGeneratingOrBeyond = ['generating', 'ready', 'completed'].includes(currentStatus);
    const translationComplete = hasTranslation || hasQA || isPolishingOrBeyond;
    const qaComplete = hasQA || isGeneratingOrBeyond;
    // Generation stage doesn't have AI audit data yet - determine from status
    const generationComplete = isComplete;

    // Determine the SINGLE failure point (only one stage can be failed)
    // Failure occurs at the stage that was in progress when the job failed
    let failedStageId: string | null = null;
    if (isFailed) {
        if (startTime && !hasProcessing) {
            failedStageId = 'processing'; // Failed during processing
        } else if (hasProcessing && !translationComplete) {
            failedStageId = 'translation'; // Failed during translation
        } else if (translationComplete && !qaComplete) {
            failedStageId = 'qa'; // Failed during QA/polish
        } else if (qaComplete && !generationComplete) {
            failedStageId = 'generation'; // Failed during document generation
        }
        // Note: If generationComplete is true, we reached ready/completed state - shouldn't be failed
    }

    // Helper to get stage status
    const getStageStatus = (
        stageId: string,
        isCompleted: boolean,
        isActive: boolean,
    ): 'completed' | 'active' | 'pending' | 'failed' => {
        if (isCompleted) return 'completed';
        if (isActive) return 'active';
        if (failedStageId === stageId) return 'failed';
        return 'pending';
    };

    // Stage 1: Started
    stages.push({
        id: 'start',
        label: 'Started',
        icon: PlayIcon,
        status: startTime ? 'completed' : 'pending',
        timestamp: startTime ? format(new Date(startTime), 'HH:mm') : undefined,
    });

    // Stage 2: Processing
    const processingMs = aiAudit?.processing?.processing_ms;
    stages.push({
        id: 'processing',
        label: 'Processing',
        icon: GearIcon,
        status: getStageStatus('processing', hasProcessing, currentStatus === 'processing'),
        duration: processingMs ? formatDuration(processingMs / 1000) : undefined,
    });

    // Stage 3: Translation
    const translationMs = aiAudit?.translation?.processing_ms;
    stages.push({
        id: 'translation',
        label: 'Translate',
        icon: TranslateIcon,
        status: getStageStatus('translation', translationComplete, currentStatus === 'translating'),
        duration: translationMs ? formatDuration(translationMs / 1000) : undefined,
    });

    // Stage 4: QA Polish
    const qaMs = aiAudit?.qa?.processing_ms;
    stages.push({
        id: 'qa',
        label: 'Polish',
        icon: MagicWandIcon,
        status: getStageStatus('qa', qaComplete, currentStatus === 'polishing'),
        duration: qaMs ? formatDuration(qaMs / 1000) : undefined,
    });

    // Stage 5: Generate Document (no AI audit data for this stage yet)
    stages.push({
        id: 'generation',
        label: 'Generate',
        icon: FileDocIcon,
        status: getStageStatus('generation', generationComplete, currentStatus === 'generating'),
    });

    // Stage 6: Ready (only shows completed or pending - failure happens before reaching ready)
    stages.push({
        id: 'ready',
        label: 'Ready',
        icon: HourglassIcon,
        status: isComplete ? 'completed' : 'pending',
    });

    // Stage 7: Completed (only shown when actually completed)
    if (completedAt && isComplete) {
        const totalDuration =
            startedAt && completedAt ? differenceInSeconds(new Date(completedAt), new Date(startedAt)) : null;
        stages.push({
            id: 'completed',
            label: 'Done',
            icon: CheckIcon,
            status: 'completed',
            timestamp: format(new Date(completedAt), 'HH:mm'),
            duration: totalDuration ? formatDuration(totalDuration) : undefined,
        });
    }

    return stages;
}

// Animated checkmark with path drawing
function AnimatedCheckmark({ className }: { className?: string }) {
    return (
        <motion.svg
            className={cn('size-3.5', className)}
            fill="none"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.5, duration: 0.4 }}
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
            viewBox="0 0 24 24"
        >
            <motion.path
                d="M4.5 12.75l6 6 9-13.5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
            />
        </motion.svg>
    );
}

// Individual stage node component with animations
function StageNode({ stage, index }: { stage: StageNodeData; index: number }) {
    // Use state-based colors (pending/active/completed/failed), not stage-specific colors
    const stateColors = STATE_COLORS[stage.status];
    const Icon = stage.icon;

    return (
        <motion.div
            className="relative z-10 flex items-center gap-3 sm:flex-col sm:items-center sm:gap-1"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
                delay: index * 0.08,
                duration: 0.3,
                ease: 'easeOut',
            }}
        >
            {/* Node with colored background and ring matching DefaultCard */}
            <motion.div
                className={cn(
                    'relative flex size-8 shrink-0 items-center justify-center rounded-full ring-4 ring-surface-50 dark:ring-surface-950 overflow-hidden',
                    stateColors.bg,
                )}
                animate={stage.status === 'active' ? { scale: [1, 1.05, 1] } : {}}
                transition={
                    stage.status === 'active' ? { repeat: Infinity, duration: 2, ease: 'easeInOut' } : {}
                }
            >
                {/* Premium shine gradient overlay for completed state */}
                {stage.status === 'completed' && (
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/10 to-transparent dark:from-black/10 dark:via-black/5 dark:to-transparent pointer-events-none" />
                )}

                <AnimatePresence mode="wait">
                    {stage.status === 'failed' ? (
                        <motion.div
                            key="failed"
                            initial={{ scale: 0, rotate: -90 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <XIcon className={cn('size-3.5', stateColors.icon)} weight="bold" />
                        </motion.div>
                    ) : stage.status === 'completed' ? (
                        <AnimatedCheckmark key="completed" className={stateColors.icon} />
                    ) : stage.status === 'active' ? (
                        <motion.div
                            key="active"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <SpinnerIcon
                                className={cn('size-3.5 animate-spin', stateColors.icon)}
                                weight="bold"
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="pending"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <Icon className={cn('size-3.5', stateColors.icon)} weight="duotone" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Label + duration/timestamp */}
            <motion.div
                className="flex flex-col sm:items-center"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 + 0.1, duration: 0.2 }}
            >
                <span className={cn('text-xs font-medium', stateColors.label)}>{stage.label}</span>
                {(stage.duration || stage.timestamp) && (
                    <span className="text-[10px] tabular-nums text-surface-400">
                        {stage.duration || stage.timestamp}
                    </span>
                )}
            </motion.div>
        </motion.div>
    );
}

export function PipelineTimeline({
    aiAudit,
    completedAt,
    currentStatus,
    entries,
    progress,
    startedAt,
}: PipelineTimelineProps) {
    const isProcessing = PROCESSING_STATUSES.includes(currentStatus);

    const stages = useMemo(
        () => buildStagesFromData(entries, aiAudit, currentStatus, startedAt, completedAt),
        [entries, aiAudit, currentStatus, startedAt, completedAt],
    );

    // Calculate progress percentage for the line
    // Line fills TO the active node, not beyond (no misleading half-steps)
    const completedStages = stages.filter((s) => s.status === 'completed').length;
    const activeStageIndex = stages.findIndex((s) => s.status === 'active');
    const progressStageIndex = activeStageIndex >= 0 ? activeStageIndex : completedStages;
    const progressPercent = Math.min(100, (progressStageIndex / (stages.length - 1)) * 100);

    // Calculate total duration
    const totalDuration =
        startedAt && completedAt ? differenceInSeconds(new Date(completedAt), new Date(startedAt)) : null;

    if (stages.length === 0) {
        return (
            <DefaultCard className="p-4">
                <p className="text-center text-sm text-surface-500">No processing history available</p>
            </DefaultCard>
        );
    }

    return (
        <DefaultCard className="p-4">
            {/* Responsive Timeline: vertical on mobile, horizontal on sm+ */}
            <div className="relative">
                {/* Background line - vertical on mobile, horizontal on sm+ */}
                <div className="absolute bottom-4 left-4 top-4 w-0.5 bg-surface-200 dark:bg-surface-700 sm:bottom-auto sm:left-4 sm:right-4 sm:top-4 sm:h-0.5 sm:w-auto" />

                {/* Animated progress line overlay - primary color, not success green */}
                <motion.div
                    className="absolute left-4 top-4 w-0.5 bg-primary-500 sm:h-0.5 sm:w-auto"
                    initial={{ height: 0 }}
                    animate={{
                        height: `calc(${progressPercent}% - 16px)`,
                    }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    style={
                        {
                            // Desktop: animate width instead of height
                            // This is handled via CSS media query override
                        }
                    }
                />
                {/* Desktop progress line (hidden on mobile) */}
                <motion.div
                    className="absolute left-4 top-4 hidden h-0.5 bg-primary-500 sm:block"
                    initial={{ width: 0 }}
                    animate={{
                        width: `calc(${progressPercent}% - 16px)`,
                    }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                />

                {/* Stage nodes container */}
                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-0">
                    {stages.map((stage, index) => (
                        <StageNode key={stage.id} stage={stage} index={index} />
                    ))}
                </div>
            </div>

            {/* Timeline Summary Footer */}
            <AnimatePresence>
                {(startedAt || totalDuration !== null || isProcessing) && (
                    <motion.div
                        className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.2 }}
                    >
                        {startedAt && (
                            <div className="flex items-center gap-1.5 text-surface-500">
                                <CircleIcon className="size-1.5 fill-current" weight="fill" />
                                <span>{format(new Date(startedAt), 'MMM d, HH:mm')}</span>
                            </div>
                        )}
                        {totalDuration !== null && (
                            <div className="flex items-center gap-1.5 font-medium text-surface-700 dark:text-surface-300">
                                <span>Total: {formatDuration(totalDuration)}</span>
                            </div>
                        )}
                        {isProcessing && (
                            <div className="flex items-center gap-1.5 text-primary-600 dark:text-primary-400">
                                <SpinnerIcon className="size-3 animate-spin" />
                                <span>{progress}% complete</span>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </DefaultCard>
    );
}
