/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import type { ReactNode } from 'react';

/** Keeps the branding layout boundary shared by the application shells. */
export function PrivacyBlurWrapper({ children }: { children: ReactNode; className?: string }) {
    return <>{children}</>;
}
