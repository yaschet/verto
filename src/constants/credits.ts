/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { titleCase } from 'title-case';
import type Stripe from 'stripe';

export const VTC_UNIT_PRICE = 1.5; // Base B2B SaaS Price ($1.50/page)
export const VTC_UNIT_PRICE_CURRENCY = 'USD';
export const VTC_UNIT_PRICE_CURRENCY_SYMBOL = '$';
export const VTC_UNIT_PRICE_CURRENCY_LOCALE = 'en-US';
export const VTC_MINIMUM_AMOUNT = 1; // 1 Page minimum
export const VTC_MAXIMUM_AMOUNT = 1000000;

export const formatPrice = (amount: number): string => {
    // Fix floating point precision (e.g. 18.00000004 -> 18)
    const rounded = Math.round(amount * 100) / 100;

    return Intl.NumberFormat(VTC_UNIT_PRICE_CURRENCY_LOCALE, {
        currency: VTC_UNIT_PRICE_CURRENCY,
        style: 'currency',
        minimumFractionDigits: Number.isInteger(rounded) ? 0 : 2,
        maximumFractionDigits: 2,
    }).format(rounded);
};

export const getPricePerUnit = (_amount: number, discount = 0) => {
    return VTC_UNIT_PRICE * (1 - discount / 100);
};

export const getOriginalPricePerUnit = (amount: number) => {
    return getPricePerUnit(amount, 0);
};

// Volume discounts
export const calculateDiscount = (amount: number) => {
    if (amount >= 2000) return 60; // Whale (60% Off -> $0.60/credit)
    if (amount >= 500) return 50; // Enterprise (50% Off -> $0.75/credit)
    if (amount >= 100) return 40; // Agency (~$0.89/credit)
    if (amount >= 50) return 35; // Starter (~$0.98/credit)
    return 0;
};

export type PresetName = 'Micro' | 'Starter' | 'Agency' | 'Enterprise' | 'Whale' | 'Custom';

export const getPresetName: (amount: number) => PresetName = (amount) => {
    if (amount >= 2000) return 'Whale';
    if (amount >= 500) return 'Enterprise';
    if (amount >= 100) return 'Agency';
    if (amount >= 50) return 'Starter';
    return 'Micro';
};

export const VTC_PRESET_AMOUNTS = [10, 50, 100, 500, 2000];

// Centralized price calculation to ensure consistency between Marketing/Presets and Custom Input
export const calculateTotalPrice = (amount: number): number => {
    // B2B Charm Pricing & Clean Percentage Targets
    if (amount === 50) return 49; // ~35% Off
    if (amount === 100) return 89; // ~41% Off (Charm beats 40% here)
    if (amount === 500) return 375; // 50% Off (HALF PRICE)
    if (amount === 2000) return 1199; // ~60% Off

    // Standard Calculation
    const discountPercentage = calculateDiscount(amount);
    const unitPrice = getPricePerUnit(amount, discountPercentage);
    return amount * unitPrice;
};

export const VTC_PRESET_PACKS: {
    name: string;
    amount: number;
    discountPercentage: number;
    isBestValue: boolean;
    isMostPopular: boolean;
    price: number;
}[] = VTC_PRESET_AMOUNTS.map((amount) => {
    const discountPercentage = calculateDiscount(amount);
    const price = calculateTotalPrice(amount);
    const name = getPresetName(amount);

    return {
        amount,
        discountPercentage,
        isBestValue: amount === 500,
        isMostPopular: amount === 100,
        name,
        price,
    };
});

export function convertDollarsToCents(amount: number) {
    return amount * 100;
}

export function convertCentsToDollars(amount: number) {
    return amount / 100;
}

export const formatAmount = (amountInCents: number, currency: string) =>
    convertCentsToDollars(amountInCents).toLocaleString('en-US', {
        currency,
        style: 'currency',
    });
export const calculateDiscountAmount = (subtotal: number, percentOff: number) =>
    subtotal * (percentOff / 100);

export const getPaymentMethodDetails = (method: Stripe.PaymentMethod | null) => {
    if (method?.card?.last4) {
        return `${method.card.brand?.toUpperCase()} Card ending in ${method.card.last4}`;
    }
    const type = method?.type?.replace(/_/g, ' ').replace(/\.$/, '') ?? 'Unknown';
    return titleCase(type);
};

export const formatCreditsBalance = (balance: number) => {
    return balance.toLocaleString('en-US', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
        style: 'decimal',
    });
};

// Credit consumption pricing for translations
export const PAGES_PER_CREDIT = 1;
export const MINIMUM_CREDITS_PER_TRANSLATION = 1;

/**
 * Calculate credits required for a translation based on page count.
 * Pricing model: 1 credit per 1 page (Professional Standard), minimum 1 credit per translation.
 *
 * @param pageCount - Number of pages in the document
 * @returns Number of credits required
 *
 * @example
 * calculateCreditsRequired(1)   // returns 1
 * calculateCreditsRequired(3)   // returns 3
 * calculateCreditsRequired(5)   // returns 5
 * calculateCreditsRequired(50)  // returns 50

 *
 * @throws {Error} If pageCount is less than or equal to 0
 */
export const calculateCreditsRequired = (pageCount: number): number => {
    if (pageCount <= 0) {
        throw new Error('Page count must be greater than 0');
    }

    return Math.max(MINIMUM_CREDITS_PER_TRANSLATION, Math.ceil(pageCount / PAGES_PER_CREDIT));
};
