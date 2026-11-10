/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import {
    ActionsCell,
    CreditsAddedCell,
    CreditsUsedCell,
    DateCell,
    DescriptionCell,
    TransactionTypeCell,
} from '@app/(protected)/account/billing/components/partials/credits-transactions-cells';
import { TableHeader } from '@app/(protected)/app/components/common';
import type { CreditsTransaction } from '@/types/core/billing';
import type { ColumnDef } from '@tanstack/react-table';

export const CREDITS_TRANSACTIONS_COLUMNS: ColumnDef<CreditsTransaction>[] = [
    {
        id: 'type',
        accessorKey: 'type',
        cell: TransactionTypeCell,
        header: 'Transaction Type',
    },
    {
        id: 'credits-added',
        accessorKey: 'credits-added',
        cell: CreditsAddedCell,
        header: 'Credits Added',
    },
    {
        id: 'credits-used',
        accessorKey: 'credits-used',
        cell: CreditsUsedCell,
        header: 'Credits Used',
    },
    {
        id: 'description',
        accessorKey: 'description',
        cell: DescriptionCell,
        header: 'Description',
    },
    {
        id: 'date',
        accessorKey: 'date',
        cell: DateCell,
        header: 'Date',
    },
    {
        id: 'actions',
        accessorKey: 'actions',
        cell: ActionsCell,
        header: ({ column }) => (
            <TableHeader className="w-full text-end" column={column}>
                Actions
            </TableHeader>
        ),
    },
];
