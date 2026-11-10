/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import React from 'react';
import { DotPattern, SolidColor, StripePattern } from '@components/common/chart-patterns';
import type { CreditsTransactionType } from '@/types/core/billing';

type CreditTransactionsPatternIconProps = {
    type: CreditsTransactionType;
    color: string;
    strokeDasharray?: string;
    patternId?: string;
};

export function CreditTransactionsPatternIcon({
    color,
    patternId,
    strokeDasharray,
    type,
}: CreditTransactionsPatternIconProps) {
    const patterns: Record<
        CreditsTransactionType,
        React.FC<{ color: string; strokeDasharray?: string; patternId?: string }>
    > = {
        refund: StripePattern,
        bonus: DotPattern,
        consumption: SolidColor,
        purchase: SolidColor,
        penalty: SolidColor,
    };

    const PatternComponent = patterns[type] || SolidColor;
    return <PatternComponent color={color} patternId={patternId} strokeDasharray={strokeDasharray} />;
}

export default CreditTransactionsPatternIcon;
