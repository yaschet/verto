/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import type { ReactNode } from 'react';
import AppStateProvider from '@components/providers/app-state-provider';

export const dynamic = 'force-dynamic';

export default function ProtectedStateLayout({ children }: { children: ReactNode }) {
    return <AppStateProvider>{children}</AppStateProvider>;
}
