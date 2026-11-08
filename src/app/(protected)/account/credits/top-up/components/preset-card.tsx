/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import React from 'react';
import { formatPrice } from '@/constants/credits';
import { cn } from '@library/utils';
import type { FC } from 'react';

type PresetCardProps = React.HTMLAttributes<HTMLDivElement> & {
    name: string;
    amount: number;
    unitPrice: number;
    discountPercentage: number;
    isMostPopular?: boolean;
    isActive?: boolean;
    totalPriceOverride?: number;
};

const PresetCard: FC<PresetCardProps> = ({
    amount,
    className,
    discountPercentage,
    isActive = false,
    isMostPopular = false,
    name,
    unitPrice,
    totalPriceOverride,
    ...props
}) => {
    // Use override if provided, otherwise calculate
    const totalPrice = totalPriceOverride ?? amount * (1 - discountPercentage / 100) * unitPrice;
    const pricePerCredit = formatPrice(totalPrice / amount);
    const price = formatPrice(totalPrice);

    return (
        <div
            className={cn(
                'relative z-10 flex h-auto w-full max-w-full min-w-40 cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-3xl p-7',
                // 'transition-transform duration-75 ease-in-out active:scale-[0.95]',
                isMostPopular
                    ? cn(
                          'text-accent-950 dark:text-accent-50',
                          'bg-linear-to-br dark:bg-linear-to-br',
                          'from-accent-500 to-accent-400',
                          'hover:from-accent-400 hover:to-accent-300',
                          'dark:from-accent-500 dark:to-accent-600',
                          'dark:hover:from-accent-600 dark:hover:to-accent-700',
                      )
                    : 'bg-surface-2 hover:bg-surface-3',
                isActive
                    ? isMostPopular
                        ? 'border-accent-950 active:border-accent-600 dark:border-accent-50 dark:active:border-accent-400 z-20 border-2'
                        : 'border-foreground dark:border-foreground z-20 border-2'
                    : 'active:border-foreground-600 dark:active:border-foreground-400 border-2 border-transparent',
                className,
            )}
            {...props}
        >
            <div className="flex w-full flex-col items-start justify-start text-start">
                <p
                    className={cn(
                        'text-foreground dark:text-accent-foreground mb-2 flex w-full flex-row items-center justify-start gap-2 text-xs font-semibold lining-nums opacity-70',
                        isMostPopular
                            ? 'text-accent-950 dark:text-accent-50'
                            : 'text-surface-950 dark:text-surface-50',
                    )}
                >
                    <span>{name}</span>
                    {isMostPopular && (
                        <span aria-label="Most Popular Option" className="relative">
                            <span className="bg-accent-950 text-accent-400 dark:bg-accent-50 dark:text-accent-600 flex items-center justify-center rounded-xl px-2.5 py-0.5 text-xs font-bold">
                                Most Popular
                            </span>
                        </span>
                    )}
                </p>
                <div className="flex w-full flex-row items-baseline justify-between">
                    <h1
                        className={`mb-4 w-full flex-1 text-xl font-bold lining-nums ${isMostPopular ? 'text-accent-950 dark:text-accent-50' : 'text-surface-950 dark:text-surface-50'}`}
                    >
                        <strong>{amount}</strong> <small>VTC</small>
                    </h1>
                    <span
                        className={`flex-0 text-lg font-bold ${isMostPopular ? 'text-accent-950 dark:text-accent-50' : 'text-foreground'}`}
                    >
                        {price}
                    </span>
                </div>
                <div className="flex w-full flex-row items-baseline justify-between">
                    <p
                        className={`lining-nums ${isMostPopular ? 'text-accent-950 dark:text-accent-50' : 'text-muted'}`}
                    >
                        <span className="font-bold">{pricePerCredit}</span> per credit.
                    </p>
                    <p
                        className={`lining-nums ${isMostPopular ? 'text-accent-950 dark:text-accent-50' : 'text-muted'}`}
                    >
                        <span className="text-sm font-bold">{discountPercentage}%</span> Off
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PresetCard;
