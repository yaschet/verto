/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import {
    CheckCircleIcon,
    CircleNotchIcon,
    ClockIcon,
    ExclamationMarkIcon,
    FileTextIcon,
    SparkleIcon,
    TranslateIcon,
    XIcon,
    type IconProps,
} from '@phosphor-icons/react';
import Spinner from '@/src/components/ui/spinner';
import type { BadgeProps } from '@/src/components/ui/badge';
import type { ButtonProps } from '@/src/components/ui/button';
import type { TranslationStatus } from '@/src/schemas/translation-schemas';
import type { ReactNode } from 'react';

export const BUTTON_PROPS_MAPPING: Record<TranslationStatus | 'default', ButtonProps> = {
    default: {
        children: <FileTextIcon className="size-5" color="currentColor" weight="duotone" />,
        color: 'primary',
        shape: 'rounded',
        size: 'icon-lg',
        variant: 'soft',
    },
    queued: {
        children: <ClockIcon className="size-5 animate-pulse" color="currentColor" weight="duotone" />,
        color: 'warning',
        shape: 'rounded',
        size: 'icon-lg',
        variant: 'solid',
    },
    processing: {
        children: <Spinner className="text-info-50 dark:text-info-50 size-5" color="light" size="sm" />,
        color: 'info',
        shape: 'rounded',
        size: 'icon-lg',
        variant: 'solid',
    },
    translating: {
        children: (
            <TranslateIcon
                className="text-info-50 dark:text-info-50 size-5 animate-pulse"
                color="currentColor"
                weight="duotone"
            />
        ),
        color: 'info',
        shape: 'rounded',
        size: 'icon-lg',
        variant: 'solid',
    },
    polishing: {
        children: (
            <SparkleIcon
                className="text-info-50 dark:text-info-50 size-5 animate-pulse"
                color="currentColor"
                weight="duotone"
            />
        ),
        color: 'info',
        shape: 'rounded',
        size: 'icon-lg',
        variant: 'solid',
    },
    ready: {
        children: <FileTextIcon className="size-5" color="currentColor" weight="duotone" />,
        color: 'primary',
        shape: 'rounded',
        size: 'icon-lg',
        variant: 'solid',
    },
    generating: {
        children: <CircleNotchIcon className="size-5 animate-spin" color="currentColor" weight="bold" />,
        color: 'success',
        shape: 'rounded',
        size: 'icon-lg',
        variant: 'solid',
    },
    completed: {
        children: <CheckCircleIcon className="size-5" color="currentColor" weight="duotone" />,
        color: 'success',
        shape: 'rounded',
        size: 'icon-lg',
        variant: 'solid',
    },
    failed: {
        children: <ExclamationMarkIcon className="size-5" color="currentColor" weight="duotone" />,
        color: 'destructive',
        shape: 'rounded',
        size: 'icon-lg',
        variant: 'solid',
    },
    canceled: {
        children: <XIcon className="size-5" color="currentColor" weight="duotone" />,
        color: 'destructive',
        shape: 'rounded',
        size: 'icon-lg',
        variant: 'solid',
    },
    retrying: {
        children: <ClockIcon className="size-5 animate-pulse" color="currentColor" weight="duotone" />,
        color: 'warning',
        shape: 'rounded',
        size: 'icon-lg',
        variant: 'solid',
    },
};

/**
 * Status badge/label mapping for each translation status.
 * Includes colors, labels, animations, and user-friendly tooltips.
 */
export const STATUS_MAPPING: Record<
    TranslationStatus,
    {
        color: BadgeProps['color'];
        label: ReactNode;
        animate?: boolean;
        className?: string;
        tooltipContent: string;
        icon: React.ComponentType<IconProps> | typeof Spinner;
    }
> = {
    queued: {
        animate: true,
        className: 'text-warning',
        color: 'warning',
        icon: ClockIcon,
        label: 'Queued',
        tooltipContent: 'Your document is in the queue and will start processing shortly.',
    },
    processing: {
        animate: true,
        className: 'text-info',
        color: 'info',
        icon: Spinner,
        label: 'Processing',
        tooltipContent:
            'Preparing your document for translation. This includes downloading and image conversion.',
    },
    translating: {
        animate: true,
        className: 'text-info',
        color: 'info',
        icon: TranslateIcon,
        label: 'Translating',
        tooltipContent: 'Your document is being translated. Layout, tables, and formatting are preserved.',
    },
    polishing: {
        animate: true,
        className: 'text-info',
        color: 'info',
        icon: SparkleIcon,
        label: 'Polishing',
        tooltipContent: 'Final quality checks are in progress. Formatting is being perfected.',
    },
    ready: {
        className: 'text-primary',
        color: 'primary',
        icon: FileTextIcon,
        label: 'Ready',
        tooltipContent: 'Your translation is ready! Click to review, edit, and download.',
    },
    generating: {
        animate: true,
        className: 'text-success',
        color: 'success',
        icon: CircleNotchIcon,
        label: 'Generating',
        tooltipContent: 'Creating your final document. This will be available for download shortly.',
    },
    completed: {
        className: 'text-success',
        color: 'success',
        icon: CheckCircleIcon,
        label: 'Completed',
        tooltipContent: 'Your document is complete and ready for download.',
    },
    failed: {
        className: 'text-destructive',
        color: 'destructive',
        icon: ExclamationMarkIcon,
        label: 'Failed',
        tooltipContent: 'Something went wrong. You can retry the translation or contact support.',
    },
    canceled: {
        className: 'text-destructive',
        color: 'destructive',
        icon: XIcon,
        label: 'Canceled',
        tooltipContent: 'This translation was canceled. You can delete it or start a new one.',
    },
    retrying: {
        animate: true,
        className: 'text-warning',
        color: 'warning',
        icon: ClockIcon,
        label: 'Retrying',
        tooltipContent: 'Automatically retrying after a service issue. Please wait.',
    },
};
