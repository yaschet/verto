/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { GearSixIcon, MoonIcon, SunIcon } from '@phosphor-icons/react';
import { useTheme } from 'next-themes';
import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Button, buttonVariants } from '@components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@components/ui/dropdown-menu';
import { cn } from '@library/utils';
import type { ButtonProps } from '@components/ui/button';

export default function ThemeDropdown({
    className,
    ...props
}: Readonly<{ className?: string } & Partial<ButtonProps>>) {
    const { resolvedTheme, setTheme, systemTheme, theme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        // Ensure the component only renders after mounting to avoid hydration errors
        setMounted(true);
    }, []);

    if (!mounted) {
        // Avoid rendering on the server
        return null;
    }

    const toggleTheme = async (newTheme: string) => {
        const currentResolvedTheme = resolvedTheme ?? systemTheme;

        if (currentResolvedTheme === 'dark') {
            document.documentElement.classList.add('transition-bg-dark');
        } else {
            document.documentElement.classList.add('transition-bg-light');
        }

        if (
            !triggerRef.current ||
            !document.startViewTransition ||
            window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ) {
            setTheme(newTheme);
            return;
        }

        await document.startViewTransition(() => {
            flushSync(() => {
                setTheme(newTheme);
            });
        }).ready;

        const { height, left, top, width } = triggerRef.current.getBoundingClientRect();
        const x = left + width / 2;
        const y = top + height / 2;
        const right = window.innerWidth - left;
        const bottom = window.innerHeight - top;
        const maxRadius = Math.hypot(Math.max(left, right), Math.max(top, bottom));

        document.documentElement.animate(
            {
                clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${maxRadius}px at ${x}px ${y}px)`],
            },
            {
                duration: 700,
                easing: 'ease-in-out',
                pseudoElement: '::view-transition-new(root)',
            },
        ).onfinish = () => {
            document.documentElement.classList.remove('transition-bg-light', 'transition-bg-dark');
        };
    };

    const themes = [
        {
            icon: SunIcon,
            label: 'Light',
            name: 'light',
        },
        {
            icon: MoonIcon,
            label: 'Dark',
            name: 'dark',
        },
        {
            icon: GearSixIcon,
            label: 'System',
            name: 'system',
        },
    ];

    const currentTheme = theme ?? 'system';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                ref={triggerRef}
                className={cn(
                    buttonVariants({
                        color: props.color ?? 'default',
                        size: props.size ?? 'icon',
                        variant: props.variant ?? 'soft',
                    }),
                    className,
                )}
            >
                {resolvedTheme === 'light' ? (
                    <SunIcon className="size-5" color="currentColor" weight="duotone" />
                ) : (
                    <MoonIcon className="size-5" color="currentColor" weight="duotone" />
                )}
            </DropdownMenuTrigger>
            <DropdownMenuContent forceMount align="end" className="w-fit" side="top" sideOffset={0}>
                <DropdownMenuGroup className="flex flex-col gap-2">
                    {themes.map((themeItem) => {
                        const ThemeIcon = themeItem.icon;
                        const isActive = themeItem.name === currentTheme;

                        return (
                            <DropdownMenuItem key={themeItem.name} asChild>
                                <Button
                                    className={cn(
                                        'flex flex-row items-center justify-start gap-2 font-bold',
                                        isActive
                                            ? 'bg-surface-300 text-foreground dark:bg-surface-700 dark:text-foreground'
                                            : 'hover:bg-surface-200 hover:text-muted dark:hover:bg-surface-800 dark:hover:text-muted',
                                    )}
                                    color={isActive ? 'primary' : 'secondary'}
                                    size="md"
                                    variant={isActive ? 'soft' : 'plain'}
                                    onClick={() => toggleTheme(themeItem.name)}
                                >
                                    <ThemeIcon className="size-5" color="currentColor" weight="duotone" />
                                    <span>{themeItem.label}</span>
                                </Button>
                            </DropdownMenuItem>
                        );
                    })}
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
