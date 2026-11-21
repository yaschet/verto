/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { PrivacyBlurWrapper } from '@components/layout/privacy-blur-wrapper';
import { Logo } from '@components/ui/logo';

export default function LoadingPage() {
    return (
        <div className="bg-background absolute inset-0 z-50 flex size-full min-h-screen items-center justify-center">
            <PrivacyBlurWrapper>
                <Logo variant="icon" mode="auto" size="sm" className="md:hidden" />
                <Logo variant="full" mode="auto" size="md" className="hidden md:block" />
            </PrivacyBlurWrapper>
        </div>
    );
}
