/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { ArrowLeftIcon } from '@phosphor-icons/react';
import { useRouter } from 'next-nprogress-bar';
import { Button } from '@components/ui/button';
import type { ButtonProps } from '@components/ui/button';

export default function BackButton({ color, size, variant, ...props }: Partial<ButtonProps>) {
    const router = useRouter();

    const goBack = () => {
        router.back();
    };

    return (
        <Button
            aria-label="Go Back"
            color={color ?? 'default'}
            size={size ?? 'icon-lg'}
            tooltipContent="Click to go back"
            variant={variant ?? 'soft'}
            onClick={goBack}
            {...props}
        >
            <ArrowLeftIcon className="size-5" color="currentColor" weight="duotone" />
        </Button>
    );
}
