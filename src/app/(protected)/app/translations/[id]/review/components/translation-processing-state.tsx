/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import {
    ArrowLeftIcon,
    ArrowRightIcon,
    ClockIcon,
    FileDocIcon,
    GearIcon,
    GlobeIcon,
    HourglassIcon,
    MagicWandIcon,
    PlayIcon,
    SparkleIcon,
    SpinnerIcon as SpinnerIcon,
    TranslateIcon,
    CircleNotchIcon,
} from '@phosphor-icons/react';
import * as countriesFlag from 'country-flag-icons/react/1x1';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@components/ui/button';
import { DefaultCard } from '@components/ui/card';
import { cn } from '@library/utils';
import {
    AUTO_DETECT_LANGUAGE,
    AVAILABLE_SOURCE_LANGUAGES_WITH_AUTO,
    AVAILABLE_TARGET_LANGUAGES,
} from '@/src/constants/translations';
import { STATUS_MAPPING } from '@/app/(protected)/app/translations/table/constants/mappings';
import type { TranslationRow, TranslationStatus } from '@schemas/translation-schemas';

// Timeline state colors (same as PipelineTimeline)
const STATE_COLORS = {
    pending: {
        bg: 'bg-gradient-to-b from-surface-100 via-surface-100 to-surface-200/80 dark:from-surface-800 dark:via-surface-800 dark:to-surface-700/80',
        icon: 'text-surface-400 dark:text-surface-500',
        label: 'text-surface-500',
    },
    active: {
        bg: 'bg-gradient-to-b from-info-100 via-info-100 to-info-200/80 dark:from-info-900 dark:via-info-900 dark:to-info-800/80',
        icon: 'text-info-600 dark:text-info-400',
        label: 'text-info-600 dark:text-info-400',
    },
    completed: {
        bg: 'bg-gradient-to-b from-surface-900 via-surface-950 to-surface-950 dark:from-surface-100 dark:via-surface-50 dark:to-surface-50',
        icon: 'text-surface-100 dark:text-surface-900',
        label: 'text-surface-900 dark:text-surface-100',
    },
} as const;

const PIPELINE_STAGES = [
    { id: 'start', label: 'Start', icon: PlayIcon, status: 'queued' as const },
    { id: 'processing', label: 'Process', icon: GearIcon, status: 'processing' as const },
    { id: 'translating', label: 'Translate', icon: TranslateIcon, status: 'translating' as const },
    { id: 'polishing', label: 'Polish', icon: MagicWandIcon, status: 'polishing' as const },
    { id: 'generating', label: 'Generate', icon: FileDocIcon, status: 'generating' as const },
    { id: 'ready', label: 'Ready', icon: HourglassIcon, status: 'ready' as const },
];

const STATUS_ORDER: Record<string, number> = {
    queued: 0,
    processing: 1,
    translating: 2,
    polishing: 3,
    generating: 4,
    ready: 5,
    completed: 6,
};

// Language helper (same as Details page)
const getLanguageDetails = (code: string | null | undefined, isSource: boolean = false) => {
    if (!code || code === AUTO_DETECT_LANGUAGE) {
        return {
            name: 'Auto-detect',
            isAuto: true,
            countryCode: null,
        };
    }

    const countryCodeMapping: Record<string, string> = {
        en: 'US',
        fr: 'FR',
        es: 'ES',
        de: 'DE',
        it: 'IT',
        pt: 'PT',
        ru: 'RU',
        zh: 'CN',
        ja: 'JP',
        ko: 'KR',
        ar: 'SA',
        hi: 'IN',
        nl: 'NL',
        pl: 'PL',
        tr: 'TR',
        vi: 'VN',
        th: 'TH',
        id: 'ID',
        sv: 'SE',
        da: 'DK',
        fi: 'FI',
        no: 'NO',
        cs: 'CZ',
        el: 'GR',
        he: 'IL',
        ro: 'RO',
        hu: 'HU',
        sk: 'SK',
        uk: 'UA',
        bg: 'BG',
        hr: 'HR',
        lt: 'LT',
        lv: 'LV',
        et: 'EE',
        sl: 'SI',
        sr: 'RS',
        fa: 'IR',
        ur: 'PK',
        ms: 'MY',
        tl: 'PH',
        sw: 'KE',
    };

    const list = isSource ? AVAILABLE_SOURCE_LANGUAGES_WITH_AUTO : AVAILABLE_TARGET_LANGUAGES;
    const lang = list.find(
        (l) => l.ids?.ISO_639_1 === code || (l.ids as { bcp_47_code?: string })?.bcp_47_code === code,
    );
    const countryCode = countryCodeMapping[code.toLowerCase()] || code.toUpperCase();

    return {
        name: lang?.name || code,
        isAuto: false,
        countryCode,
    };
};

type TranslationProcessingStateProps = {
    translation: TranslationRow;
    status: TranslationStatus;
    progress: number | null;
};

// Animated checkmark
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

// Stage node component
function StageNode({
    stage,
    index,
    currentStatus,
}: {
    stage: (typeof PIPELINE_STAGES)[0];
    index: number;
    currentStatus: TranslationStatus;
}) {
    const currentOrder = STATUS_ORDER[currentStatus] ?? -1;
    const stageOrder = STATUS_ORDER[stage.status] ?? -1;

    const nodeStatus: 'completed' | 'active' | 'pending' =
        stageOrder < currentOrder ? 'completed' : stageOrder === currentOrder ? 'active' : 'pending';

    const stateColors = STATE_COLORS[nodeStatus];
    const Icon = stage.icon;

    return (
        <motion.div
            className="relative z-10 flex flex-col items-center gap-1"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.08, duration: 0.3, ease: 'easeOut' }}
        >
            <motion.div
                className={cn(
                    'relative flex size-8 shrink-0 items-center justify-center rounded-full ring-4 ring-surface-50 dark:ring-surface-950 overflow-hidden',
                    stateColors.bg,
                )}
                animate={nodeStatus === 'active' ? { scale: [1, 1.05, 1] } : {}}
                transition={
                    nodeStatus === 'active' ? { repeat: Infinity, duration: 2, ease: 'easeInOut' } : {}
                }
            >
                {nodeStatus === 'completed' && (
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/10 to-transparent dark:from-black/10 dark:via-black/5 dark:to-transparent pointer-events-none" />
                )}

                <AnimatePresence mode="wait">
                    {nodeStatus === 'completed' ? (
                        <AnimatedCheckmark key="completed" className={stateColors.icon} />
                    ) : nodeStatus === 'active' ? (
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

            <motion.span
                className={cn('text-xs font-medium', stateColors.label)}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 + 0.1, duration: 0.2 }}
            >
                {stage.label}
            </motion.span>
        </motion.div>
    );
}

// Status-specific hero icon and color configuration
const HERO_CONFIG: Record<
    string,
    {
        icon: React.ComponentType<{
            className?: string;
            weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
        }>;
        bgClass: string;
        iconClass: string;
        animation: 'spin' | 'pulse' | 'none';
    }
> = {
    queued: {
        icon: ClockIcon,
        bgClass: 'bg-warning-100 dark:bg-warning-900/30',
        iconClass: 'text-warning-600 dark:text-warning-400',
        animation: 'pulse',
    },
    processing: {
        icon: SpinnerIcon,
        bgClass: 'bg-info-100 dark:bg-info-900/30',
        iconClass: 'text-info-600 dark:text-info-400',
        animation: 'spin',
    },
    translating: {
        icon: TranslateIcon,
        bgClass: 'bg-info-100 dark:bg-info-900/30',
        iconClass: 'text-info-600 dark:text-info-400',
        animation: 'pulse',
    },
    polishing: {
        icon: SparkleIcon,
        bgClass: 'bg-info-100 dark:bg-info-900/30',
        iconClass: 'text-info-600 dark:text-info-400',
        animation: 'pulse',
    },
    generating: {
        icon: CircleNotchIcon,
        bgClass: 'bg-success-100 dark:bg-success-900/30',
        iconClass: 'text-success-600 dark:text-success-400',
        animation: 'spin',
    },
    retrying: {
        icon: ClockIcon,
        bgClass: 'bg-warning-100 dark:bg-warning-900/30',
        iconClass: 'text-warning-600 dark:text-warning-400',
        animation: 'pulse',
    },
};

export function TranslationProcessingState({
    translation,
    status,
    progress,
}: TranslationProcessingStateProps) {
    const statusDetails = STATUS_MAPPING[status] || STATUS_MAPPING.queued;
    const displayName = translation.display_name || 'Untitled Document';

    // Language details with flags
    const sourceLang = getLanguageDetails(translation.source_language, true);
    const targetLang = getLanguageDetails(translation.target_language, false);
    const SourceFlag = sourceLang.countryCode
        ? countriesFlag[sourceLang.countryCode as keyof typeof countriesFlag]
        : null;
    const TargetFlag = targetLang.countryCode
        ? countriesFlag[targetLang.countryCode as keyof typeof countriesFlag]
        : null;

    // Calculate progress percentage for timeline
    const currentOrder = STATUS_ORDER[status] ?? 0;
    const progressPercent = Math.min(100, (currentOrder / (PIPELINE_STAGES.length - 1)) * 100);

    // Status-specific hero configuration
    const heroConfig = HERO_CONFIG[status] || HERO_CONFIG.processing;
    const HeroIcon = heroConfig.icon;
    const animationClass =
        heroConfig.animation === 'spin'
            ? 'animate-spin'
            : heroConfig.animation === 'pulse'
              ? 'animate-pulse'
              : '';

    return (
        <main className="relative flex min-h-[calc(100vh-3.8125rem)] w-full flex-col">
            {/* Header - matches Error state */}
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
                <Link href={`/app/translations/${translation.id}`}>
                    <Button className="gap-2" color="secondary" variant="soft">
                        <ArrowLeftIcon className="size-4" />
                        Back
                    </Button>
                </Link>
            </div>

            {/* Main Content - centered with max-width matching Error state */}
            <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
                <div className="flex w-full max-w-xl flex-col items-center gap-6">
                    {/* Hero Section */}
                    <div className="flex flex-col items-center text-center">
                        {/* Status-specific animated icon */}
                        <div
                            className={cn(
                                'mb-6 flex size-16 items-center justify-center rounded-full',
                                heroConfig.bgClass,
                            )}
                        >
                            <HeroIcon
                                className={cn('size-8', heroConfig.iconClass, animationClass)}
                                weight="duotone"
                            />
                        </div>

                        {/* Headline */}
                        <h1 className="text-surface-900 dark:text-surface-100 text-2xl font-bold tracking-tight sm:text-3xl">
                            {statusDetails.label}
                        </h1>

                        {/* Description */}
                        <p className="text-surface-500 mt-2 max-w-md text-base">
                            {statusDetails.tooltipContent}
                        </p>

                        {/* Document name */}
                        <p className="text-surface-400 mt-3 text-sm break-all max-w-full">{displayName}</p>
                    </div>

                    {/* Language Pair Card */}
                    <DefaultCard className="w-full p-4">
                        <span className="text-surface-500 text-xs font-medium uppercase tracking-wider mb-3 block">
                            Language Pair
                        </span>
                        <div className="flex items-center justify-center gap-3">
                            {/* Source Language */}
                            <div className="flex items-center gap-2">
                                <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-100 dark:bg-surface-800">
                                    {sourceLang.isAuto ? (
                                        <GlobeIcon className="size-4 text-surface-500" weight="duotone" />
                                    ) : SourceFlag ? (
                                        <SourceFlag className="size-5 rounded" />
                                    ) : (
                                        <GlobeIcon className="size-4 text-surface-500" weight="duotone" />
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-medium text-surface-400 uppercase">
                                        From
                                    </span>
                                    <span className="text-sm font-semibold text-surface-900 dark:text-surface-100">
                                        {sourceLang.name}
                                    </span>
                                </div>
                            </div>

                            {/* Arrow */}
                            <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800">
                                <ArrowRightIcon className="size-3 text-surface-400" />
                            </div>

                            {/* Target Language */}
                            <div className="flex items-center gap-2">
                                <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-100 dark:bg-surface-800">
                                    {TargetFlag ? (
                                        <TargetFlag className="size-5 rounded" />
                                    ) : (
                                        <TranslateIcon className="size-4 text-surface-500" weight="duotone" />
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-medium text-surface-400 uppercase">
                                        To
                                    </span>
                                    <span className="text-sm font-semibold text-surface-900 dark:text-surface-100">
                                        {targetLang.name}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </DefaultCard>

                    {/* Pipeline Timeline */}
                    <DefaultCard className="w-full p-4">
                        <div className="relative">
                            {/* Background line */}
                            <div className="absolute left-4 right-4 top-4 h-0.5 bg-surface-200 dark:bg-surface-700" />

                            {/* Progress line */}
                            <motion.div
                                className="absolute left-4 top-4 h-0.5 bg-surface-900 dark:bg-surface-100"
                                initial={{ width: 0 }}
                                animate={{ width: `calc(${progressPercent}% - 16px)` }}
                                transition={{ duration: 0.5, ease: 'easeOut' }}
                            />

                            {/* Stage nodes */}
                            <div className="relative flex items-start justify-between">
                                {PIPELINE_STAGES.map((stage, index) => (
                                    <StageNode
                                        key={stage.id}
                                        stage={stage}
                                        index={index}
                                        currentStatus={status}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Progress indicator */}
                        <div className="mt-4 flex items-center justify-center gap-2 border-t border-border pt-3">
                            <span className="text-surface-500 text-sm">{progress ?? 0}% complete</span>
                        </div>
                    </DefaultCard>
                </div>
            </div>
        </main>
    );
}
