/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { TrashIcon } from '@phosphor-icons/react';
import { useMutation } from '@tanstack/react-query';
import { useRouter, usePathname } from 'next/navigation';
import { type JSX } from 'react';
import { toast } from 'sonner';
import { titleCase } from 'title-case';
import { deleteTranslation } from '@/src/actions/services/translations/delete-translation';
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
export default function DeleteTranslationModal({
    isDeletionModalOpen,
    selectedTranslation,
    setIsDeletionModalOpen,
    setSelectedTranslation,
}: {
    isDeletionModalOpen: boolean;
    selectedTranslation: TranslationRow | null;
    setSelectedTranslation: Dispatch<SetStateAction<TranslationRow | null>>;
    setIsDeletionModalOpen: Dispatch<SetStateAction<boolean>>;
}): JSX.Element {
    const queryClient = getQueryClient();
    const router = useRouter();
    const pathname = usePathname();
    const { data: userData } = useUserData();
    const { user } = userData ?? {};
    const userId = user?.id ?? '';

    const { isPending, mutateAsync } = useMutation({
        mutationFn: async ({ id }: { id: string }) => {
            const response = await deleteTranslation({
                id: id ?? null,
            });

            if (response?.error || !response) {
                throw response;
            }

            return response;
        },
        onError: (error: (Error & Partial<ApiErrorType>) | ApiErrorType) => {
            toast.error(error.title ?? error.message ?? 'Error', {
                description: error.description ?? 'An error occurred while deleting the translation.',
            });
        },
        onSuccess: async (data: ApiResponseOrError) => {
            const deletedId = selectedTranslation?.id;
            setIsDeletionModalOpen(false);
            setSelectedTranslation(null);

            await queryClient.invalidateQueries({
                queryKey: ['paginated-translations', userId],
            });

            // Redirect only if we are currently viewing the deleted translation
            if (deletedId && pathname.includes(deletedId)) {
                router.push('/app/translations');
            }

            toast.success(data.message ?? 'Translation Deleted', {
                description: data.description ?? 'The translation has been successfully deleted.',
            });
        },
        retry: 3,
        retryDelay: (attempt) => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000),
    });

    const handleDeleteTranslation = async (id: string) => {
        await mutateAsync({ id });
    };

    return (
        <AlertDialog open={isDeletionModalOpen} onOpenChange={setIsDeletionModalOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{titleCase('Confirm Deletion')}</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete the translation &#x201C;
                        {selectedTranslation?.display_name}
                        &#x201D;?
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="text-foreground dark:text-foreground-500 text-start text-sm">
                    Before proceeding, please note:
                    <ul
                        className="text-surface-500 marker:text-destructive list-disc space-y-1 px-4 py-2 text-start text-sm marker:font-bold"
                        role="list"
                    >
                        <li>This action is irreversible.</li>
                        <li>The uploaded file associated with this translation will also be deleted.</li>
                    </ul>
                </div>

                <AlertDialogFooter>
                    <Button color="default" variant="soft" onClick={() => setIsDeletionModalOpen(false)}>
                        Cancel
                    </Button>
                    {!isPending && (
                        <Button
                            color="destructive"
                            variant="solid"
                            onClick={async () => {
                                if (!selectedTranslation?.id) return;
                                await handleDeleteTranslation(selectedTranslation.id);
                            }}
                        >
                            <TrashIcon className="size-4" color="currentColor" />
                            Delete
                        </Button>
                    )}
                    {isPending && (
                        <Button disabled loading color="destructive" variant="solid">
                            Deleting
                        </Button>
                    )}
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
