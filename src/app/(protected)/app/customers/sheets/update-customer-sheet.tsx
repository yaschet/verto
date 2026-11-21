/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { type JSX } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { UpdateCustomerForm } from '@/src/app/(protected)/app/customers/forms/update-customer-form';
import { useUserData } from '@hooks/queries/auth/use-user-data';
import type { Tables } from '@/types/database/database';
import type { QueryClient } from '@tanstack/react-query';
import type { Dispatch, SetStateAction } from 'react';

/**
 * Update Customer Sheet Component.
 *
 * **Note:** Use this sheet only in a client-side context.
 *
 * @returns {JSX.Element} Update Customer Sheet Component with a form to update the customer's information.
 * @export UpdateCustomerSheet
 */
export default function UpdateCustomerSheet({
    isUpdateSheetOpen,
    queryClient,
    selectedCustomer,
    setIsUpdateSheetOpen,
    setSelectedCustomer,
}: {
    isUpdateSheetOpen: boolean;
    selectedCustomer: Tables<'extended_customer_view'> | null;
    setSelectedCustomer: Dispatch<SetStateAction<Tables<'extended_customer_view'> | null>>;
    setIsUpdateSheetOpen: Dispatch<SetStateAction<boolean>>;
    queryClient: QueryClient;
}): JSX.Element {
    const { data: userData } = useUserData();
    const { user } = userData ?? {};
    const userId = user?.id ?? '';

    return (
        <Sheet open={isUpdateSheetOpen} onOpenChange={setIsUpdateSheetOpen}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Update Customer</SheetTitle>
                    <SheetDescription>
                        Please complete the form below to update the customer's information. This will help
                        you organize and manage your customers' translation projects more efficiently.
                    </SheetDescription>
                </SheetHeader>
                <div className="mt-3 flex w-full flex-col items-center justify-center gap-2">
                    <UpdateCustomerForm
                        selectedCustomer={selectedCustomer}
                        setIsUpdateSheetOpen={setIsUpdateSheetOpen}
                        onCustomerUpdate={() => {
                            setSelectedCustomer(null);
                            queryClient
                                .invalidateQueries({
                                    queryKey: ['paginated-customers', userId],
                                })
                                .then((r) => r);
                        }}
                    />
                </div>
            </SheetContent>
        </Sheet>
    );
}
