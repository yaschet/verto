/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import {
    ShieldCheckIcon,
    TrashIcon,
    WarningIcon,
    DeviceMobileIcon,
    CalendarIcon,
} from '@phosphor-icons/react';
import { adminListUserMfaFactors, adminDeleteUserMfaFactor } from '@actions/admin/users/manage-mfa';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@components/ui/alert-dialog';
import { format } from 'date-fns';

interface ManageMfaDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userId: string;
    userName: string;
}

export function ManageMfaDialog({ open, onOpenChange, userId, userName }: ManageMfaDialogProps) {
    const [factorToDelete, setFactorToDelete] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const { data: response, isLoading } = useQuery({
        queryKey: ['admin', 'user-mfa', userId],
        queryFn: () => adminListUserMfaFactors({ userId }),
        enabled: open,
        staleTime: 0,
        refetchOnMount: 'always',
    });

    const deleteMutation = useMutation({
        mutationFn: (factorId: string) => adminDeleteUserMfaFactor({ userId, factorId }),
        onSuccess: (result) => {
            if ('success' in result && result.success) {
                toast.success('MFA factor removed', {
                    description: result.message,
                });
                queryClient.invalidateQueries({ queryKey: ['admin', 'user-mfa', userId] });
            } else {
                toast.error('Failed to remove MFA factor', {
                    description: result.message,
                });
            }
            setFactorToDelete(null);
        },
        onError: (error: Error) => {
            toast.error('Failed to remove MFA factor', {
                description: error.message,
            });
            setFactorToDelete(null);
        },
    });

    const allFactors = response && 'success' in response && response.success ? response.data : [];
    const factors = (allFactors ?? []).filter((f) => f.status === 'verified');

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-lg">
                    {/* Custom Header Layout - matches add-user-sheet pattern */}
                    <DialogHeader className="flex w-full flex-row items-center gap-4 space-y-0">
                        <div className="bg-success-100 dark:bg-success-900/20 text-success-600 dark:text-success-400 flex size-12 shrink-0 items-center justify-center rounded-full">
                            <ShieldCheckIcon className="size-6" weight="duotone" />
                        </div>
                        <div className="flex flex-1 flex-col gap-1">
                            <DialogTitle>Manage MFA</DialogTitle>
                            <DialogDescription>Two-factor authentication for {userName}</DialogDescription>
                        </div>
                    </DialogHeader>

                    {/* MFA Status Card */}
                    {!isLoading && (
                        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-surface-100 p-4 dark:bg-surface-900">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-200 dark:bg-surface-800">
                                <ShieldCheckIcon
                                    className="size-5 text-surface-600 dark:text-surface-400"
                                    weight="duotone"
                                />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-medium text-surface-500">MFA Status</span>
                                <span className="text-lg font-bold text-surface-900 dark:text-surface-100">
                                    {factors.length} {factors.length === 1 ? 'Factor' : 'Factors'} Enrolled
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    <div className="mt-4 space-y-3">
                        {isLoading ? (
                            <div className="space-y-3">
                                {[1, 2].map((i) => (
                                    <div
                                        key={i}
                                        className="h-[72px] animate-pulse rounded-xl bg-surface-100 dark:bg-surface-800"
                                    />
                                ))}
                            </div>
                        ) : factors && factors.length > 0 ? (
                            factors.map((factor) => (
                                <div
                                    key={factor.id}
                                    className="group flex items-center gap-4 rounded-2xl bg-surface-100 p-4 transition-all dark:bg-surface-900"
                                >
                                    {/* Factor Icon */}
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-200 text-surface-600 dark:bg-surface-800 dark:text-surface-400">
                                        <DeviceMobileIcon className="size-5" weight="duotone" />
                                    </div>

                                    {/* Factor Details */}
                                    <div className="flex flex-1 flex-col gap-0.5">
                                        <p className="font-medium text-surface-900 dark:text-surface-100">
                                            {factor.friendly_name || 'Authenticator App'}
                                        </p>
                                        <div className="flex items-center gap-1.5 text-xs text-surface-500">
                                            <CalendarIcon className="size-3.5" />
                                            <span>
                                                Added {format(new Date(factor.created_at), 'MMM d, yyyy')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Status Badge */}
                                    <Badge variant="soft" color="success" className="text-xs">
                                        Active
                                    </Badge>

                                    {/* Remove Button */}
                                    <Button
                                        variant="plain"
                                        size="icon-sm"
                                        onClick={() => setFactorToDelete(factor.id)}
                                        className="text-destructive-500 opacity-100 transition-opacity hover:bg-destructive-50 hover:text-destructive-600 sm:opacity-0 sm:group-hover:opacity-100 dark:hover:bg-destructive-950/30"
                                    >
                                        <TrashIcon className="size-4" />
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-300 bg-surface-50/50 px-6 py-12 dark:border-surface-700 dark:bg-surface-900/50">
                                <div className="flex size-14 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800">
                                    <ShieldCheckIcon className="size-7 text-surface-400" weight="duotone" />
                                </div>
                                <p className="mt-4 font-medium text-surface-700 dark:text-surface-300">
                                    No MFA factors enrolled
                                </p>
                                <p className="mt-1.5 text-center text-sm text-surface-500">
                                    This user hasn&apos;t set up two-factor authentication yet.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer Info */}
                    {factors && factors.length > 0 && (
                        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-warning-50 p-4 text-sm text-warning-700 dark:bg-warning-950/30 dark:text-warning-400">
                            <WarningIcon className="size-5 shrink-0" weight="duotone" />
                            <span>Removing MFA factors will decrease account security.</span>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!factorToDelete} onOpenChange={() => setFactorToDelete(null)}>
                <AlertDialogContent className="sm:max-w-md">
                    <AlertDialogHeader className="flex w-full flex-row items-center gap-4 space-y-0">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-destructive-100 text-destructive-600 dark:bg-destructive-900/20 dark:text-destructive-400">
                            <WarningIcon className="size-6" weight="duotone" />
                        </div>
                        <div className="flex flex-1 flex-col gap-1">
                            <AlertDialogTitle>Remove MFA Factor?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will remove this authentication method from the user&apos;s account.
                            </AlertDialogDescription>
                        </div>
                    </AlertDialogHeader>

                    <div className="mt-4 rounded-2xl border border-destructive-200 bg-destructive-50 p-4 text-sm text-destructive-700 dark:border-destructive-900 dark:bg-destructive-950/30 dark:text-destructive-400">
                        The user will need to re-enroll if they want to use MFA again. This action is logged
                        for audit purposes.
                    </div>

                    <AlertDialogFooter className="mt-6 gap-3">
                        <AlertDialogCancel asChild>
                            <Button variant="outlined" color="default">
                                Cancel
                            </Button>
                        </AlertDialogCancel>
                        <Button
                            color="destructive"
                            loading={deleteMutation.isPending}
                            onClick={() => factorToDelete && deleteMutation.mutate(factorToDelete)}
                        >
                            {deleteMutation.isPending ? 'Removing...' : 'Remove Factor'}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
