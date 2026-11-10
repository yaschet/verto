/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { useCallback } from 'react';
import { TranslateIcon, WarningIcon } from '@phosphor-icons/react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { retryTranslation } from '@actions/services/translations/retry-translation';
import { Button } from '@components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@components/ui/dialog';
import { useUserData } from '@hooks/queries/auth/use-user-data';
import { getQueryClient } from '@queries/tanstack/query-client';
import type { TranslationRow } from '@schemas/translation-schemas';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';
import type { Dispatch, SetStateAction, JSX } from 'react';

/**
 * Retranslate Confirmation Modal
 *
 * Simple confirmation dialog for retranslating a READY translation.
 * This is distinct from RetryTranslationModal which handles FAILED translations.
 *
 * Use case: User has a completed translation but wants to start fresh
 * (e.g., wrong template, want different AI model behavior, etc.)
 *
 * Action: Full pipeline restart - clears ALL existing work.
 */
export default function RetranslateConfirmationModal({
    isOpen,
    selectedTranslation,
    setIsOpen,
}: {
    isOpen: boolean;
    selectedTranslation: TranslationRow | null;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}): JSX.Element {
    const queryClient = getQueryClient();
    const { data: userData } = useUserData();
    const { user } = userData ?? {};
    const userId = user?.id ?? '';

    const handleClose = useCallback(() => {
        setIsOpen(false);
    }, [setIsOpen]);

    const handleSuccess = useCallback(
        async (_data: ApiResponseOrError) => {
            handleClose();
            await queryClient.invalidateQueries({
                queryKey: ['paginated-translations', userId],
            });
            if (selectedTranslation?.id) {
                await queryClient.invalidateQueries({
                    queryKey: ['translation-detail', selectedTranslation.id],
                });
            }
            toast.success('Retranslation Started', {
                description: 'Your document is being translated again from scratch.',
            });
        },
        [handleClose, queryClient, userId, selectedTranslation?.id],
    );

    const handleError = useCallback((error: (Error & Partial<ApiErrorType>) | ApiErrorType | unknown) => {
        const err = error as { title?: string; message?: string; description?: string };
        toast.error(err.title ?? err.message ?? 'Error', {
            description: err.description ?? 'Failed to start retranslation.',
        });
    }, []);

    const retranslateMutation = useMutation({
        mutationFn: async ({ id }: { id: string }) => {
            const response = await retryTranslation({ translationId: id });
            if (response?.error || !response) throw response;
            return response;
        },
        onError: handleError,
        onSuccess: handleSuccess,
    });

    const handleConfirm = () => {
        if (!selectedTranslation?.id) return;
        retranslateMutation.mutate({ id: selectedTranslation.id });
    };

    const displayName = selectedTranslation?.display_name || 'this translation';

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="flex w-full flex-row items-center gap-4 space-y-0">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-warning-100 text-warning-600 dark:bg-warning-900/20 dark:text-warning-400">
                        <TranslateIcon className="size-6" weight="duotone" />
                    </div>
                    <div className="flex flex-1 flex-col gap-1">
                        <DialogTitle>Retranslate Document</DialogTitle>
                        <DialogDescription>Start a fresh translation of "{displayName}"</DialogDescription>
                    </div>
                </DialogHeader>

                <div className="mt-4 rounded-2xl bg-warning-50 p-4 dark:bg-warning-950/30">
                    <div className="flex items-start gap-3">
                        <WarningIcon
                            className="mt-0.5 size-5 shrink-0 text-warning-600 dark:text-warning-400"
                            weight="duotone"
                        />
                        <div>
                            <p className="text-sm font-bold text-warning-800 dark:text-warning-200">
                                Consumes Credits
                            </p>
                            <p className="mt-1 text-xs text-warning-700 dark:text-warning-300">
                                Retranslating will consume the same amount of credits as the original
                                translation. If it fails, you will be refunded.
                            </p>

                            <p className="mt-4 text-sm font-medium text-warning-800 dark:text-warning-200">
                                This will also permanently discard:
                            </p>
                            <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-warning-600 dark:text-warning-400 marker:text-warning-500">
                                <li>Current translated content</li>
                                <li>Any edits you've made</li>
                                <li>Generated documents (DOCX, PDF, HTML)</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <DialogFooter className="mt-6 flex gap-3">
                    <Button
                        type="button"
                        variant="outlined"
                        onClick={handleClose}
                        disabled={retranslateMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        color="warning"
                        onClick={handleConfirm}
                        loading={retranslateMutation.isPending}
                        disabled={retranslateMutation.isPending}
                    >
                        {retranslateMutation.isPending ? 'Starting...' : 'Retranslate'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
