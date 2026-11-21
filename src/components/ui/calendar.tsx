/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { CaretLeftIcon, CaretRightIcon, CaretUpIcon } from '@phosphor-icons/react';
import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import { buttonVariants } from '@components/ui/button';
import { cn } from '@library/utils';
import type { IconProps } from '@phosphor-icons/react';
import type { ChevronProps } from 'react-day-picker';

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
    className?: string;
    classNames?: Record<string, string>;
    showOutsideDays?: boolean;
    mode?: 'default' | undefined | 'single' | 'multiple' | 'range';
};

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
    return (
        <DayPicker
            className={cn('p-3', className)}
            classNames={{
                day: cn(
                    'relative',
                    'p-0',
                    'text-center',
                    'text-sm',
                    'focus-within:relative',
                    'focus-within:z-20',

                    '[&:has([aria-selected])]:text-foreground',

                    '[&:has([aria-selected].day-range-middle)]:bg-primary/10 [&:has([aria-selected].day-range-middle)]:hover:bg-primary/20 [&:has([aria-selected].day-range-middle)]:active:bg-primary/30',
                    '[&:has([aria-selected].day-range-middle)]:text-foreground',

                    '[&:has([aria-selected].day-range-start)]:bg-primary [&:has([aria-selected].day-range-start)]:hover:bg-primary/80 [&:has([aria-selected].day-range-start)]:active:bg-primary/90',
                    '[&:has([aria-selected].day-range-start)]:text-primary-foreground [&:has([aria-selected].day-range-start)]:hover:text-primary-foreground/60',

                    '[&:has([aria-selected].day-range-end)]:bg-primary [&:has([aria-selected].day-range-end)]:hover:bg-primary/60 [&:has([aria-selected].day-range-end)]:active:bg-primary/90',
                    '[&:has([aria-selected].day-range-end)]:text-primary-foreground [&:has([aria-selected].day-range-end)]:hover:text-primary-foreground/80',

                    '[&:has([aria-selected].day-outside)]:bg-primary/5 [&:has([aria-selected].day-outside)]:hover:bg-primary/10 [&:has([aria-selected].day-outside)]:text-primary-foreground/50',
                    '[&:has([aria-selected].day-outside)]:text-muted [&:has([aria-selected].day-outside)]:hover:text-foreground',

                    '[&:has([aria-selected].day-range-start)]:rounded-l-md',
                    '[&:has([aria-selected].day-range-end)]:rounded-r-md',
                    props.mode === 'range'
                        ? '[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md'
                        : '[&:has([aria-selected])]:rounded-md',
                ),
                day_button: cn(
                    'size-8',
                    'flex',
                    'items-center',
                    'justify-center',
                    'font-normal',
                    'rounded-md',
                    'aspect-square',
                    'p-1.5',
                    'cursor-pointer',
                    'active:scale-95',
                    'transition-transform',
                    'bg-transparent',
                    'hover:bg-primary/5',
                    'text-inherit',
                    'hover:text-current',
                    'active:bg-transparent',
                    'active:text-current',
                ),
                disabled: cn('text-muted', 'opacity-50'),
                day_hidden: cn('invisible'),
                day_outside: cn('day-outside'),
                // Ensure full opacity for range start and end
                day_range_start: cn('day-range-start'),
                day_range_end: cn('day-range-end'),
                day_range_middle: cn('day-range-middle'),
                day_selected: cn(
                    'bg-transparent',
                    'text-current',
                    'hover:bg-transparent',
                    'hover:text-current',
                    'focus:bg-transparent',
                    'focus:text-current',
                ),
                day_today: cn('bg-accent text-accent-foreground'),
                head_cell: cn('text-muted', 'rounded-md', 'w-8', 'font-semibold', 'text-xs'),
                head_row: cn('flex'),
                month: cn('flex', 'flex-col', 'gap-4'),
                months: cn('flex', 'flex-col', 'sm:flex-row', 'gap-2', 'sm:gap-2'),
                caption: cn(
                    'relative',
                    'flex',
                    'flex-row',
                    'justify-center',
                    'items-center',
                    'gap-2',
                    'p-[0.3rem]',
                ),
                caption_label: cn('text-sm', 'font-medium', 'relative'),
                nav: cn('static', 'flex', 'items-center', 'justify-center', 'gap-2'),
                nav_button: cn(
                    buttonVariants({ color: 'secondary', variant: 'soft', size: 'icon' }),
                    'static',
                    'rounded-md',
                ),
                nav_button_previous: 'absolute left-0',
                nav_button_next: 'absolute right-0',
                row: cn('flex', 'w-full', 'mt-2'),
                table: cn('w-full', 'border-collapse', 'flex', 'flex-col', 'gap-1'),
                ...classNames,
            }}
            components={{
                Chevron: ({ className: chevronClassName, disabled, orientation, size }: ChevronProps) => {
                    const commonProps: IconProps = {
                        className: cn('size-5', chevronClassName, disabled && 'text-muted opacity-50'),
                        color: 'currentColor',
                        size: size || 24,
                        weight: 'duotone',
                    };

                    switch (orientation) {
                        case 'up':
                            return <CaretUpIcon {...commonProps} />;
                        case 'down':
                            return (
                                <CaretUpIcon
                                    {...commonProps}
                                    className={cn(commonProps.className, 'rotate-180 transform')}
                                />
                            );
                        case 'right':
                            return <CaretRightIcon {...commonProps} />;
                        default:
                            return <CaretLeftIcon {...commonProps} />;
                    }
                },
            }}
            showOutsideDays={showOutsideDays}
            {...props}
        />
    );
}

Calendar.displayName = 'Calendar';

export { Calendar };
