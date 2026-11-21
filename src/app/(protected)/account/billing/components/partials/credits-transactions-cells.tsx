/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import {
    ArrowUUpLeftIcon,
    CoffeeIcon,
    DotsThreeIcon,
    ExclamationMarkIcon,
    GiftIcon,
    type Icon,
    InvoiceIcon,
    ReceiptIcon,
    ShoppingCartIcon,
    TranslateIcon,
} from '@phosphor-icons/react';
import Link from 'next/link';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@components/ui/dropdown-menu';
import { cn } from '@library/utils';
import type { CreditsTransaction, CreditsTransactionType } from '@/types/core/billing';
import type { BadgeProps } from '@components/ui/badge';
import type { CheckboxProps } from '@components/ui/checkbox';
import type { CellContext } from '@tanstack/react-table';

export const TRANSACTION_TYPES: Record<
    CreditsTransactionType,
    {
        color: BadgeProps['color'];
        icon: Icon;
        text: string;
        variant: BadgeProps['variant'];
        key: 'bonus' | 'consumption' | 'penalty' | 'purchase' | 'refund';
        checkboxColor: CheckboxProps['color'];
    }
> = {
    bonus: {
        color: 'success',
        checkboxColor: 'success',
        icon: GiftIcon,
        text: 'Bonus',
        key: 'bonus',
        variant: 'plain',
    },
    consumption: {
        color: 'primary',
        icon: CoffeeIcon,
        text: 'Consumption',
        key: 'consumption',
        variant: 'plain',
        checkboxColor: 'default',
    },
    penalty: {
        color: 'destructive',
        icon: ExclamationMarkIcon,
        text: 'Penalty',
        key: 'penalty',
        variant: 'plain',
        checkboxColor: 'destructive',
    },
    purchase: {
        color: 'success',
        icon: ShoppingCartIcon,
        text: 'Purchase',
        key: 'purchase',
        variant: 'plain',
        checkboxColor: 'success',
    },
    refund: {
        color: 'warning',
        icon: ArrowUUpLeftIcon,
        text: 'Refund',
        key: 'refund',
        variant: 'plain',
        checkboxColor: 'warning',
    },
};

export function TransactionTypeCell({ row }: CellContext<CreditsTransaction, unknown>) {
    const transactionType = TRANSACTION_TYPES[row.original.type ?? 'purchase'];
    const TypeIcon = transactionType.icon;

    return (
        <Badge className="gap-1" color={transactionType.color} size="lg" variant={transactionType.variant}>
            <TypeIcon className="size-5" color="currentColor" weight="duotone" />
            <span>{transactionType.text}</span>
        </Badge>
    );
}

export function CreditsAddedCell({ row }: CellContext<CreditsTransaction, unknown>) {
    const creditsAdded = row.original.credits;
    const isAdded = row.original.type === 'purchase' || row.original.type === 'bonus';

    return <strong>{isAdded ? `${creditsAdded}` : `-`}</strong>;
}

export function CreditsUsedCell({ row }: CellContext<CreditsTransaction, unknown>) {
    const creditsUsed = row.original.credits;
    const isUsed =
        row.original.type === 'consumption' ||
        row.original.type === 'penalty' ||
        row.original.type === 'refund';

    return <strong>{isUsed ? `${creditsUsed}` : `-`}</strong>;
}

export function DescriptionCell({ row }: CellContext<CreditsTransaction, unknown>) {
    return <i>{row.original.description}</i>;
}

export function DateCell({ row }: CellContext<CreditsTransaction, unknown>) {
    const createdDate: string = row.original.created_at ?? new Date().toISOString();
    const createdDateFormatted: string = new Date(createdDate).toLocaleString('en-US', {
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        month: 'short',
        weekday: 'short',
    });

    return <span className="text-muted text-sm whitespace-nowrap">{createdDateFormatted}</span>;
}

export function ActionsCell({ row }: CellContext<CreditsTransaction, unknown>) {
    type TransactionActions = 'invoice' | 'receipt' | 'refund' | 'translation';

    // Utility function to determine available actions
    const getAvailableActions = (transaction: CreditsTransaction): TransactionActions[] => {
        const { details, type } = transaction;
        const actions: TransactionActions[] = [];

        if (type === 'purchase') {
            if (details?.invoice_link) actions.push('invoice');
            if (details?.receipt_link) actions.push('receipt');
        } else if (type === 'refund') {
            actions.push('receipt');
        } else if (type === 'consumption') {
            actions.push('translation');
        }

        return actions;
    };

    // Deriving actions directly from row data
    const availableActions = getAvailableActions(row.original);

    // Mapping each action to its corresponding icon and label
    const actionConfig = {
        invoice: {
            icon: InvoiceIcon,
            label: 'View Invoice',
            link: row.original.details?.invoice_link ?? '',
            linkType: 'external',
        },
        receipt: {
            icon: ReceiptIcon,
            label: 'View Receipt',
            link: row.original.details?.receipt_link ?? '',
            linkType: 'external',
        },
        refund: {
            icon: ReceiptIcon,
            label: 'Refund Transaction', // Replace with a proper refund icon if needed
            link: '', // No link for refund action, assuming it's handled separately
            linkType: 'internal',
        },
        translation: {
            icon: TranslateIcon,
            label: 'View Translation', // Replace with a proper translation icon if needed
            link: `/app/translations/${row.original.translation_id ?? ''}`,
            linkType: 'internal',
        },
    };

    return (
        <div className="flex items-stretch justify-end gap-2">
            {availableActions.length > 0 && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            aria-label="More Actions"
                            className={cn('flex h-auto items-center justify-center gap-1')}
                            color="default"
                            size="icon-sm"
                            variant="soft"
                        >
                            <DotsThreeIcon className="size-5" color="currentColor" weight="bold" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-auto">
                        <DropdownMenuGroup>
                            {availableActions.map((action) => {
                                const { icon: ActionIcon, label, link, linkType } = actionConfig[action];

                                return (
                                    <Link
                                        key={action}
                                        href={link}
                                        rel={linkType === 'external' ? 'noopener noreferrer' : undefined}
                                        target={linkType === 'external' ? '_blank' : undefined}
                                    >
                                        <DropdownMenuItem onClick={() => console.log(action)}>
                                            <div className="flex items-center gap-2">
                                                <ActionIcon
                                                    className="size-5"
                                                    color="currentColor"
                                                    weight="duotone"
                                                />
                                                <span>{label}</span>
                                            </div>
                                        </DropdownMenuItem>
                                    </Link>
                                );
                            })}
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );
}
