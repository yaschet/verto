/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { TrashIcon, XIcon } from '@phosphor-icons/react';
import { useMutation } from '@tanstack/react-query';
import { type JSX } from 'react';
import { toast } from 'sonner';
import { titleCase } from 'title-case';
import { deleteCustomer } from '@/src/actions/services/customers/delete-customer';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/src/components/ui/alert-dialog';
import { Button } from '@components/ui/button';
import { useUserData } from '@hooks/queries/auth/use-user-data';
import type { Tables } from '@/types/database/database';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';
import type { QueryClient } from '@tanstack/react-query';
import type { Dispatch, SetStateAction } from 'react';

/**
 * Delete Customer Modal Component.
 *
 * **Note:** Use this modal only in a client-side context.
 *
 * @param {{
 *     isDeletionModalOpen: boolean;
 *     selectedCustomer: Tables<'extended_customer_view'> | null;
 *     setIsDeletionModalOpen: Dispatch<SetStateAction<boolean>>;
 *     queryClient: QueryClient;
 * }} {
 *   IsDeletionModalOpen, selectedCustomer, setIsDeletionModalOpen, queryClient,
 *
 *   }
 * @returns {JSX.Element}
 * @export
 */
export default function DeleteCustomerModal({
    isDeletionModalOpen,
    queryClient,
    selectedCustomer,
    setIsDeletionModalOpen,
    setSelectedCustomer,
}: {
    isDeletionModalOpen: boolean;
    selectedCustomer: Tables<'extended_customer_view'> | null;
    setSelectedCustomer: Dispatch<SetStateAction<Tables<'extended_customer_view'> | null>>;
    setIsDeletionModalOpen: Dispatch<SetStateAction<boolean>>;
    queryClient: QueryClient;
}): JSX.Element {
    const { data: userData } = useUserData();
    const { user } = userData ?? {};
    const userId = user?.id ?? '';

    const { isPending, mutateAsync } = useMutation({
        mutationFn: async ({ id }: { id: string }) => {
            const response = await deleteCustomer({
                id: id ?? null,
            });

            if (response?.error || !response) {
                throw response;
            }

            return response;
        },
        onError: (error: (Error & Partial<ApiErrorType>) | ApiErrorType) => {
            toast.error(error.title ?? error.message ?? 'Error', {
                description: error.description ?? 'An error occurred while deleting the customer.',
            });
        },
        onSuccess: async (data: ApiResponseOrError) => {
            setIsDeletionModalOpen(false);
            setSelectedCustomer(null);
            await queryClient.invalidateQueries({
                queryKey: ['paginated-customers', userId],
            });
            toast.success(data.message ?? 'Customer Deleted', {
                description: data.description ?? 'The customer has been successfully deleted.',
            });
        },
        retry: 3,
        retryDelay: (attempt) => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000),
    });

    const handleDeleteCustomer = async (id: string) => {
        await mutateAsync({ id });
    };

    return (
        <AlertDialog open={isDeletionModalOpen} onOpenChange={setIsDeletionModalOpen}>
            <AlertDialogContent>
                <AlertDialogHeader className="text-start text-lg font-semibold">
                    <AlertDialogTitle>{titleCase('Confirm Customer Deletion')}</AlertDialogTitle>
                </AlertDialogHeader>

                <div className="text-foreground dark:text-foreground-500 text-start text-sm">
                    Before proceeding with the deletion, please consider:
                    <ul
                        className="text-surface-500 marker:text-destructive list-disc space-y-1 px-4 py-2 text-start text-sm marker:font-bold"
                        role="list"
                    >
                        <li>Reassigning translations to another customer before deletion.</li>
                        <li>
                            The translations associated with this customer will be unassigned and will not be
                            deleted.
                        </li>
                        <li>This action is irreversible.</li>
                    </ul>
                </div>

                <AlertDialogFooter>
                    <Button color="default" variant="soft" onClick={() => setIsDeletionModalOpen(false)}>
                        <XIcon className="size-4" color="currentColor" weight="duotone" />
                        Cancel
                    </Button>
                    {!isPending && (
                        <Button
                            color="destructive"
                            variant="solid"
                            onClick={async () => {
                                if (!selectedCustomer?.id) return;
                                await handleDeleteCustomer(selectedCustomer.id);
                            }}
                        >
                            <TrashIcon className="size-4" color="currentColor" />
                            <span>Delete</span>
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
