/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { EyeIcon, PencilSimpleIcon, TrashIcon } from '@phosphor-icons/react';
import { capitalCase } from 'change-case';
import Link from 'next/link';
import { TableHeader } from '@/src/app/(protected)/app/components/common';
import { generateGravatarUrl } from '@/src/library/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@components/ui/avatar';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Checkbox } from '@components/ui/checkbox';
import type { CustomerRow } from '@/src/schemas/customer-schemas';
import type { CustomersTableMetaType } from '@/types/core/tanstack';
import type { ColumnDef } from '@tanstack/react-table';

export const CUSTOMER_COLUMNS: ColumnDef<CustomerRow>[] = [
    // Customer Name Column, will display the Customer Avatar, Customer Name, and the Customer ID.
    // It will show the Document Type, the Document ID, and the Icon.
    {
        accessorFn: (row) => String(row.id),
        accessorKey: 'select',
        cell: ({ row }) => (
            <Checkbox
                aria-label="Select row"
                aria-readonly={row.getIsSelected() && !row.getCanSelect()}
                checked={row.getIsSelected()}
                color="primary"
                isDisabled={!row.getCanSelect()}
                isSelected={row.getIsSelected()}
                required={false}
                onValueChange={(value) => row.toggleSelected(!!value)}
            />
        ),
        enableColumnFilter: true,
        enableHiding: false,
        enableSorting: false,
        header: ({ table }) => (
            <Checkbox
                aria-label="Select all"
                checked={table.getIsAllPageRowsSelected()}
                color="primary"
                defaultChecked={table.getIsAllPageRowsSelected()}
                indeterminate={table.getIsSomePageRowsSelected()}
                onValueChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            />
        ),
        id: 'select',
    },
    {
        accessorFn: (row) => String(row.display_name),
        accessorKey: 'display_name',
        cell: ({ row }) => {
            // ? Customer Name is a string, but it can be null.
            let customerName: string = row.original.display_name ?? '';

            // Customer Name will be Capitalized.
            customerName = capitalCase(customerName);

            // Customer Email is a string, but it can be null.
            const customerEmail: string = row.original.email ?? '';

            // ? Customer ID is a string, but it can be null.
            const customerId: string = row.original.id ?? '';

            // ? Customer Avatar is a string, but it can be null.
            const customerAvatar: string = generateGravatarUrl(customerEmail);

            return (
                <div className="flex h-full w-auto items-center gap-3">
                    <Link
                        className="flex items-center justify-center"
                        href={`/app/translations?customer=${customerId}`}
                    >
                        <Button
                            asChild
                            className="cursor-pointer overflow-hidden p-0"
                            color="secondary"
                            variant="plain"
                        >
                            <Avatar className="aspect-square h-auto w-10">
                                <AvatarImage alt={customerName} src={customerAvatar} />
                                <AvatarFallback name={customerName} />
                            </Avatar>
                        </Button>
                    </Link>
                    <div className="flex w-auto flex-col items-start justify-start gap-1">
                        <span className="text-sm font-bold whitespace-nowrap text-current">
                            {customerName}
                        </span>
                        <span className="text-surface-400 text-xs whitespace-nowrap">{customerId}</span>
                    </div>
                </div>
            );
        },
        enableColumnFilter: true,
        header: ({ column }) => {
            return <TableHeader column={column}>Display Name</TableHeader>;
        },
        id: 'display_name',
    },
    {
        accessorKey: 'email',
        cell: (props) => {
            // ? Duration is a number, but it can be null.
            let email: string = props.row.getValue('email') ?? 'NaN';

            // Lowercase the email.
            email = email.toString().toLowerCase();

            return <span className="text-foreground text-sm whitespace-nowrap">{email}</span>;
        },
        enableColumnFilter: true,
        header: ({ column }) => {
            return <TableHeader column={column}>Email</TableHeader>;
        },
        id: 'email',
    },
    {
        accessorKey: 'phone',
        cell: (props) => {
            // ? Phone is a string, but it can be null.
            let phone: string = props.row.getValue('phone') ?? 'NaN';

            // Lowercase the email.
            phone = phone.toString().toLowerCase();

            return <span className="text-foreground text-sm whitespace-nowrap">{phone}</span>;
        },
        enableColumnFilter: true,
        header: ({ column }) => {
            return <TableHeader column={column}>Phone Number</TableHeader>;
        },
        id: 'phone',
    },
    {
        accessorKey: 'number_of_translations',
        cell: (props) => {
            // ? Status is a string, but it can be null.
            const numberOfTranslations: string = props.row.getValue('number_of_translations') ?? 0;

            return (
                <Badge className="text-xs whitespace-nowrap" color="secondary" variant="soft">
                    <b>{numberOfTranslations}</b>
                </Badge>
            );
        },
        enableColumnFilter: true,
        header: ({ column }) => {
            return <TableHeader column={column}>Translations</TableHeader>;
        },
        id: 'number_of_translations',
    },
    // ? Created at.
    {
        accessorKey: 'created_at',
        cell: ({ row }) => {
            // ? Created at is a string, but it can be null.
            const createdDate: string = row.original.created_at ?? new Date().toISOString();
            // Created at will be formatted as a string with the format "Mon 30 Oct 15:23".
            const createdDateFormatted: string = new Date(createdDate).toLocaleString('en-US', {
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                month: 'short',
                weekday: 'short',
            });

            return <span className="text-surface-400 text-sm whitespace-nowrap">{createdDateFormatted}</span>;
        },
        enableColumnFilter: true,
        header: ({ column }) => {
            return <TableHeader column={column}>Created At</TableHeader>;
        },
        id: 'created_at',
    },
    // ? Updated at.
    {
        accessorKey: 'updated_at',
        cell: ({ row }) => {
            // ? Updated at is a string, but it can be null.
            const updatedDate: string =
                row.original.updated_at ?? row.original.created_at ?? new Date().toISOString();
            // Updated at will be formatted as a string with the format "Mon 30 Oct 15:23".
            const updatedDateFormatted: string = new Date(updatedDate).toLocaleString('en-US', {
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                month: 'short',
                weekday: 'short',
            });

            return <span className="text-surface-400 text-sm whitespace-nowrap">{updatedDateFormatted}</span>;
        },
        enableColumnFilter: true,
        header: ({ column }) => {
            return <TableHeader column={column}>Updated At</TableHeader>;
        },
        id: 'updated_at',
    },

    // Actions, shows up the Actions that can be done with the Translation.
    // ? These actions are: View, Edit, and Delete.
    {
        accessorKey: 'actions',
        cell: ({ row, table }) => {
            return (
                <div className="flex h-full w-auto items-stretch justify-end gap-2">
                    <Button
                        asChild
                        color="secondary"
                        size="icon"
                        tooltipContent="View Translations"
                        type="button"
                        variant="soft"
                    >
                        <Link href={`/app/translations?customer=${row.original.id}`}>
                            <EyeIcon className="size-4" color="currentColor" weight="regular" />
                        </Link>
                    </Button>
                    <Button
                        color="secondary"
                        size="icon"
                        title="Edit"
                        type="button"
                        variant="soft"
                        onClick={() => {
                            const meta = table?.options?.meta as CustomersTableMetaType;

                            meta?.triggerCustomerUpdate?.(row.original);
                        }}
                    >
                        <PencilSimpleIcon className="size-4" color="currentColor" weight="regular" />
                    </Button>
                    <Button
                        color="destructive"
                        size="icon"
                        title="Delete"
                        type="button"
                        variant="soft"
                        onClick={() => {
                            const meta = table?.options?.meta as CustomersTableMetaType;

                            meta?.triggerCustomerDeletion?.(row.original);
                        }}
                    >
                        <TrashIcon className="size-4" color="currentColor" weight="regular" />
                    </Button>
                </div>
            );
        },
        enableColumnFilter: false,
        enableGlobalFilter: false,
        enableSorting: false,
        header: () => (
            <div className="flex h-full w-auto items-center justify-start gap-2 text-current">Actions</div>
        ),
        id: 'actions',
    },
];
