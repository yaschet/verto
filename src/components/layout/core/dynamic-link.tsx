/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { SpinnerIcon } from '@phosphor-icons/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@components/ui/button';
import type { ButtonProps } from '@components/ui/button';
import type { Icon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';

function DynamicLink({ href, icon, title }: { title: string; href: string; icon?: Icon }) {
    const pathname = usePathname();
    const isActive = pathname === href;
    const IconComponent: Icon = icon ?? SpinnerIcon;

    return (
        <Button
            asChild
            color={isActive ? 'default' : 'secondary'}
            shape="rounded"
            type="button"
            variant={isActive ? 'soft' : 'plain'}
        >
            <Link href={href}>
                {icon && (
                    <IconComponent
                        aria-hidden="true"
                        className="size-5"
                        color="currentColor"
                        weight="duotone"
                    />
                )}
                {title}
            </Link>
        </Button>
    );
}

export default DynamicLink;

function DynamicSlideoverLink({
    href,
    icon,
    isSignOut,
    onClick,
    title,
    ...props
}: {
    icon?: ReactNode;
    title: string;
    href: string;
    onClick?: () => void;
    isSignOut?: boolean;
} & Omit<ButtonProps, 'children' | 'asChild'>) {
    const pathname = usePathname();
    const isActive = pathname === href;

    return !isSignOut ? (
        <Button
            asChild
            className="w-full justify-start"
            color={isActive ? 'accent' : 'secondary'}
            shape="rounded"
            size="lg"
            type="button"
            variant={isActive ? 'soft' : 'plain'}
            {...props}
        >
            <Link href={href} onClick={onClick}>
                {icon}
                <span>{title}</span>
            </Link>
        </Button>
    ) : (
        <Button
            asChild
            className="w-full justify-start"
            color="destructive"
            shape="rounded"
            size="lg"
            type="button"
            variant="soft"
            onClick={onClick}
            {...props}
        >
            <Link href={href} onClick={onClick}>
                {icon}
                <span>{title}</span>
            </Link>
        </Button>
    );
}

export { DynamicLink, DynamicSlideoverLink };
