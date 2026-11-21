/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { useZodResolver } from '@/src/hooks/use-zod-resolver';
import { ShieldCheckIcon, UserCirclePlusIcon, WarningIcon } from '@phosphor-icons/react';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';
import { addCustomer } from '@/src/actions/services/customers/add-customer';
import Alert, { AlertDescription, AlertIcon, AlertTitle } from '@/src/components/ui/alert';
import { FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/src/components/ui/form';
import { Input } from '@/src/components/ui/input';
import Spinner from '@/src/components/ui/spinner';
import { Button } from '@components/ui/button';
import type { ApiErrorType } from '@/types/rest/errors';
import type { Dispatch, SetStateAction } from 'react';

export function AddCustomerForm({
    onCustomerAddition,
    setIsAdditionSheetOpen,
}: {
    setIsAdditionSheetOpen: Dispatch<SetStateAction<boolean>>;
    onCustomerAddition: () => Promise<void>;
}) {
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
        display_name: z.string().min(3, { message: 'Please enter a valid display name.' }),
        email: z.string().email({ message: 'Please enter a valid email address.' }),
        phone: z.string().min(10, { message: 'Please enter a valid phone number.' }).optional(),
    });

    const formMethods = useForm<z.infer<typeof zodSchema>>({
        defaultValues: {
            display_name: '',
            email: '',
            phone: '',
        },
        mode: 'onSubmit',
        resolver: useZodResolver(zodSchema),
    });

    const {
        control,
        formState: { errors },
        handleSubmit,
    } = formMethods;

    const { isPending, mutateAsync } = useMutation({
        mutationFn: async ({ display_name, email, phone }: z.infer<typeof zodSchema>) => {
            const response = await addCustomer({
                display_name,
                email,
                phone,
            });

            if (response?.error || !response) {
                throw response;
            }

            return response;
        },
        onError: (error: (Error & Partial<ApiErrorType>) | ApiErrorType) => {
            setErrorAlert({
                description: error?.description ?? 'An error occurred while adding the customer.',
                error: true,
                message: error?.title ?? error?.message ?? 'Failed to add customer.',
                title: error?.title ?? 'Failed to Add Customer',
            });
        },
        onSuccess: async (response) => {
            setSuccessAlert({
                description:
                    response?.description ?? 'The customer has been added successfully to the database.',
                message: response?.message ?? 'Customer added.',
                success: true,
                title: response?.title ?? 'Customer Added',
            });
            await onCustomerAddition();
            setTimeout(() => {
                setIsAdditionSheetOpen(false);
            }, 1000);
        },
        retry: 3,
        retryDelay: (attempt) => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000),
    });

    return (
        <FormProvider {...formMethods}>
            <form
                className="flex w-full flex-col items-center justify-center gap-5"
                onSubmit={handleSubmit(async (data) => {
                    return mutateAsync(data);
                })}
            >
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
                        <ShieldCheckIcon className="size-5" color="currentColor" weight="duotone" />
                    </AlertIcon>
                    <AlertTitle>{successAlert?.message}</AlertTitle>
                    <AlertDescription>{successAlert?.description}</AlertDescription>
                </Alert>

                <div className="flex w-full flex-col items-start justify-start gap-2">
                    {/* Form Fields */}
                    <FormField
                        control={control}
                        name="display_name"
                        render={({ field }) => {
                            return (
                                <FormItem className="w-full">
                                    <FormLabel
                                        className="text-foreground text-sm font-medium"
                                        htmlFor="display_name"
                                    >
                                        Display Name
                                    </FormLabel>
                                    <div className="w-full">
                                        <Input
                                            autoComplete="name"
                                            autoFocus={true}
                                            hasError={!!errors.display_name?.message}
                                            id="display_name"
                                            placeholder="John Doe"
                                            type="text"
                                            {...field}
                                        />
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            );
                        }}
                    />
                    <FormField
                        control={control}
                        name="email"
                        render={({ field }) => {
                            return (
                                <FormItem className="w-full">
                                    <FormLabel
                                        className="text-foreground text-sm font-medium"
                                        htmlFor="current_password"
                                    >
                                        Email
                                    </FormLabel>
                                    <div className="w-full">
                                        <Input
                                            autoComplete="email"
                                            autoFocus={false}
                                            hasError={!!errors.email?.message}
                                            id="email"
                                            placeholder="customer@example.com"
                                            type="email"
                                            {...field}
                                        />
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            );
                        }}
                    />
                    <FormField
                        control={control}
                        name="phone"
                        render={({ field }) => {
                            return (
                                <FormItem className="w-full">
                                    <FormLabel
                                        className="text-foreground text-sm font-medium"
                                        htmlFor="phone"
                                    >
                                        Phone
                                    </FormLabel>
                                    <div className="w-full">
                                        <Input
                                            autoComplete="tel"
                                            autoFocus={false}
                                            hasError={!!errors.phone?.message}
                                            id="phone"
                                            placeholder="+1 2 34 56 78 90"
                                            type="tel"
                                            {...field}
                                        />
                                    </div>
                                    <FormMessage />
                                    <FormDescription>
                                        Please enter a valid phone number, including the country code.
                                    </FormDescription>
                                </FormItem>
                            );
                        }}
                    />
                    <div className="mt-2 flex w-full flex-row items-stretch justify-end gap-2">
                        {isPending ? (
                            <Button
                                className="w-full"
                                color="primary"
                                disabled={true}
                                shape="rounded"
                                size="lg"
                                type="button"
                                variant="solid"
                            >
                                <div role="status">
                                    <Spinner className="size-5 text-current" />
                                    <span className="sr-only">Loading</span>
                                </div>
                                Adding Customer
                            </Button>
                        ) : (
                            <Button
                                className="w-full"
                                color="primary"
                                shape="rounded"
                                size="lg"
                                type="submit"
                                variant="solid"
                            >
                                <UserCirclePlusIcon
                                    className="size-5"
                                    color="currentColor"
                                    weight="duotone"
                                />
                                Add Customer
                            </Button>
                        )}
                    </div>
                </div>
            </form>
        </FormProvider>
    );
}
