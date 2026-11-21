/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { UserPlusIcon } from '@phosphor-icons/react';
import { type JSX } from 'react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { AddCustomerForm } from '@/src/app/(protected)/app/customers/forms/add-customer-form';
import { Button } from '@/src/components/ui/button';
import { useUserData } from '@hooks/queries/auth/use-user-data';
import type { QueryClient } from '@tanstack/react-query';
import type { Dispatch, SetStateAction } from 'react';

/**
 * Update Customer Sheet Component.
 *
 * **Note:** Use this sheet only in a client-side context.
 *
 * @returns {JSX.Element} JSX.Element
 * @export AddCustomerSheet
 */
export default function AddCustomerSheet({
    isAdditionSheetOpen,
    queryClient,
    setIsAdditionSheetOpen,
}: {
    isAdditionSheetOpen: boolean;
    setIsAdditionSheetOpen: Dispatch<SetStateAction<boolean>>;
    queryClient: QueryClient;
}): JSX.Element {
    const { data: userData } = useUserData();
    const { user } = userData ?? {};
    const userId = user?.id ?? '';

    return (
        <Sheet open={isAdditionSheetOpen} onOpenChange={setIsAdditionSheetOpen}>
            <SheetTrigger asChild>
                <Button
                    className="flex items-center justify-center"
                    color="primary"
                    size="md"
                    variant="solid"
                >
                    <UserPlusIcon className="size-5" color="currentColor" weight="duotone" />
                    <span className="hidden font-bold md:block">Add new Customer</span>
                </Button>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Add New Customer</SheetTitle>
                    <SheetDescription>
                        Please complete the form below to add a new customer. This will help you organize and
                        manage your customers' translation projects more efficiently.
                    </SheetDescription>
                </SheetHeader>
                <div className="mt-3 flex w-full flex-col items-center justify-center gap-2">
                    <AddCustomerForm
                        setIsAdditionSheetOpen={setIsAdditionSheetOpen}
                        onCustomerAddition={async () => {
                            await queryClient.invalidateQueries({
                                queryKey: ['paginated-customers', userId],
                            });
                        }}
                    />
                </div>
            </SheetContent>
        </Sheet>
    );
}
