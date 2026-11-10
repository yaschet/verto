/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import type { TranslationDetails } from '@/types/database/database.extended';
import {
    ArrowsCounterClockwiseIcon,
    CircleIcon,
    CoinsIcon,
    DotsThreeIcon,
    DownloadSimpleIcon,
    EyeIcon,
    FileDocIcon,
    GlobeIcon,
    HourglassIcon,
    PencilSimpleIcon,
    QuestionIcon,
    SealCheckIcon,
    TrashIcon,
    TranslateIcon,
    UserCirclePlusIcon,
    UserSwitchIcon,
    XIcon,
} from '@phosphor-icons/react';
import * as countriesFlag from 'country-flag-icons/react/1x1';
import { useMutation } from '@tanstack/react-query';
import { capitalCase } from 'change-case';
import { getLanguageDetails } from '@constants/translations';
import { calculateCreditsRequired } from '@constants/credits';
import { formatDistanceToNow, formatRelative, intervalToDuration } from 'date-fns';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { env } from '@/env';
import {
    BUTTON_PROPS_MAPPING,
    STATUS_MAPPING,
} from '@/src/app/(protected)/app/translations/table/constants/mappings';
import { Badge } from '@/src/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/src/components/ui/tooltip';
import { cn, generateGravatarUrl } from '@/src/library/utils';
import {
    TRANSLATION_COMPLETED_STATUSES,
    TRANSLATION_FAILED_STATUSES,
    TRANSLATION_PROCESSING_STATUSES,
    TRANSLATION_QUEUED_STATUSES,
    TRANSLATION_READY_STATUSES,
} from '@/src/schemas/translation-schemas';
import { getSignedUrl } from '@actions/storage/get-signed-url';
import { Avatar, AvatarFallback, AvatarImage } from '@components/ui/avatar';
import { Button } from '@components/ui/button';
import { Checkbox } from '@components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@components/ui/dropdown-menu';
import { Skeleton } from '@components/ui/skeleton';
import { isApiError, standardizeError } from '@errors/api-errors';
import type { TranslationRow, TranslationStatus } from '@/src/schemas/translation-schemas';
import type { AIAuditData } from '@/src/types/ai-audit';
import type { TranslationsTableMetaType } from '@/types/core/tanstack';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';
import type { ExportStatus } from '@components/exports/export-dropdown';
import type { UploadedDocumentUrls } from '@utils/gcp/docx/functions/generate-google-doc-and-exports';
import type { CheckboxProps } from '@components/ui/checkbox';
import type { Icon } from '@phosphor-icons/react';
import type { CellContext } from '@tanstack/react-table';
import type { ReactNode } from 'react';
import { ExportDropdown } from '@components/exports/export-dropdown';

export function SelectCell({ row }: CellContext<TranslationRow, unknown>) {
    const originalStatus: TranslationStatus = row.original.status ?? 'queued';
    let checkboxColor: CheckboxProps['color'] = 'default';

    if (TRANSLATION_QUEUED_STATUSES.includes(originalStatus)) {
        checkboxColor = 'warning' as CheckboxProps['color'];
    } else if (TRANSLATION_PROCESSING_STATUSES.includes(originalStatus)) {
        checkboxColor = 'info' as CheckboxProps['color'];
    } else if (TRANSLATION_FAILED_STATUSES.includes(originalStatus)) {
        checkboxColor = 'destructive' as CheckboxProps['color'];
    } else if (TRANSLATION_READY_STATUSES.includes(originalStatus)) {
        checkboxColor = 'default' as CheckboxProps['color'];
    }

    return (
        <Checkbox
            aria-label="Select Translation"
            aria-readonly={row.getIsSelected() && !row.getCanSelect()}
            checked={row.getIsSelected()}
            color={checkboxColor}
            isDisabled={!row.getCanSelect()}
            isSelected={row.getIsSelected()}
            required={false}
            onValueChange={(value) => row.toggleSelected(!!value)}
        />
    );
}
export function DisplayNameCell({ row }: CellContext<TranslationRow, unknown>) {
    const displayName: string = row.original.display_name ?? 'Document';
    const documentDescription: string = row.original.description ?? row.original.id ?? '';
    const documentTemplateName: string | null | undefined = row.original.template_name;
    const originalStatus: TranslationStatus = row.original.status ?? 'queued';

    const { children, ...chosenButtonProps } =
        BUTTON_PROPS_MAPPING[originalStatus] || BUTTON_PROPS_MAPPING.default;

    return (
        <div className="flex h-full w-auto items-center gap-2">
            <Link href={`/app/translations/${row.original.id}`}>
                <Button {...chosenButtonProps}>{children}</Button>
            </Link>
            <div className="flex w-auto flex-col items-start justify-center gap-1">
                <span className="text-foreground text-sm font-bold whitespace-nowrap">{displayName}</span>
                <span className="text-surface-400 text-xs font-medium whitespace-nowrap">
                    {documentTemplateName ?? documentDescription}
                </span>
            </div>
        </div>
    );
}
export function StatusCell({ row }: CellContext<TranslationRow, unknown>) {
    const originalStatus: TranslationStatus = row.original.status ?? 'queued';
    const statusDetails = STATUS_MAPPING[originalStatus];
    const isFinalStatus = TRANSLATION_COMPLETED_STATUSES.includes(originalStatus);
    const [isDurationReady, setIsDurationReady] = useState<boolean>(false);

    const [elapsedTime, setElapsedTime] = useState<number>(0);
    const [timeAgo, setTimeAgo] = useState<string | null>(null);

    // Extract dynamic label from details (only for translating/polishing phases)
    const details = row.original.details as { dynamic_label?: string; stage_message?: string } | null;
    const isDynamicPhase = originalStatus === 'translating' || originalStatus === 'polishing';
    const dynamicLabel = isDynamicPhase ? details?.dynamic_label : undefined;
    const stageMessage = isDynamicPhase ? details?.stage_message : undefined;

    // Use dynamic label if available, otherwise fall back to status mapping
    const StatusText: ReactNode = dynamicLabel || statusDetails.label;
    // Use stage_message for tooltip if available, otherwise fall back to default
    const tooltipText = stageMessage || statusDetails.tooltipContent;

    useEffect(() => {
        const startedAt = new Date(row.original?.started_at ?? new Date().getTime()).getTime();
        const completedAt = row.original.completed_at ? new Date(row.original.completed_at).getTime() : null;

        if (completedAt) {
            const duration = Math.floor((completedAt - startedAt) / 1000);
            setElapsedTime(duration);

            // Calculate "time ago" for completed tasks using date-fns
            setTimeAgo(formatDistanceToNow(new Date(completedAt), { addSuffix: true }));
            setIsDurationReady(true);
        } else if (originalStatus !== 'queued') {
            const now = Date.now();
            const initialElapsedTime = Math.floor((now - startedAt) / 1000);
            setIsDurationReady(true);

            const intervalId = setInterval(() => {
                setElapsedTime((prevElapsedTime) => prevElapsedTime + 1);
            }, 1000);

            setElapsedTime(initialElapsedTime);
            return () => clearInterval(intervalId);
        }
    }, [row.original.started_at, row.original.completed_at, originalStatus]);

    // Custom function to format elapsed time in a minimal way
    const formatElapsedTime = (duration: number): string => {
        const durationObj = intervalToDuration({
            end: duration * 1000,
            start: 0,
        });
        const parts: string[] = [];

        if (durationObj.hours || durationObj.hours === 0) {
            parts.push(`${durationObj.hours ?? 0}h`);
        }

        if (durationObj.minutes || durationObj.minutes === 0) {
            parts.push(`${durationObj.minutes ?? 0}m`);
        }

        if (durationObj.seconds || durationObj.seconds === 0 || parts.length === 0) {
            parts.push(`${durationObj.seconds ?? 0}s`);
        }

        return parts.join(' ');
    };

    return (
        <div className="flex w-full flex-col items-start gap-1">
            <div className="flex w-full items-center gap-1">
                <TooltipProvider>
                    <CircleIcon
                        className={cn(
                            'size-3',
                            statusDetails.className,
                            statusDetails.animate && 'animate-pulse',
                        )}
                        color="currentColor"
                        weight="fill"
                    />
                    <span className="text-foreground w-auto text-xs font-semibold">{StatusText}</span>
                    <span className="text-foreground w-auto text-xs">
                        <Tooltip delayDuration={0} disableHoverableContent={false}>
                            <TooltipTrigger asChild>
                                <QuestionIcon
                                    aria-label={tooltipText}
                                    className="text-muted size-3"
                                    color="currentColor"
                                    weight="duotone"
                                />
                            </TooltipTrigger>
                            <TooltipContent
                                className="max-w-48 p-3 text-xs break-words"
                                security="none"
                                side="top"
                                sideOffset={5}
                            >
                                <span>
                                    <span className="text-foreground">{StatusText}</span>
                                    {tooltipText && ' — '}
                                    <i
                                        className={cn(
                                            'text-surface-700 dark:text-surface-300',
                                            tooltipText ? 'font-normal' : 'font-semibold',
                                        )}
                                    >
                                        {tooltipText}
                                    </i>
                                </span>
                            </TooltipContent>
                        </Tooltip>
                    </span>
                </TooltipProvider>
            </div>
            {isDurationReady ? (
                <p className="text-surface-400 w-full text-xs text-nowrap">
                    <span>{formatElapsedTime(elapsedTime)}</span>
                    {isFinalStatus && timeAgo && <span> ({timeAgo})</span>}
                </p>
            ) : (
                <Skeleton className="mt-1 h-2 w-20" />
            )}
        </div>
    );
}

export function ProgressCell({ row }: CellContext<TranslationRow, unknown>) {
    const progress = row.original.progress ?? 0;
    const status = row.original.status ?? 'queued';

    // Don't show progress for completed states
    if (TRANSLATION_COMPLETED_STATUSES.includes(status)) {
        return <span className="text-surface-600 dark:text-surface-400 text-xs">Complete</span>;
    }

    // Don't show progress for failed/canceled states
    if (TRANSLATION_FAILED_STATUSES.includes(status)) {
        return <span className="text-destructive-600 dark:text-destructive-400 text-xs">—</span>;
    }

    return (
        <div className="flex items-center gap-2">
            <div className="bg-surface-200 dark:bg-surface-800 h-2 w-24 overflow-hidden rounded-full">
                <div
                    className="bg-primary-500 dark:bg-primary-400 h-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                />
            </div>
            <span className="text-surface-600 dark:text-surface-400 text-xs font-medium">{progress}%</span>
        </div>
    );
}

export function CustomerCell({ row, table }: CellContext<TranslationRow, unknown>) {
    // ? Customer Name is a string, but it can be null.
    let customerName: string = row.original.customer_name ?? '';

    // Customer Name will be Capitalized.
    customerName = capitalCase(customerName);

    // Customer Email is a string, but it can be null.
    const customerEmail: string = row.original.customer_email ?? '';

    // ? Customer ID is a string, but it can be null.
    const customerId: string = row.original.id ?? '';

    // ? Customer Avatar is a string, but it can be null.
    const customerAvatar: string = generateGravatarUrl(customerEmail);

    const hasCustomer: boolean = !!customerName && !!customerEmail && !!customerId;

    return (
        <div className="flex h-full w-full items-center gap-2">
            {hasCustomer && (
                <div className="flex h-full w-full items-center justify-between gap-2">
                    <div className="flex h-full w-full flex-1 items-center gap-2">
                        <div className="flex h-auto w-auto items-center justify-center">
                            <Button
                                asChild
                                className="cursor-pointer overflow-hidden p-0"
                                color="secondary"
                                variant="plain"
                            >
                                <Avatar className="aspect-square h-auto w-10">
                                    <AvatarImage alt={customerName} src={customerAvatar} />
                                    <AvatarFallback name={customerName} />
                                </Avatar>
                            </Button>
                        </div>
                        <div className="flex w-full flex-1 flex-col items-start justify-start gap-1">
                            <span className="text-foreground text-sm font-bold whitespace-nowrap">
                                {customerName}
                            </span>
                            <span className="text-surface-400 text-xs font-medium whitespace-nowrap">
                                {customerEmail}
                            </span>
                        </div>
                    </div>
                    <Button
                        className="flex h-full w-auto items-center justify-center gap-2"
                        color="secondary"
                        size="icon-md"
                        tooltipContent="Reassign/Unassign Customer"
                        variant="soft"
                        onClick={() => {
                            const meta = table?.options?.meta as TranslationsTableMetaType;

                            meta?.triggerAssignmentToCustomer?.(row.original);
                        }}
                    >
                        <UserSwitchIcon className="text-muted size-5" color="currentColor" weight="duotone" />
                    </Button>
                </div>
            )}
            {!hasCustomer && (
                <div className="flex h-full w-auto items-center gap-2">
                    <Button
                        color="secondary"
                        size="md"
                        variant="plain"
                        onClick={() => {
                            const meta = table?.options?.meta as TranslationsTableMetaType;

                            meta?.triggerAssignmentToCustomer?.(row.original);
                        }}
                    >
                        <UserCirclePlusIcon className="size-5" color="currentColor" weight="duotone" />
                        Assign to Customer
                    </Button>
                </div>
            )}
        </div>
    );
}

// Define props for the component
type LanguageDisplayProps = {
    code: string;
    isSource?: boolean;
};

function LanguageDisplay({ code, isSource = false }: LanguageDisplayProps) {
    const langDetails = getLanguageDetails(code, isSource);
    const FlagComponent = langDetails.countryCode
        ? countriesFlag[langDetails.countryCode as keyof typeof countriesFlag]
        : null;

    return (
        <div className="flex items-center gap-2">
            <div className="bg-surface-100 dark:bg-surface-800 flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-md">
                {langDetails.isAuto ? (
                    <GlobeIcon className="text-surface-500 size-4" weight="duotone" />
                ) : FlagComponent ? (
                    <FlagComponent className="size-4 rounded-sm" />
                ) : isSource ? (
                    <GlobeIcon className="text-surface-500 size-4" weight="duotone" />
                ) : (
                    <TranslateIcon className="text-surface-500 size-4" weight="duotone" />
                )}
            </div>
            <span className="text-surface-700 dark:text-surface-300 text-sm font-medium whitespace-nowrap">
                {langDetails.name}
            </span>
        </div>
    );
}

export function SourceLanguageCell({ row }: CellContext<TranslationRow, unknown>) {
    return <LanguageDisplay code={row.original.source_language ?? 'unknown'} isSource />;
}

export function TargetLanguageCell({ row }: CellContext<TranslationRow, unknown>) {
    return <LanguageDisplay code={row.original.target_language ?? 'unknown'} />;
}

export function OriginalFileCell({ row }: CellContext<TranslationRow, unknown>) {
    const { isPending, mutateAsync } = useMutation({
        mutationFn: async () => {
            const bucketName = env.NEXT_PUBLIC_FILE_UPLOAD_BUCKET;

            const response = await getSignedUrl({
                bucket: bucketName,
                fileName: row.original.file_url,
            });

            if (response?.error) {
                throw response;
            }

            const signedUrl = response?.data?.signedUrl;

            if (!signedUrl) {
                throw standardizeError({
                    description: 'An error occurred while processing your request. Please try again.',
                    message: 'Failed to generate signed URL.',
                    title: 'Error!',
                });
            }

            // Redirect to the payment page:
            if (typeof window !== 'undefined') {
                window?.open(signedUrl, '_blank');
            } else {
                throw standardizeError({
                    description: 'An error occurred while processing your request. Please try again.',
                    message: 'Failed to generate signed URL.',
                    title: 'Error!',
                });
            }

            return response;
        },
        onError: (error: (Error & Partial<ApiErrorType>) | ApiErrorType) => {
            toast.error(error?.title ?? error?.message ?? 'Error!', {
                description:
                    error?.description ??
                    'An error occurred while processing your request. Please try again.',
            });
        },
        onSuccess: (data: ApiResponseOrError | ApiErrorType) => {
            if (isApiError(data)) {
                toast.error(data?.title ?? data?.message ?? 'Error!', {
                    description:
                        data?.description ??
                        'An error occurred while processing your request. Please try again.',
                });
            }
        },
        retry: 0,
    });

    const handleOriginalFileDownload = async () => {
        await mutateAsync();
    };

    return (
        <Button
            aria-label="Download Original File"
            className={cn('flex h-auto items-center justify-center gap-1')}
            color="primary"
            loading={isPending}
            size="md"
            tooltipContent={
                isPending
                    ? 'Redirecting to the original file...'
                    : 'Download the original file from the translation.'
            }
            variant={isPending ? 'soft' : 'soft'}
            onClick={async () => handleOriginalFileDownload()}
        >
            {!isPending && <DownloadSimpleIcon className="size-5" color="currentColor" weight="duotone" />}
            <span className="text-sm font-bold lining-nums">{isPending ? 'Redirecting' : 'Download'}</span>
        </Button>
    );
}

export function GeneratedFileCell({ row }: CellContext<TranslationRow, unknown>) {
    const status = row.original.status ?? 'queued';
    const exportStatus = (row.original as typeof row.original & { export_status?: ExportStatus })
        .export_status as ExportStatus | null;
    const details = row.original.details as TranslationDetails;
    const generatedDocx = details?.generated_docx as UploadedDocumentUrls | null;

    if (TRANSLATION_PROCESSING_STATUSES.includes(status) || status === 'queued') {
        return (
            <Badge className="w-auto" color="secondary" size="md" variant="soft">
                <HourglassIcon className="size-4 animate-pulse" color="currentColor" weight="duotone" />
                <span className="whitespace-nowrap">Generating</span>
            </Badge>
        );
    }

    if (TRANSLATION_FAILED_STATUSES.includes(status)) {
        return (
            <Badge color="secondary" size="md" variant="soft">
                <XIcon className="size-4" color="currentColor" weight="duotone" />
                <span className="whitespace-nowrap">Failed</span>
            </Badge>
        );
    }

    if (!generatedDocx) {
        return (
            <Badge color="secondary" variant="plain">
                <HourglassIcon className="size-4" color="currentColor" weight="duotone" />
                <span className="whitespace-nowrap">Waiting</span>
            </Badge>
        );
    }

    return (
        <ExportDropdown
            exportStatus={exportStatus}
            generatedDocx={generatedDocx}
            showLabels={false}
            translationId={row.original.id!}
            variant="compact"
        />
    );
}

export function PageCountCell({ row }: CellContext<TranslationRow, unknown>) {
    const details = row.original.details as TranslationDetails | null;
    const pageCount = details?.page_count ?? 0;

    if (!pageCount || pageCount === 0) {
        return <span className="text-surface-400 pl-2 text-sm font-medium">—</span>;
    }

    return (
        <Badge
            variant="soft"
            color="secondary"
            className="flex h-7 w-fit flex-row items-center px-3 whitespace-nowrap"
        >
            <span className="font-semibold lining-nums">
                {pageCount}{' '}
                <span className="ml-0.5 font-medium opacity-70">{pageCount === 1 ? 'Page' : 'Pages'}</span>
            </span>
        </Badge>
    );
}

export function CreditsCell({ row }: CellContext<TranslationRow, unknown>) {
    const details = row.original.details as TranslationDetails | null;
    const pageCount = details?.page_count ?? 0;

    if (!pageCount || pageCount === 0) {
        return <span className="text-surface-400 pl-2 text-sm font-medium">—</span>;
    }

    const credits = calculateCreditsRequired(pageCount);

    return (
        <Badge
            variant="soft"
            color="secondary"
            className="flex h-7 w-fit flex-row items-center gap-1.5 px-3 whitespace-nowrap"
        >
            <CoinsIcon className="size-3.5 shrink-0 opacity-60" weight="duotone" />
            <span className="font-semibold lining-nums">
                {credits}{' '}
                <span className="font-medium opacity-70">{credits === 1 ? 'Credit' : 'Credits'}</span>
            </span>
        </Badge>
    );
}

export function AIQualityCell({ row }: CellContext<TranslationRow, unknown>) {
    const details = row.original.details as TranslationDetails | null;

    const aiAudit = details?.ai_audit as AIAuditData | null;

    // Prioritize QA confidence, fallback to Translation confidence
    const confidence = aiAudit?.qa?.confidence ?? aiAudit?.translation?.confidence;

    if (!confidence) {
        return <span className="text-surface-400 pl-2 text-sm font-medium">—</span>;
    }

    const percentage = Math.round(confidence * 100);

    // Determine color based on score
    let color: 'success' | 'warning' | 'destructive' | 'secondary' = 'secondary';
    if (percentage >= 90) color = 'success';
    else if (percentage >= 70) color = 'warning';
    else if (percentage < 70) color = 'destructive';

    return (
        <Badge
            variant="soft"
            color={color}
            className="flex h-7 w-fit flex-row items-center gap-1.5 px-3 whitespace-nowrap"
        >
            <SealCheckIcon className="size-3.5 shrink-0 opacity-60" weight="duotone" />
            <span className="font-semibold lining-nums">
                {percentage}% <span className="font-medium opacity-70">Quality</span>
            </span>
        </Badge>
    );
}

export function DateCell({ row }: CellContext<TranslationRow, unknown>) {
    const date: string =
        row.original.created_at ??
        row.original.updated_at ??
        row.original.started_at ??
        row.original.completed_at ??
        new Date().toISOString();
    const dateObject: Date = new Date(date);

    const formattedTime = formatRelative(dateObject, new Date());

    return <span className="text-surface-400 text-sm font-medium whitespace-nowrap">{formattedTime}</span>;
}

export function ActionsCell({ row, table }: CellContext<TranslationRow, unknown>) {
    const originalStatus: TranslationStatus = row.original.status ?? 'queued';
    const translationId = row.original.id!;

    // Check for user edits in details
    const details = row.original.details as { user_edits?: unknown } | null;
    const hasUserEdits = !!details?.user_edits;

    type Property = {
        label: string;
        description?: string;
        icon: Icon;
        badge?: string;
        onClick?: () => void;
        href?: string;
        linkType?: 'internal' | 'external';
        className?: string;
    };

    const meta = table?.options?.meta as TranslationsTableMetaType;

    // Define reusable button properties for common actions
    const commonActions: Record<string, Property> = {
        view: {
            label: 'View Details',
            description: 'Check status and history',
            icon: EyeIcon,
            href: `/app/translations/${translationId}`,
            linkType: 'internal',
        },
        regenerate: {
            label: 'Regenerate Document',
            description: hasUserEdits
                ? 'Apply pending edits & rebuild exports'
                : 'Rebuild document exports from scratch',
            icon: FileDocIcon,
            badge: hasUserEdits ? 'EDITS' : undefined,
            onClick: () => meta?.triggerRegeneration?.(row.original),
        },
        retranslate: {
            label: 'Retranslate',
            description: 'Discard current and start fresh',
            icon: TranslateIcon,
            onClick: () => meta?.triggerRetranslate?.(row.original),
        },
        downloadOriginal: {
            label: 'Download Original',
            description: 'Source file',
            icon: DownloadSimpleIcon,
            onClick: () => meta?.triggerDownloadOriginal?.(row.original),
        },
        cancel: {
            label: 'Cancel',
            description: 'Stop processing',
            icon: XIcon,
            onClick: () => meta?.triggerTranslationCancellation?.(row.original),
        },
        delete: {
            label: 'Delete',
            description: 'Permanently remove',
            className:
                'text-destructive-500 font-bold focus:bg-destructive-500 focus:text-destructive-50 dark:focus:bg-destructive-500 dark:focus:text-destructive-50',
            icon: TrashIcon,
            onClick: () => meta?.triggerTranslationDeletion?.(row.original),
        },
        retry: {
            label: 'Retry',
            description: 'Attempt to finish translation',
            icon: ArrowsCounterClockwiseIcon,
            onClick: () => meta?.triggerTranslationRetry?.(row.original),
        },
    };

    // Ready/Completed state inline edit button
    const canEdit = originalStatus === 'ready' || originalStatus === 'completed';

    // Dropdown Actions based on status
    const getDropdownActions = (): Property[] => {
        switch (originalStatus) {
            case 'queued':
            case 'retrying':
                return [commonActions.view, commonActions.delete];

            case 'processing':
            case 'translating':
            case 'polishing':
            case 'generating':
                return [commonActions.view, commonActions.cancel, commonActions.delete];

            case 'ready':
            case 'completed':
                return [
                    commonActions.view,
                    commonActions.regenerate,
                    commonActions.retranslate,
                    commonActions.downloadOriginal,
                    commonActions.delete,
                ];

            case 'failed':
            case 'canceled':
                return [commonActions.view, commonActions.retry, commonActions.delete];

            default:
                return [commonActions.view, commonActions.delete];
        }
    };

    const dropdownActions = getDropdownActions();

    return (
        <div className="flex items-center justify-end gap-2">
            {/* Inline Primary Action for Edit */}
            {canEdit && (
                <Link href={`/app/translations/${translationId}/review`}>
                    <Button color="primary" variant="soft" size="md" className="gap-2">
                        <PencilSimpleIcon className="size-4" weight="bold" />
                        <span>Edit</span>
                    </Button>
                </Link>
            )}

            {/* 3-Dots Menu with Premium Layout */}
            {dropdownActions.length > 0 && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            aria-label="More Actions"
                            className="flex h-auto items-center justify-center p-2"
                            color="primary"
                            size="md"
                            variant="soft"
                        >
                            <DotsThreeIcon className="size-5" color="currentColor" weight="bold" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-72 max-w-[calc(100vw-2rem)]">
                        <DropdownMenuGroup>
                            {dropdownActions.map((action, index) => {
                                const {
                                    href,
                                    icon: ActionIcon,
                                    label,
                                    description,
                                    badge,
                                    onClick,
                                    className,
                                } = action;

                                const content = (
                                    <div className="flex w-full items-start gap-3 py-1">
                                        <ActionIcon
                                            className="mt-0.5 size-5 shrink-0 opacity-70"
                                            color="currentColor"
                                            weight="duotone"
                                        />
                                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">{label}</span>
                                                {badge && (
                                                    <span className="text-warning-600 dark:text-warning-400 bg-warning-100 dark:bg-warning-900/30 shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold">
                                                        {badge}
                                                    </span>
                                                )}
                                            </div>
                                            {description && (
                                                <span className="line-clamp-1 text-xs opacity-60">
                                                    {description}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );

                                if (href) {
                                    return (
                                        <Link key={index} href={href} className="w-full">
                                            <DropdownMenuItem className={cn('cursor-pointer', className)}>
                                                {content}
                                            </DropdownMenuItem>
                                        </Link>
                                    );
                                }

                                return (
                                    <DropdownMenuItem
                                        key={index}
                                        className={cn('cursor-pointer', className)}
                                        onClick={onClick}
                                    >
                                        {content}
                                    </DropdownMenuItem>
                                );
                            })}
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );
}
