/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import Link from 'next/link';

export default function MinimalFooter() {
    const links: {
        title: string;
        href: string;
    }[] = [
        { href: '/legal/terms-of-service', title: 'Terms' },
        { href: '/legal/privacy-policy', title: 'Privacy' },
        { href: 'mailto:sample@example.com', title: 'Support' },
    ];

    return (
        <div className="inline-flex size-auto items-center justify-center gap-5">
            {links.map((link, index) => (
                <Link key={index} className="flex items-center justify-start gap-2 py-3" href={link.href}>
                    <span className="text-surface-500 hover:text-surface-800 dark:text-surface-300 dark:hover:text-surface-200 text-sm leading-snug font-normal hover:underline">
                        {link.title}
                    </span>
                </Link>
            ))}
        </div>
    );
}
