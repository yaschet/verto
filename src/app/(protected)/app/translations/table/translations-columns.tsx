/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import type { TranslationDetails } from '@/types/database/database.extended';
import { TableHeader } from '@/src/app/(protected)/app/components/common';
import {
    ActionsCell,
    CustomerCell,
    DateCell,
    DisplayNameCell,
    GeneratedFileCell,
    OriginalFileCell,
    PageCountCell,
    ProgressCell,
    SelectCell,
    SourceLanguageCell,
    StatusCell,
    TargetLanguageCell,
    CreditsCell,
    AIQualityCell,
} from '@/src/app/(protected)/app/translations/table/translations-cells';
import { Checkbox } from '@components/ui/checkbox';
import type { TranslationRow } from '@/src/schemas/translation-schemas';
import type { ColumnDef } from '@tanstack/react-table';

export const TRANSLATION_COLUMNS: ColumnDef<TranslationRow>[] = [
    {
        accessorFn: (row) => String(row.id),
        accessorKey: 'select',
        cell: SelectCell,
        enableColumnFilter: false,
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
        accessorKey: 'display_name',
        cell: DisplayNameCell,
        enableColumnFilter: true,
        enableGlobalFilter: true,
        enableSorting: true,
        header: ({ column, table }) => {
            return (
                <TableHeader column={column} table={table}>
                    Display Name
                </TableHeader>
            );
        },
        id: 'display_name',
    },
    {
        accessorKey: 'status',
        cell: StatusCell,
        enableColumnFilter: true,
        enableGlobalFilter: true,
        enableSorting: true,
        header: ({ column }) => {
            return <TableHeader column={column}>Status</TableHeader>;
        },
        id: 'status',
    },
    {
        accessorKey: 'progress',
        cell: ProgressCell,
        enableColumnFilter: false,
        enableGlobalFilter: false,
        enableSorting: true,
        header: ({ column }) => {
            return <TableHeader column={column}>Progress</TableHeader>;
        },
        id: 'progress',
    },
    {
        accessorKey: 'customer_name',
        cell: CustomerCell,
        enableColumnFilter: true,
        enableGlobalFilter: true,
        enableSorting: true,
        header: ({ column }) => {
            return <TableHeader column={column}>Customer</TableHeader>;
        },
        id: 'customer_name',
    },
    {
        accessorKey: 'source_language',
        cell: SourceLanguageCell,
        enableColumnFilter: true,
        enableGlobalFilter: true,
        enableSorting: true,
        header: ({ column }) => {
            return <TableHeader column={column}>Source Language</TableHeader>;
        },
        id: 'source_language',
    },
    {
        accessorKey: 'target_language',
        cell: TargetLanguageCell,
        enableColumnFilter: true,
        enableGlobalFilter: true,
        enableSorting: true,
        header: ({ column }) => {
            return <TableHeader column={column}>Target Language</TableHeader>;
        },
        id: 'target_language',
    },
    {
        accessorKey: 'page_count',
        accessorFn: (row) => (row.details as TranslationDetails)?.page_count ?? 0,
        cell: PageCountCell,
        enableColumnFilter: false,
        enableGlobalFilter: false,
        enableSorting: false,
        header: ({ column }) => {
            return <TableHeader column={column}>Pages</TableHeader>;
        },
        id: 'page_count',
    },
    {
        accessorKey: 'credits',
        accessorFn: (row) => (row.details as TranslationDetails)?.page_count ?? 0, // Pseudo-accessor for sorting if needed later
        cell: CreditsCell,
        enableColumnFilter: false,
        enableGlobalFilter: false,
        enableSorting: false,
        header: ({ column }) => {
            return <TableHeader column={column}>Credits</TableHeader>;
        },
        id: 'credits',
    },
    {
        accessorKey: 'ai_quality',
        accessorFn: (row) => (row.details as TranslationDetails)?.ai_audit?.qa?.confidence ?? 0,
        cell: AIQualityCell,
        enableColumnFilter: false,
        enableGlobalFilter: false,
        enableSorting: false,
        header: ({ column }) => {
            return <TableHeader column={column}>Quality</TableHeader>;
        },
        id: 'ai_quality',
    },
    {
        accessorKey: 'generated_file_url',
        cell: GeneratedFileCell,
        enableColumnFilter: false,
        enableGlobalFilter: false,
        enableSorting: false,
        header: ({ column }) => {
            return <TableHeader column={column}>Generated Document</TableHeader>;
        },
        id: 'generated_file_url',
    },
    {
        accessorKey: 'file_url',
        cell: OriginalFileCell,
        enableColumnFilter: false,
        enableGlobalFilter: false,
        enableSorting: false,
        header: ({ column }) => {
            return <TableHeader column={column}>Original File</TableHeader>;
        },
        id: 'file_url',
    },
    {
        accessorKey: 'created_at',
        cell: DateCell,
        enableColumnFilter: true,
        enableGlobalFilter: true,
        enableSorting: true,
        header: ({ column }) => {
            return <TableHeader column={column}>Created</TableHeader>;
        },
        id: 'created_at',
    },
    {
        accessorKey: 'actions',
        cell: ActionsCell,
        enableColumnFilter: false,
        enableGlobalFilter: false,
        enableSorting: false,
        header: ({ column }) => <TableHeader column={column}>Actions</TableHeader>,
        id: 'actions',
    },
];
