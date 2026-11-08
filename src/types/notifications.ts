/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

export type NotificationType =
    | 'translation_complete'
    | 'translation_failed'
    | 'translation_review'
    | 'credit_low'
    | 'credit_added'
    | 'payment_success'
    | 'payment_failed'
    | 'product_update'
    | 'system_alert';

export type Notification = {
    id: string;
    profile_id: string;
    type: NotificationType;
    title: string;
    message: string;
    link: string | null;
    metadata: Record<string, unknown>;
    read: boolean;
    read_at: string | null;
    created_at: string;
    updated_at: string;
};

export type NotificationFilters = {
    read?: boolean;
    type?: NotificationType;
    search?: string;
};

export type NotificationPagination = {
    limit: number;
    offset: number;
};
