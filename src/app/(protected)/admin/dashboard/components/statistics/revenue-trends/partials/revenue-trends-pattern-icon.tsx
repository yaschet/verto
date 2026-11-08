/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import React from 'react';
import { DotPattern, SolidColor, StripePattern } from '@components/common/chart-patterns';
import type { RevenueTrendType } from '@actions/admin/analytics/statistics/get-revenue-trends';

type PatternIconProps = {
    type: RevenueTrendType;
    color: string;
    strokeDasharray?: string;
    patternId?: string;
};

export function RevenueTrendsPatternIcon({ color, patternId, strokeDasharray, type }: PatternIconProps) {
    const patterns: Record<
        RevenueTrendType,
        React.FC<{ color: string; strokeDasharray?: string; patternId?: string }>
    > = {
        adjustment: DotPattern,
        charge: SolidColor,
        payment: SolidColor,
        refund: StripePattern,
        payout: SolidColor,
        topup: SolidColor,
        stripe_fee: SolidColor,
    };

    const PatternComponent = patterns[type] || SolidColor;
    return <PatternComponent color={color} patternId={patternId} strokeDasharray={strokeDasharray} />;
}

export default RevenueTrendsPatternIcon;
