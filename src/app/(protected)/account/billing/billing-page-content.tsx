/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import BillingInfoPanel from '@app/(protected)/account/billing/components/billing-info-panel';
import TransactionHistoryPanel from '@app/(protected)/account/billing/components/transaction-history-panel';

export default function BillingPageContent() {
    return (
        <div className="flex w-full max-w-screen-lg flex-col gap-6 py-6">
            <ul className="flex w-full flex-col items-start justify-start gap-12">
                <BillingInfoPanel />
                <TransactionHistoryPanel />
            </ul>
        </div>
    );
}
