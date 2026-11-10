/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { UsersIcon } from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { Fragment, useEffect, useState } from 'react';
import { SectionTitle } from '@/src/app/(protected)/app/components/common';
import DeleteCustomerModal from '@/src/app/(protected)/app/customers/modals/delete-customer-modal';
import DeleteMultipleCustomersModal from '@/src/app/(protected)/app/customers/modals/delete-multiple-customers-modal';
import AddCustomerSheet from '@/src/app/(protected)/app/customers/sheets/add-customer-sheet';
import UpdateCustomerSheet from '@/src/app/(protected)/app/customers/sheets/update-customer-sheet';
import { CUSTOMER_COLUMNS } from '@/src/app/(protected)/app/customers/table/customers-columns';
import { CustomersTable } from '@/src/app/(protected)/app/customers/table/customers-table';
import { paginatedCustomersQueryOptions } from '@/src/queries/tanstack/customers-query-options';
import { getQueryClient } from '@/src/queries/tanstack/query-client';
import { DefaultCard } from '@components/ui/card';
import { useUserData } from '@hooks/queries/auth/use-user-data';
import type { CustomerRow } from '@/src/schemas/customer-schemas';
import type { PaginatedResponse } from '@/types/rest/common';
import type { ApiResponseOrError } from '@/types/rest/response';

export default function CustomersPageContent() {
    const searchParams = useSearchParams();
    const queryClient = getQueryClient();
    const { data: userData } = useUserData();
    const { user } = userData ?? {};
    const userId = user?.id ?? '';

    const queryPageIndex: number = searchParams.get('page')
        ? parseInt(searchParams.get('page') as string)
        : 1;
    const queryPageSize: number = searchParams.get('limit')
        ? parseInt(searchParams.get('limit') as string)
        : 10;
    const queryPageFilter: string | null = searchParams.get('keyword') ?? null;
    const queryPageSortBy: keyof CustomerRow | null = searchParams.get('sortby')
        ? (searchParams.get('sortby') as keyof CustomerRow)
        : null;
    const queryPageSortDirection: 'asc' | 'desc' = searchParams.get('direction')
        ? (searchParams.get('direction') as 'asc' | 'desc')
        : 'asc';

    const { data, error, isError, isLoading, isPlaceholderData, isSuccess, refetch } = useQuery<
        ApiResponseOrError<PaginatedResponse<CustomerRow>>,
        ApiResponseOrError<PaginatedResponse<CustomerRow>>,
        PaginatedResponse<CustomerRow>
    >(
        paginatedCustomersQueryOptions({
            userId,
            queryPageFilter,
            queryPageIndex,
            queryPageSize,
            queryPageSortBy,
            queryPageSortDirection,
        }),
    );

    useEffect(() => {
        refetch().then((r) => r);
    }, [refetch, searchParams]);

    const [selectedCustomer, setSelectedCustomer] = useState<CustomerRow | null>(null);
    const [selectedCustomers, setSelectedCustomers] = useState<CustomerRow[]>([]);

    const [isAdditionSheetOpen, setIsAdditionSheetOpen] = useState<boolean>(false);

    const triggerCustomerAddition = () => {
        setIsAdditionSheetOpen(true);
    };

    const [isUpdateSheetOpen, setIsUpdateSheetOpen] = useState<boolean>(false);

    const triggerCustomerUpdate = (customer: CustomerRow) => {
        setSelectedCustomer(customer);
        setIsUpdateSheetOpen(true);
    };

    const [isDeletionModalOpen, setIsDeletionModalOpen] = useState<boolean>(false);
    const triggerCustomerDeletion = (customer: CustomerRow) => {
        setSelectedCustomer(customer);
        setIsDeletionModalOpen(true);
    };

    const [isMultipleDeletionModalOpen, setIsMultipleDeletionModalOpen] = useState<boolean>(false);
    const triggerMultipleCustomersDeletion = (customers: CustomerRow[]) => {
        setSelectedCustomers(customers ?? []);
        setIsMultipleDeletionModalOpen(true);
    };

    return (
        <Fragment>
            {/* Section for Recent Translations, displaying a data table with a limit of 5 rows. */}
            <div className="flex w-full max-w-full flex-col items-start justify-start gap-3">
                {/* Title of the Section */}
                <SectionTitle icon={UsersIcon} title="Customers">
                    <AddCustomerSheet
                        isAdditionSheetOpen={isAdditionSheetOpen}
                        queryClient={queryClient}
                        setIsAdditionSheetOpen={setIsAdditionSheetOpen}
                    />
                </SectionTitle>

                {/* Cards */}
                <div className="relative flex h-auto w-full max-w-full flex-row items-center justify-start gap-4">
                    <DefaultCard>
                        <CustomersTable
                            columns={CUSTOMER_COLUMNS}
                            data={data}
                            error={error}
                            isError={isError}
                            isLoading={isLoading}
                            isPlaceholderData={isPlaceholderData}
                            isSuccess={isSuccess}
                            refetch={refetch}
                            triggerCustomerAddition={triggerCustomerAddition}
                            triggerCustomerDeletion={triggerCustomerDeletion}
                            triggerCustomerUpdate={triggerCustomerUpdate}
                            triggerMultipleCustomersDeletion={triggerMultipleCustomersDeletion}
                        />
                    </DefaultCard>
                    <UpdateCustomerSheet
                        isUpdateSheetOpen={isUpdateSheetOpen}
                        queryClient={queryClient}
                        selectedCustomer={selectedCustomer}
                        setIsUpdateSheetOpen={setIsUpdateSheetOpen}
                        setSelectedCustomer={setSelectedCustomer}
                    />
                    <DeleteCustomerModal
                        isDeletionModalOpen={isDeletionModalOpen}
                        queryClient={queryClient}
                        selectedCustomer={selectedCustomer}
                        setIsDeletionModalOpen={setIsDeletionModalOpen}
                        setSelectedCustomer={setSelectedCustomer}
                    />
                    <DeleteMultipleCustomersModal
                        isMultipleDeletionModalOpen={isMultipleDeletionModalOpen}
                        queryClient={queryClient}
                        selectedCustomers={selectedCustomers}
                        setIsMultipleDeletionModalOpen={setIsMultipleDeletionModalOpen}
                        setSelectedCustomers={setSelectedCustomers}
                    />
                </div>
            </div>
        </Fragment>
    );
}
