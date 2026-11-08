/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import type { StaticImageData } from 'next/image';
import { VertoAssets } from '@library/assets';
import { cn } from '@library/utils';
import Image from 'next/image';

interface LogoProps {
    className?: string;
    variant?: 'full' | 'icon';
    mode?: 'light' | 'dark' | 'accent' | 'mono' | 'auto';
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    priority?: boolean;
}

const SIZE_CLASSES: Record<NonNullable<LogoProps['size']>, string> = {
    xs: 'h-4',
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-12',
    xl: 'h-16',
    '2xl': 'h-20',
};

export function Logo({
    className,
    variant = 'full',
    mode = 'light',
    size = 'md',
    priority = false,
}: LogoProps) {
    const sizeClass = SIZE_CLASSES[size];

    const commonImageClasses = 'h-full w-auto max-w-full object-contain';

    const getAssets = () => {
        return variant === 'full' ? VertoAssets.Logo.Full : VertoAssets.Logo.Icon;
    };

    if (mode === 'auto' || mode === 'accent' || mode === 'mono') {
        const assets = getAssets();
        let LightSrc: StaticImageData;
        let DarkSrc: StaticImageData;

        if (mode === 'accent') {
            LightSrc = assets.Accent.Light;
            DarkSrc = assets.Accent.Dark;
        } else if (mode === 'mono') {
            LightSrc = assets.Mono.Light;
            DarkSrc = assets.Mono.Dark;
        } else {
            LightSrc = assets.Light;
            DarkSrc = assets.Dark;
        }

        return (
            <div className={cn('relative flex shrink-0 items-center justify-center', sizeClass, className)}>
                <Image
                    src={LightSrc}
                    alt="Verto"
                    priority={priority}
                    className={cn(commonImageClasses, 'dark:hidden')}
                    fill={false}
                />
                <Image
                    src={DarkSrc}
                    alt="Verto"
                    priority={priority}
                    className={cn(commonImageClasses, 'hidden dark:block')}
                    fill={false}
                />
            </div>
        );
    }

    const assets = getAssets();
    const logoSrc = mode === 'dark' ? assets.Dark : assets.Light;

    return (
        <div className={cn('relative flex shrink-0 items-center justify-center', sizeClass, className)}>
            <Image
                src={logoSrc}
                alt="Verto"
                priority={priority}
                className={commonImageClasses}
                fill={false}
            />
        </div>
    );
}
