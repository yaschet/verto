/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import AccountPageContent from '@app/(protected)/account/account-page';
import AccountLayout from '@app/(protected)/account/layout/account-layout';

export default function AccountPage() {
    return (
        <AccountLayout>
            <AccountPageContent />
        </AccountLayout>
    );
}
