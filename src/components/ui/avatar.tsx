/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import * as AvatarPrimitive from '@radix-ui/react-avatar';
import BoringAvatar from 'boring-avatars';
import Image from 'next/image';
import * as React from 'react';
import { cn } from '@library/utils';
import type { AvatarProps } from 'boring-avatars';

const Avatar = React.forwardRef<
    React.ComponentRef<typeof AvatarPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> & { className?: string }
>(({ className, ...props }, ref) => (
    <AvatarPrimitive.Root
        ref={ref}
        className={cn('relative flex h-14 w-14 shrink-0 overflow-hidden rounded-xl', className)}
        {...props}
    />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
    React.ComponentRef<typeof AvatarPrimitive.Image>,
    React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image> &
        React.ComponentPropsWithoutRef<typeof Image> & {
            className?: string;
            src?: string | null | undefined;
            alt?: string;
        }
>(({ alt, className, src, ...props }, ref) => {
    if (!src || src === '') {
        return null;
    }

    return (
        <AvatarPrimitive.Image ref={ref} asChild className="overflow-hidden rounded-xl" src={src}>
            <Image
                alt={alt ?? 'Avatar'}
                className={cn('relative aspect-square h-full w-full rounded-xl object-cover', className)}
                layout="fill"
                objectFit="cover"
                objectPosition="center"
                priority={true}
                quality={100}
                src={src}
                style={{ borderRadius: '0.75rem' }}
                {...props}
            />
        </AvatarPrimitive.Image>
    );
});
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
    React.ComponentRef<typeof AvatarPrimitive.Fallback>,
    React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> & { className?: string }
>(({ className, ...props }, ref) => (
    <AvatarPrimitive.Fallback
        ref={ref}
        className={cn(
            'bg-foreground text-background flex h-full w-full items-center justify-center rounded-xl font-semibold',
            className,
        )}
        {...props}
    />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export type BoringAvatarFallbackProps = React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> &
    AvatarProps;

const BoringAvatarFallback = React.forwardRef<
    React.ComponentRef<typeof AvatarPrimitive.Fallback>,
    BoringAvatarFallbackProps
>(({ className, name, colors, size, square, variant, ...props }, ref) => {
    const defaultColors: string[] = [
        '#E98D61',
        '#B0AA39',
        '#2AB6D1',
        '#DB9640',
        '#C5A231',
        '#97B14C',
        '#39BAA4',
        '#58ACF2',
        '#79A4FE',
        '#989CFF',
        '#B394F4',
        '#CA8DE1',
        '#DC88C7',
        '#E886A7',
        '#EC8786',
        '#7DB664',
        '#5AB983',
        '#FAFBFE',
        '#13141B',
    ];

    return (
        <AvatarPrimitive.Fallback
            ref={ref}
            className={cn(
                'bg-foreground text-background flex h-full w-full items-center justify-center rounded-xl',
                className,
            )}
            {...props}
        >
            <BoringAvatar
                colors={colors ?? defaultColors}
                name={name ?? 'Verto User'}
                size={size ?? 100}
                square={square ?? true}
                variant={variant ?? 'beam'}
            />
        </AvatarPrimitive.Fallback>
    );
});
BoringAvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, BoringAvatarFallback as AvatarFallback };
