/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import { CheckIcon } from '@phosphor-icons/react';
import { CommandItem, CommandList, CommandEmpty } from '@/components/ui/command';
import { VirtualizedScrollArea } from '@components/ui/virtualized-scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@components/ui/avatar';
import { cn, generateGravatarUrl } from '@/src/library/utils';
import type { RawCustomerRow } from '@/schemas/customer-schemas';

type CustomerListProps = {
    customers: {
        id: RawCustomerRow['id'];
        display_name: RawCustomerRow['display_name'];
        email: RawCustomerRow['email'];
    }[];
    selectedCustomerId: string | null | undefined;
    onSelect: (customerId: string) => void;
    isPending?: boolean;
};

export function VirtualCustomerList({
    customers,
    selectedCustomerId,
    onSelect,
    isPending,
}: CustomerListProps) {
    const parentRef = useRef<HTMLDivElement>(null);

    const rowVirtualizer = useVirtualizer({
        count: customers.length,
        estimateSize: () => 60,
        getScrollElement: () => parentRef.current,
        overscan: 5,
    });

    return (
        <CommandList className="max-h-[300px] overflow-hidden p-0">
            {customers.length === 0 && <CommandEmpty>No customer found.</CommandEmpty>}

            <VirtualizedScrollArea ref={parentRef} className="h-[300px] p-2 pr-4">
                <div
                    style={{
                        height: `${rowVirtualizer.getTotalSize()}px`,
                        position: 'relative',
                        width: '100%',
                    }}
                >
                    {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                        const customer = customers[virtualItem.index];
                        return (
                            <CommandItem
                                key={customer.id}
                                data-index={virtualItem.index}
                                disabled={isPending}
                                ref={rowVirtualizer.measureElement}
                                value={customer.display_name} // Search uses this value
                                onSelect={() => onSelect(customer.id)}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    transform: `translateY(${virtualItem.start}px)`,
                                }}
                            >
                                <div className="flex w-full flex-row items-center justify-between gap-2">
                                    <div className="flex h-full w-auto items-center gap-3">
                                        <div className="flex items-center justify-center">
                                            <Avatar className="size-10">
                                                <AvatarImage
                                                    alt={customer.display_name}
                                                    src={generateGravatarUrl(customer.email)}
                                                />
                                                <AvatarFallback name={customer.display_name} />
                                            </Avatar>
                                        </div>
                                        <div className="flex w-auto flex-col items-start justify-start gap-1">
                                            <span className="text-sm font-bold whitespace-nowrap text-current">
                                                {customer.display_name}
                                            </span>
                                            <span className="text-surface-400 text-xs whitespace-nowrap">
                                                {customer.email}
                                            </span>
                                        </div>
                                    </div>
                                    <CheckIcon
                                        className={cn(
                                            'text-current',
                                            'ml-2 size-5',
                                            selectedCustomerId === customer.id ? 'opacity-100' : 'opacity-0',
                                        )}
                                        color="currentColor"
                                        weight="duotone"
                                    />
                                </div>
                            </CommandItem>
                        );
                    })}
                </div>
            </VirtualizedScrollArea>
        </CommandList>
    );
}
