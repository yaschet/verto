/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { TrashIcon, WarningIcon, XIcon } from '@phosphor-icons/react';
import { useMutation } from '@tanstack/react-query';
import { type JSX } from 'react';
import { toast } from 'sonner';
import { titleCase } from 'title-case';
import { deleteCustomers } from '@/src/actions/services/customers/delete-customer';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
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
 *     isMultipleDeletionModalOpen: boolean;
 *     selectedCustomer: Tables<'extended_customer_view'> | null;
 *     setIsMultipleDeletionModalOpen: Dispatch<SetStateAction<boolean>>;
 *     queryClient: QueryClient;
 * }} {
 *   IsDeletionModalOpen, selectedCustomer, setIsMultipleDeletionModalOpen, queryClient,
 *
 *   }
 * @returns {JSX.Element}
 * @export
 */
export default function DeleteMultipleCustomersModal({
    isMultipleDeletionModalOpen,
    queryClient,
    selectedCustomers,
    setIsMultipleDeletionModalOpen,
    setSelectedCustomers,
}: {
    isMultipleDeletionModalOpen: boolean;
    selectedCustomers: Tables<'extended_customer_view'>[];
    setSelectedCustomers: Dispatch<SetStateAction<Tables<'extended_customer_view'>[]>>;
    setIsMultipleDeletionModalOpen: Dispatch<SetStateAction<boolean>>;
    queryClient: QueryClient;
}): JSX.Element {
    const { data: userData } = useUserData();
    const { user } = userData ?? {};
    const userId = user?.id ?? '';

    const { isPending, mutateAsync } = useMutation({
        mutationFn: async ({ ids }: { ids: string[] }) => {
            const response = await deleteCustomers({
                ids: ids ?? null,
            });

            if (response?.error || !response) {
                throw response;
            }

            return response;
        },
        onError: (error: (Error & Partial<ApiErrorType>) | ApiErrorType) => {
            toast.error(error.title ?? error.message ?? 'Error Deleting Customers', {
                description: error.description ?? 'An error occurred while deleting the customers.',
            });
        },
        onSuccess: async (data: ApiResponseOrError) => {
            setIsMultipleDeletionModalOpen(false);
            setSelectedCustomers([]);
            await queryClient.invalidateQueries({
                queryKey: ['paginated-customers', userId],
            });
            toast.success(data.message ?? 'Customers Deleted', {
                description: data.description ?? 'The selected customers have been deleted successfully.',
            });
        },
        retry: 3,
        retryDelay: (attempt) => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000),
    });

    const handleDeleteCustomers = async (ids: string[]) => {
        await mutateAsync({ ids: ids ?? [] });
    };

    return (
        <AlertDialog open={isMultipleDeletionModalOpen} onOpenChange={setIsMultipleDeletionModalOpen}>
            <AlertDialogContent>
                <AlertDialogHeader className="text-start text-lg font-semibold">
                    {titleCase('Confirm Customers Deletion')}
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
                                Delete {selectedCustomers.length} Customer
                                {selectedCustomers.length > 1 ? 's' : ''}
                            </h4>
                            <p className="text-muted text-start text-sm">
                                {selectedCustomers.length} Customer{selectedCustomers.length > 1 ? 's' : ''}{' '}
                                will be permanently deleted! Please confirm this action.
                            </p>
                        </div>
                    </div>
                </div>

                <AlertDialogDescription asChild>
                    <div className="text-foreground dark:text-foreground-500 text-start text-sm">
                        Before proceeding with the deletion, please consider:
                        <ul
                            className="text-surface-500 marker:text-destructive list-disc space-y-1 px-4 py-2 text-start text-sm marker:font-bold"
                            role="list"
                        >
                            <li>
                                Reassigning each customer's translations to another customer before deletion.
                            </li>
                            <li>
                                The translations associated with the selected customers will be unassigned and
                                will not be deleted.
                            </li>
                            <li>This action cannot be undone.</li>
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
                                const ids: string[] = selectedCustomers
                                    .map((customer) => customer.id ?? null)
                                    .filter((id) => id !== null) as string[];
                                await handleDeleteCustomers(ids ?? []);
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
