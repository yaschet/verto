/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import {
    DeviceMobileIcon,
    InfoIcon,
    QrCodeIcon,
    ShieldCheckIcon,
    ShieldSlashIcon,
    TrashIcon,
} from '@phosphor-icons/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Fragment, useState } from 'react';
import { toast } from 'sonner';
import DeleteFactorAlertDialog from '@/app/(protected)/account/components/core/delete-factor-alert-dialog';
import { EnrollMFAModal } from '@/app/(protected)/account/components/core/enroll-mfa-modal';
import AnimatedDisclosure from '@/components/ui/disclosure';
import { deleteMfaFactor, listMfaFactors } from '@/src/actions/auth/multi-factor-authentication';
import { getQueryClient } from '@/src/queries/tanstack/query-client';
import { PanelSection } from '@app/(protected)/account/components/shared/panel-section';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Skeleton } from '@components/ui/skeleton';
import type { ApiErrorType } from '@/types/rest/errors';
import type { Factor } from '@supabase/supabase-js';

export default function MultiFactorPanel() {
    // Local state:
    const [selectedFactorId, setSelectedFactorId] = useState<string | null>(null);
    const [isDeletionModalOpen, setIsDeletionModalOpen] = useState<boolean>(false);

    const queryClient = getQueryClient();

    const { data: factors, isLoading } = useQuery<Factor[], ApiErrorType, Factor[], ['mfa-factors']>({
        queryFn: async () => {
            const response = await listMfaFactors();

            if (response?.error || !response) {
                throw response;
            }

            return response.data?.factors ?? [];
        },
        queryKey: ['mfa-factors'],
        staleTime: 0,
        refetchOnMount: 'always',
    });

    const { isPending: isDeletingFactor, mutateAsync: mutateFactorDeletion } = useMutation({
        mutationFn: async (factorId: string) => {
            const response = await deleteMfaFactor(factorId);
            if (response?.error || !response) {
                throw new Error(response.message);
            }
            return response;
        },
        onError: (error: Error & Partial<ApiErrorType>) => {
            toast.error(error.message || 'Failed to delete MFA factor.', {
                description:
                    error.description || 'An unexpected error occurred while deleting the MFA factor.',
            });
        },
        onSuccess: (response) => {
            toast.success(response.message, {
                description: response.description,
            });
            queryClient.invalidateQueries({ queryKey: ['mfa-factors'] }).then((r) => r);
            setSelectedFactorId(null);
            setIsDeletionModalOpen(false);
        },
    });

    const handleDeleteFactor = async (factorId: string) => {
        await mutateFactorDeletion(factorId);
    };

    const enrolledFactors =
        (factors?.length ?? 0) > 0 ? (factors?.filter((factor) => factor.status === 'verified') ?? []) : [];
    const isEnrolled = enrolledFactors.length > 0;

    const onEnrolled = async () => {
        await queryClient.invalidateQueries({ queryKey: ['mfa-factors'] }).then((r) => r);
    };

    return (
        <PanelSection
            aboveContent={
                !isLoading && (
                    <div className="mb-2 flex items-center justify-start gap-2">
                        <Badge
                            className="w-fit items-center"
                            color={(isEnrolled && 'success') || (!isEnrolled && 'destructive') || 'info'}
                            size="sm"
                            variant="soft"
                        >
                            {(isEnrolled && (
                                <ShieldCheckIcon className="size-3" color="currentColor" weight="duotone" />
                            )) ||
                                (!isEnrolled && (
                                    <ShieldSlashIcon
                                        className="size-3"
                                        color="currentColor"
                                        weight="duotone"
                                    />
                                ))}
                            {isEnrolled ? 'Activated' : 'Deactivated'}
                        </Badge>
                    </div>
                )
            }
            description="Add an additional layer of security to your account by requiring more than just a password to sign in."
            title="Multi-Factor Authentication"
        >
            {isLoading && (
                <div className="flex w-full flex-col gap-4">
                    <div className="flex w-full flex-row gap-6">
                        <div className="flex w-full flex-col gap-6">
                            <Skeleton className="h-4 w-1/3" />
                            <div className="flex w-full flex-col gap-3">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {!isLoading && (
                <div className="flex w-full flex-col gap-4">
                    <div className="flex w-full flex-row gap-6">
                        <div className="flex w-full flex-col gap-3">
                            <div className="flex w-full flex-col items-start justify-start">
                                <AnimatedDisclosure
                                    extraTitleContent={
                                        <Badge
                                            className="w-fit rounded-sm"
                                            color="accent"
                                            size="sm"
                                            variant="outlined"
                                        >
                                            {enrolledFactors.length}{' '}
                                            {enrolledFactors.length === 1 ? 'app' : 'apps'} enrolled
                                        </Badge>
                                    }
                                    title={
                                        <Fragment>
                                            <DeviceMobileIcon
                                                className="size-5"
                                                color="currentColor"
                                                weight="regular"
                                            />
                                            <span className="font-semibold">Authenticator App</span>
                                        </Fragment>
                                    }
                                >
                                    <p className="text-muted pb-2 text-sm">
                                        Generate one-time passwords via authenticator apps like 1Password,
                                        Authy, etc. as a second factor to verify your identity during sign-in.
                                    </p>
                                    {isEnrolled && enrolledFactors.length === 1 && (
                                        <div className="w-full">
                                            <div className="flex flex-col items-start justify-start gap-2 py-3">
                                                <div className="flex items-start justify-start gap-3">
                                                    <div className="bg-surface-200 dark:bg-surface-800 flex aspect-square h-8 w-auto items-center justify-center rounded-full">
                                                        <InfoIcon
                                                            className="text-foreground size-4"
                                                            color="currentColor"
                                                        />
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <h4 className="text-foreground dark:text-foreground-500 text-sm font-semibold">
                                                            We recommend configuring two authenticator apps
                                                            across different devices.
                                                        </h4>
                                                        <p className="text-muted text-sm">
                                                            The two authenticator apps will serve as a backup
                                                            for each other, ensuring that you can always
                                                            access your account.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {enrolledFactors.length > 0 && (
                                        <div className="my-2 flex w-full flex-col items-center justify-center gap-1.5">
                                            {enrolledFactors.map((factor) => (
                                                <div
                                                    key={factor.id}
                                                    className="flex w-full flex-row items-center justify-between"
                                                >
                                                    <p className="text-foreground flex w-fit items-center justify-start gap-1 text-sm">
                                                        <span className="text-surface-600 dark:text-surface-400 font-medium">
                                                            Name:
                                                        </span>
                                                        <span className="text-foreground font-semibold">
                                                            {factor.friendly_name}
                                                        </span>
                                                    </p>
                                                    <div className="flex w-fit items-center justify-end gap-2">
                                                        <span className="text-surface-600 dark:text-surface-400 text-xs font-medium">
                                                            Added on{' '}
                                                            {new Date(factor.created_at).toLocaleDateString(
                                                                'en-GB',
                                                                {
                                                                    day: 'numeric',
                                                                    hour: 'numeric',
                                                                    minute: 'numeric',
                                                                    month: 'short',
                                                                    second: 'numeric',
                                                                    year: 'numeric',
                                                                },
                                                            )}
                                                        </span>
                                                        <Button
                                                            color="secondary"
                                                            shape="rounded-sm"
                                                            size="sm"
                                                            type="button"
                                                            variant="soft"
                                                            onClick={() => {
                                                                setIsDeletionModalOpen(true);
                                                                setSelectedFactorId(factor.id);
                                                            }}
                                                        >
                                                            <TrashIcon
                                                                className="size-4"
                                                                color="currentColor"
                                                                weight="regular"
                                                            />
                                                            <span>Remove</span>
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                            <DeleteFactorAlertDialog
                                                {...{
                                                    deletionLoading: isDeletingFactor,
                                                    handleDeleteFactor,
                                                    isDeletionModalOpen,
                                                    isTheOnlyFactor: enrolledFactors.length === 1,
                                                    selectedFactorId,
                                                    setIsDeletionModalOpen,
                                                }}
                                            />
                                        </div>
                                    )}
                                    <Fragment>
                                        <EnrollMFAModal
                                            modalTriggerButton={
                                                <Button
                                                    className="w-fit rounded-sm"
                                                    color="primary"
                                                    size="sm"
                                                    type="button"
                                                    variant="solid"
                                                >
                                                    <QrCodeIcon
                                                        className="size-4"
                                                        color="currentColor"
                                                        weight="duotone"
                                                    />
                                                    <span>Add new Authenticator App</span>
                                                </Button>
                                            }
                                            onEnrolled={onEnrolled}
                                        />
                                    </Fragment>
                                </AnimatedDisclosure>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </PanelSection>
    );
}
