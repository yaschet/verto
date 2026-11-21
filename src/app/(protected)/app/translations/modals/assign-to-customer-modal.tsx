/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { zodResolver } from '@hookform/resolvers/zod';
import {
    ArrowsCounterClockwiseIcon,
    CaretUpDownIcon,
    CheckIcon,
    CloudXIcon,
    UserCircleMinusIcon,
    UserCirclePlusIcon,
    UserSwitchIcon,
    WarningIcon,
    XIcon,
} from '@phosphor-icons/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState, useEffect, Fragment, type JSX } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';
import { assignTranslationToCustomer } from '@/src/actions/services/translations/assign-customer';
import { VirtualCustomerList } from '@/app/(protected)/app/translations/modals/customer-list';
import Alert, { AlertDescription, AlertIcon, AlertTitle } from '@/src/components/ui/alert';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/src/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar';
import { Command, CommandInput } from '@/src/components/ui/command';
import { FormField, FormItem, FormLabel, FormMessage } from '@/src/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover';
import { generateGravatarUrl } from '@/src/library/utils';
import { getQueryClient } from '@/src/queries/tanstack/query-client';
import { Button } from '@components/ui/button';
import { useUserData } from '@hooks/queries/auth/use-user-data';
import { assignableCustomersQueryOptions } from '@queries/tanstack/translations-query-options';
import type { RawCustomerRow } from '@/schemas/customer-schemas';
import type { TranslationRow } from '@/src/schemas/translation-schemas';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';
import type { Dispatch, SetStateAction } from 'react';

/**
 * Delete Translation Modal Component.
 *
 * **Note:** Use this modal only in a client-side context.
 *
 * @param {{
 *     isAssignmentModalOpen: boolean;
 *     selectedTranslation: Tables<'translation_with_translation_counts'> | null;
 *     setIsAssignmentModalOpen: Dispatch<SetStateAction<boolean>>;
 *     setSelectedTranslation: Dispatch<SetStateAction<Tables<'translation_with_translation_counts'> | null>>;
 * }} {
 *   IsDeletionModalOpen, selectedTranslation, setIsAssignmentModalOpen, queryClient,
 *
 *   }
 * @returns {JSX.Element}
 * @export
 */
export default function AssignToCustomerModal({
    isAssignmentModalOpen,
    selectedTranslation,
    setIsAssignmentModalOpen,
    setSelectedTranslation,
}: {
    isAssignmentModalOpen: boolean;
    selectedTranslation: TranslationRow | null;
    setSelectedTranslation: Dispatch<SetStateAction<TranslationRow | null>>;
    setIsAssignmentModalOpen: Dispatch<SetStateAction<boolean>>;
}): JSX.Element {
    const queryClient = getQueryClient();
    const { data: userData } = useUserData();
    const { user } = userData ?? {};
    const userId = user?.id ?? '';

    const {
        data: CustomersList,
        error: customersListError,
        isError: isCustomersListError,
        isLoading: isCustomersListLoading,
        isSuccess: isCustomersListSuccess,
        refetch: refetchCustomersList,
    } = useQuery<
        ApiResponseOrError<
            {
                id: RawCustomerRow['id'];
                display_name: RawCustomerRow['display_name'];
                email: RawCustomerRow['email'];
            }[]
        >,
        ApiErrorType,
        {
            id: RawCustomerRow['id'];
            display_name: RawCustomerRow['display_name'];
            email: RawCustomerRow['email'];
        }[]
    >(
        assignableCustomersQueryOptions(userId, {
            enabled: isAssignmentModalOpen,
        }),
    );

    useEffect(() => {
        if (isCustomersListError) {
            setErrorAlert({
                description: customersListError?.description ?? 'An error occurred while fetching customers.',
                error: true,
                message: customersListError?.message ?? 'Error Fetching Customers',
                title: customersListError?.title ?? 'Error Fetching Customers',
            });
        }
    }, [customersListError, isCustomersListError]);

    const [errorAlert, setErrorAlert] = useState<{
        error: boolean;
        title?: string;
        message: string;
        description: string;
    } | null>();

    const [successAlert, setSuccessAlert] = useState<{
        success: boolean;
        title?: string;
        message: string;
        description: string;
    } | null>();

    // * - Customer Form Schema:
    const zodSchema = z.object({
        customerId: z
            .string({
                message: 'Please select a valid customer to assign the translation to.',
            })
            .uuid({
                message: 'Please select a valid customer to assign the translation to.',
            })
            .nullable()
            .optional(),
    });

    const formMethods = useForm<z.infer<typeof zodSchema>>({
        defaultValues: {
            customerId: selectedTranslation?.customer_id ?? null,
        },
        mode: 'onSubmit',
        resolver: zodResolver(zodSchema),
    });

    const { control, handleSubmit, setValue, watch } = formMethods;

    useEffect(() => {
        formMethods.reset({
            customerId: selectedTranslation?.customer_id ?? '',
        });
        setErrorAlert(null);
        setSuccessAlert(null);
    }, [formMethods, isAssignmentModalOpen, selectedTranslation]);

    const [isUnassigning, setIsUnassigning] = useState(false);
    const [isReassigning, setIsReassigning] = useState(false);

    const watchedCustomerId: string | null | undefined = watch('customerId');

    const [search, setSearch] = useState('');
    const filteredCustomers =
        CustomersList?.filter((customer) =>
            customer.display_name.toLowerCase().includes(search.toLowerCase()),
        ) ?? [];

    useEffect(() => {
        if (selectedTranslation?.customer_id && !watchedCustomerId) {
            setIsUnassigning(true);
        } else {
            setIsUnassigning(false);
        }

        if (
            selectedTranslation?.customer_id &&
            watchedCustomerId &&
            watchedCustomerId !== selectedTranslation?.customer_id
        ) {
            setIsReassigning(true);
            setIsUnassigning(false);
        } else {
            setIsReassigning(false);
        }
    }, [selectedTranslation, watchedCustomerId]);

    const { isPending, mutateAsync } = useMutation({
        mutationFn: async ({ customerId }: z.infer<typeof zodSchema>) => {
            const response = await assignTranslationToCustomer({
                customerId: customerId ?? null,
                translationId: selectedTranslation?.id ?? null,
            });

            if (response?.error || !response) {
                throw response;
            }

            return response;
        },
        onError: () => {
            setErrorAlert({
                description: isUnassigning
                    ? 'An error occurred while unassigning the translation from the customer.'
                    : isReassigning
                      ? 'An error occurred while reassigning the customer assignment.'
                      : 'An error occurred while assigning the translation to the customer.',
                error: true,
                message: isUnassigning ? 'Error Unassigning Translation' : 'Error Assigning Translation',
                title: isUnassigning ? 'Error Unassigning Translation' : 'Error Assigning Translation',
            });
        },
        onSuccess: async () => {
            setIsAssignmentModalOpen(false);
            setSelectedTranslation(null);
            await queryClient.invalidateQueries({
                queryKey: ['paginated-translations', userId],
            });
            setSuccessAlert({
                description: isUnassigning
                    ? 'The translation has been successfully unassigned from the customer.'
                    : isReassigning
                      ? 'The customer assignment has been successfully reassigned.'
                      : 'The translation has been successfully assigned to the customer.',
                message: isUnassigning
                    ? 'Translation Unassigned Successfully'
                    : isReassigning
                      ? 'Customer Reassigned Successfully'
                      : 'Translation Assigned Successfully',
                success: true,
                title: isUnassigning
                    ? 'Translation Unassigned Successfully'
                    : isReassigning
                      ? 'Customer Reassigned Successfully'
                      : 'Translation Assigned Successfully',
            });
        },
        retry: 3,
        retryDelay: (attempt) => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000),
    });

    const title = isUnassigning
        ? 'Unassign Translation from Customer'
        : isReassigning
          ? 'Reassign Customer'
          : 'Assign Translation to Customer';

    const description = isUnassigning
        ? 'Are you sure you want to unassign the translation from the currently assigned customer?'
        : isReassigning
          ? 'Please select a new customer to reassign the translation.'
          : 'Please select a customer to assign the translation to.';

    return (
        <AlertDialog open={isAssignmentModalOpen} onOpenChange={setIsAssignmentModalOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>

                {/* ! - Alert Section: */}
                <Alert
                    withCloseButton
                    className="w-full"
                    show={errorAlert?.error === true}
                    variant="destructive"
                    onClose={() => {
                        setErrorAlert(null);
                    }}
                >
                    <AlertIcon>
                        <WarningIcon className="size-5" color="currentColor" weight="duotone" />
                    </AlertIcon>
                    <AlertTitle>{errorAlert?.message}</AlertTitle>
                    <AlertDescription>{errorAlert?.description}</AlertDescription>
                </Alert>

                <Alert
                    withCloseButton
                    className="w-full"
                    show={successAlert?.success === true}
                    variant="success"
                    onClose={() => {
                        setSuccessAlert(null);
                    }}
                >
                    <AlertIcon>
                        <CheckIcon className="size-5" color="currentColor" weight="duotone" />
                    </AlertIcon>
                    <AlertTitle>{successAlert?.message}</AlertTitle>
                    <AlertDescription>{successAlert?.description}</AlertDescription>
                </Alert>

                <div className="text-foreground dark:text-foreground-500 text-start text-sm">
                    <FormProvider {...formMethods}>
                        <form
                            className="flex w-full flex-col items-center justify-center gap-5"
                            onSubmit={handleSubmit(async (data) => {
                                return mutateAsync(data);
                            })}
                        >
                            <FormField
                                control={control}
                                name="customerId"
                                render={({ field }) => (
                                    <FormItem className="flex w-full flex-col gap-1 py-4">
                                        <FormLabel>Select Customer</FormLabel>
                                        {/* ! - Popover Section: */}
                                        {isCustomersListLoading && (
                                            <div className="flex w-full items-center justify-center gap-2">
                                                <Button
                                                    disabled
                                                    loading
                                                    className="w-full items-center justify-center"
                                                    color="default"
                                                    role="combobox"
                                                    size="lg"
                                                    variant="soft"
                                                >
                                                    Loading Customers
                                                </Button>
                                            </div>
                                        )}
                                        {isCustomersListError && (
                                            <div className="flex w-full items-center justify-center gap-2">
                                                <Button
                                                    disabled
                                                    className="w-full items-center justify-center"
                                                    color="default"
                                                    role="combobox"
                                                    size="lg"
                                                    variant="soft"
                                                >
                                                    <CloudXIcon className="size-5" color="currentColor" />
                                                    Customer Selection Unavailable
                                                </Button>
                                            </div>
                                        )}
                                        {!isCustomersListLoading && isCustomersListSuccess && (
                                            <Popover>
                                                <div className="flex w-full flex-row items-center justify-between gap-2 text-foreground">
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            className="w-full items-center justify-between"
                                                            color="default"
                                                            role="combobox"
                                                            size="lg"
                                                            variant="soft"
                                                        >
                                                            {field.value
                                                                ? (CustomersList?.find(
                                                                      (customer) =>
                                                                          customer.id === field.value,
                                                                  )?.display_name ?? 'Select a Customer')
                                                                : 'Select a Customer'}
                                                            <CaretUpDownIcon
                                                                className="ml-2 size-5 shrink-0 opacity-50"
                                                                color="currentColor"
                                                                weight="duotone"
                                                            />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    {field.value && (
                                                        <div className="flex h-auto w-auto items-center justify-center gap-2">
                                                            <Avatar className="size-10">
                                                                <AvatarImage
                                                                    alt={
                                                                        CustomersList?.find(
                                                                            (customer) =>
                                                                                customer.id === field.value,
                                                                        )?.display_name ?? 'No Customer'
                                                                    }
                                                                    src={
                                                                        generateGravatarUrl(
                                                                            CustomersList?.find(
                                                                                (customer) =>
                                                                                    customer.id ===
                                                                                    field.value,
                                                                            )?.email ?? '',
                                                                        ) ?? ''
                                                                    }
                                                                />
                                                                <AvatarFallback
                                                                    name={
                                                                        CustomersList?.find(
                                                                            (customer) =>
                                                                                customer.id === field.value,
                                                                        )?.display_name
                                                                    }
                                                                />
                                                            </Avatar>
                                                            <Button
                                                                color="default"
                                                                size="icon-lg"
                                                                tooltipContent="Unselect Customer"
                                                                variant="soft"
                                                                onClick={() => {
                                                                    setValue('customerId', null);
                                                                }}
                                                            >
                                                                <UserCircleMinusIcon
                                                                    className="size-5"
                                                                    color="currentColor"
                                                                    weight="duotone"
                                                                />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                                <PopoverContent
                                                    align="start"
                                                    className="p-0 rounded-3xl"
                                                    style={{ width: 'var(--radix-popover-trigger-width)' }}
                                                    onOpenAutoFocus={(e) => e.preventDefault()}
                                                >
                                                    <Command shouldFilter={false}>
                                                        <CommandInput
                                                            placeholder="Search customers..."
                                                            value={search}
                                                            onValueChange={setSearch}
                                                        />
                                                        <VirtualCustomerList
                                                            customers={filteredCustomers}
                                                            selectedCustomerId={field.value}
                                                            onSelect={(customerId) => {
                                                                setValue('customerId', customerId);
                                                            }}
                                                            isPending={isPending}
                                                        />
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        )}
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </form>
                    </FormProvider>
                </div>
                <AlertDialogFooter>
                    <Button color="default" variant="soft" onClick={() => setIsAssignmentModalOpen(false)}>
                        <XIcon className="size-4" color="currentColor" weight="duotone" />
                        Cancel
                    </Button>
                    {isCustomersListSuccess && !isCustomersListLoading && !isPending && (
                        <Button
                            color="primary"
                            variant="solid"
                            onClick={() => {
                                handleSubmit(async (data) => {
                                    return mutateAsync(data);
                                })();
                            }}
                        >
                            {isUnassigning ? (
                                <Fragment>
                                    <UserCircleMinusIcon className="size-4" color="currentColor" />
                                    <span>Unassign</span>
                                </Fragment>
                            ) : isReassigning ? (
                                <Fragment>
                                    <UserSwitchIcon className="size-4" color="currentColor" />
                                    <span>Reassign</span>
                                </Fragment>
                            ) : (
                                <Fragment>
                                    <UserCirclePlusIcon className="size-4" color="currentColor" />
                                    <span>Assign</span>
                                </Fragment>
                            )}
                        </Button>
                    )}
                    {isCustomersListError && (
                        <Button
                            disabled
                            color="primary"
                            variant="solid"
                            onClick={() => refetchCustomersList()}
                        >
                            <ArrowsCounterClockwiseIcon className="size-4" color="currentColor" />
                            Retry
                        </Button>
                    )}
                    {isPending && (
                        <Button disabled loading color="primary" variant="solid">
                            {isUnassigning ? (
                                <span>Unassigning</span>
                            ) : isReassigning ? (
                                <span>Reassigning</span>
                            ) : (
                                <span>Assigning</span>
                            )}
                        </Button>
                    )}
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
