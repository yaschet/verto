/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import { NotificationItem } from '@/components/layout/core/notification-item';
import { VirtualizedScrollArea } from '@components/ui/virtualized-scroll-area';
import { cn } from '@library/utils';
import type { Notification } from '@/types/notifications';

type NotificationListProps = {
    className?: string;
    notifications: Notification[];
    onArchiveItem?: (id: string) => void;
    onNotificationClick: (notification: Notification) => void;
};

export function NotificationList({
    className,
    notifications,
    onArchiveItem,
    onNotificationClick,
}: NotificationListProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    const rowVirtualizer = useVirtualizer({
        count: notifications.length,
        estimateSize: () => 88, // Estimated height of a notification item
        getScrollElement: () => scrollRef.current,
        overscan: 5,
    });

    return (
        <VirtualizedScrollArea ref={scrollRef} className={cn('h-[350px] p-2 pr-4', className)}>
            <div
                style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    position: 'relative',
                    width: '100%',
                }}
            >
                {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                    const notification = notifications[virtualItem.index];
                    return (
                        <div
                            key={virtualItem.key}
                            data-index={virtualItem.index}
                            ref={rowVirtualizer.measureElement}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                transform: `translateY(${virtualItem.start}px)`,
                            }}
                        >
                            <NotificationItem
                                notification={notification}
                                onArchive={onArchiveItem}
                                onClick={() => onNotificationClick(notification)}
                            />
                        </div>
                    );
                })}
            </div>
        </VirtualizedScrollArea>
    );
}
