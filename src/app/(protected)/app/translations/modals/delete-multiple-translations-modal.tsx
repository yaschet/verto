/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { TrashIcon, WarningIcon, XIcon } from '@phosphor-icons/react';
import { useMutation } from '@tanstack/react-query';
import { type JSX } from 'react';
import { toast } from 'sonner';
import { titleCase } from 'title-case';
import { deleteTranslations } from '@/src/actions/services/translations/delete-translation';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/src/components/ui/alert-dialog';
import { getQueryClient } from '@/src/queries/tanstack/query-client';
import { Button } from '@components/ui/button';
import { useUserData } from '@hooks/queries/auth/use-user-data';
import type { TranslationRow } from '@/src/schemas/translation-schemas';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';
import type { Dispatch, SetStateAction } from 'react';

/**
 * Delete Translation Modal Component.
 *
 * **Note:** Use this modal only in a client-side context.
 *
 * @returns {JSX.Element}
 * @export
 */
export default function DeleteMultipleTranslationsModal({
    isMultipleDeletionModalOpen,
    selectedTranslations = [],
    setIsMultipleDeletionModalOpen,
    setSelectedTranslations,
}: {
    isMultipleDeletionModalOpen: boolean;
    selectedTranslations: TranslationRow[];
    setSelectedTranslations: Dispatch<SetStateAction<TranslationRow[] | null>>;
    setIsMultipleDeletionModalOpen: Dispatch<SetStateAction<boolean>>;
}): JSX.Element {
    const queryClient = getQueryClient();
    const { data: userData } = useUserData();
    const { user } = userData ?? {};
    const userId = user?.id ?? '';

    const { isPending, mutateAsync } = useMutation({
        mutationFn: async ({ ids }: { ids: string[] }) => {
            const response = await deleteTranslations({
                ids: ids ?? null,
            });

            if (response?.error || !response) {
                throw response;
            }

            return response;
        },
        onError: (error: (Error & Partial<ApiErrorType>) | ApiErrorType) => {
            toast.error(error.title ?? error.message ?? 'Error Deleting Translations', {
                description: error.description ?? 'An error occurred while deleting the translations.',
            });
        },
        onSuccess: async (data: ApiResponseOrError) => {
            setIsMultipleDeletionModalOpen(false);
            setSelectedTranslations([]);
            await queryClient.invalidateQueries({
                queryKey: ['paginated-translations', userId],
            });
            toast.success(data.message ?? 'Translations Deleted', {
                description: data.description ?? 'The selected translations were successfully deleted.',
            });
        },
        retry: 3,
        retryDelay: (attempt) => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000),
    });

    const handleDeleteTranslations = async (ids: string[]) => {
        await mutateAsync({ ids: ids ?? [] });
    };

    return (
        <AlertDialog open={isMultipleDeletionModalOpen} onOpenChange={setIsMultipleDeletionModalOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{titleCase('Confirm Deletion')}</AlertDialogTitle>
                </AlertDialogHeader>
                <div className="relative flex flex-col items-start justify-start gap-2 py-3 text-start">
                    <div className="flex items-start justify-start gap-3">
                        <div className="bg-destructive-50 dark:bg-destructive-950/20 flex aspect-square h-8 w-auto items-center justify-center rounded-full">
                            <WarningIcon
                                className="text-destructive size-4"
                                color="currentColor"
                                weight="fill"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <h4 className="text-destructive text-start text-sm font-semibold">
                                Delete {selectedTranslations?.length} Translation
                                {selectedTranslations?.length > 1 ? 's' : ''}
                            </h4>
                            <p className="text-muted text-start text-sm">
                                You are about to permanently delete {selectedTranslations?.length} translation
                                {selectedTranslations?.length > 1 ? 's' : ''}. This action cannot be undone.
                            </p>
                        </div>
                    </div>
                </div>

                <AlertDialogDescription asChild>
                    <div className="text-foreground dark:text-foreground-500 text-start text-sm">
                        Before proceeding, please note:
                        <ul
                            className="text-surface-500 marker:text-destructive list-disc space-y-1 px-4 py-2 text-start text-sm marker:font-bold"
                            role="list"
                        >
                            <li>
                                This action is irreversible. The selected translation
                                {selectedTranslations?.length > 1 ? 's' : ''} will be permanently deleted.
                            </li>
                            <li>All associated files will also be deleted.</li>
                        </ul>
                    </div>
                </AlertDialogDescription>

                <AlertDialogFooter>
                    <Button
                        color="default"
                        variant="soft"
                        onClick={() => setIsMultipleDeletionModalOpen(false)}
                    >
                        <XIcon className="size-4" color="currentColor" weight="duotone" />
                        Cancel
                    </Button>
                    {!isPending && (
                        <Button
                            color="destructive"
                            variant="solid"
                            onClick={async () => {
                                const ids: string[] = selectedTranslations
                                    .map((translation) => translation.id ?? null)
                                    .filter((id) => id !== null) as string[];
                                await handleDeleteTranslations(ids ?? []);
                            }}
                        >
                            <TrashIcon className="size-4" color="currentColor" />
                            <span>Delete</span>
                        </Button>
                    )}
                    {isPending && (
                        <Button disabled loading color="destructive" variant="solid">
                            Deleting {selectedTranslations?.length} Translation
                            {selectedTranslations?.length > 1 ? 's' : ''}
                        </Button>
                    )}
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
