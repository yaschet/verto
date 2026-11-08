/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import AccountLayout from '@app/(protected)/account/layout/account-layout';
import type { ReactNode } from 'react';

export default async function AccountLayoutWrapper({ children }: { children: ReactNode }) {
    return <AccountLayout>{children}</AccountLayout>;
}
