/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import Link from 'next/link';
import { PrivacyBlurWrapper } from '@/components/layout/privacy-blur-wrapper';
import { Logo } from '@components/ui/logo';

export default function Footer() {
    const links: {
        title: string;
        href: string;
    }[] = [
        { href: '/legal/terms-of-service', title: 'Terms' },
        { href: '/legal/privacy-policy', title: 'Privacy' },
        { href: 'mailto:sample@example.com', title: 'Support' },
    ];

    return (
        <div className="bg-surface flex h-auto w-full flex-col flex-wrap items-center justify-center gap-20 px-20 py-10 text-center md:flex-row">
            {/* Logo and Links */}
            <div className="flex size-auto flex-1 flex-col items-center justify-start gap-10 md:flex-row">
                <Link className="flex size-auto items-center justify-start bg-none" href="/">
                    <PrivacyBlurWrapper>
                        <Logo variant="full" mode="auto" priority size="md" />
                    </PrivacyBlurWrapper>
                </Link>
                <div className="text-surface-500 w-auto text-base leading-snug font-normal">
                    @ {new Date().getFullYear()} Verto, Inc. All rights reserved.
                </div>
            </div>

            {/* Other Links */}
            <div className="inline-flex size-auto items-center justify-end gap-6">
                {links.map((link, index) => (
                    <Link key={index} className="flex items-center justify-start gap-2 py-3" href={link.href}>
                        <span className="text-surface-500 hover:text-surface-800 dark:text-surface-300 dark:hover:text-surface-200 text-sm leading-snug font-normal hover:underline">
                            {link.title}
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
