/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import React from 'react';
import { DotPattern, SolidColor, StripePattern } from '@components/common/chart-patterns';
import type { UserActivityType } from '@actions/admin/analytics/statistics/get-user-activity-reports';

type UserActivityPatternIconProps = {
    type: UserActivityType;
    color: string;
    strokeDasharray?: string;
    patternId?: string;
};

export function UserActivityPatternIcon({
    color,
    patternId,
    strokeDasharray,
    type,
}: UserActivityPatternIconProps) {
    const patterns: Record<
        UserActivityType,
        React.FC<{ color: string; strokeDasharray?: string; patternId?: string }>
    > = {
        sign_in: DotPattern,
        sign_out: SolidColor,
        heartbeat: StripePattern,
        enabled_mfa: StripePattern,
        disabled_mfa: StripePattern,
        changed_email: DotPattern,
        changed_password: DotPattern,
        closed_account: SolidColor,
        updated_profile: SolidColor,
        created_customer: StripePattern,
        updated_customer: StripePattern,
        deleted_customer: DotPattern,
        created_translation: StripePattern,
        deleted_translation: DotPattern,
        assigned_customer_to_translation: SolidColor,
        initiated_checkout: DotPattern,
        completed_checkout: SolidColor,
        failed_checkout: DotPattern,
        opened_billing_portal: StripePattern,
        customer_deleted: DotPattern,
        accessed_signed_url: StripePattern,
    };

    const PatternComponent = patterns[type] || SolidColor;
    return <PatternComponent color={color} patternId={patternId} strokeDasharray={strokeDasharray} />;
}

export default UserActivityPatternIcon;
