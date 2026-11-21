/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { MapPinIcon } from '@phosphor-icons/react';
import { cn } from '@library/utils';

interface AddressFieldProps {
    address: string | null | undefined;
    city: string | null | undefined;
    state: string | null | undefined;
    zipCode: string | null | undefined;
    country: string | null | undefined;
    /** Text to show when all address fields are empty */
    emptyText?: string;
}

/**
 * AddressField - Multi-line address display with Google Maps integration
 *
 * Features:
 * - Combines address parts intelligently
 * - Links to Google Maps when any value exists
 * - Shows contextual empty text when all empty
 * - Interactive hover effects with primary color shift
 */
export function AddressField({
    address,
    city,
    state,
    zipCode,
    country,
    emptyText = 'No address on file',
}: AddressFieldProps) {
    // Check if any address field has a value
    const hasAnyValue = !!(address || city || state || zipCode || country);

    // Build Google Maps search URL
    const addressParts = [address, city, state, zipCode, country].filter(Boolean);
    const mapsUrl = hasAnyValue
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressParts.join(', '))}`
        : undefined;

    // Build display lines
    const line1 = address || null;
    const line2 = [city, state, zipCode].filter(Boolean).join(', ') || null;
    const line3 = country || null;

    const Wrapper = hasAnyValue ? 'a' : 'div';
    const wrapperProps = hasAnyValue
        ? {
              href: mapsUrl,
              target: '_blank' as const,
              rel: 'noopener noreferrer',
          }
        : {};

    return (
        <div className="group/address">
            {/* Label */}
            <p className="text-surface-500 mb-1.5 text-sm font-medium">Address</p>

            {/* Value */}
            <Wrapper
                {...wrapperProps}
                className={cn(
                    // Base styles - expanded click target
                    'flex items-start gap-2 rounded-lg transition-all duration-150',
                    'px-2 py-1.5 -mx-2 -my-1.5',

                    // Filled state
                    hasAnyValue && ['cursor-pointer', 'hover:bg-primary-50/50 dark:hover:bg-primary-950/20'],

                    // Empty state
                    !hasAnyValue && [
                        'text-surface-400 dark:text-surface-500 italic text-sm',
                        'hover:bg-surface-100/50 dark:hover:bg-surface-800/30',
                    ],
                )}
            >
                {/* Map pin icon */}
                <MapPinIcon
                    className={cn(
                        'mt-0.5 size-4 shrink-0 transition-colors duration-150',
                        hasAnyValue
                            ? 'text-surface-400 group-hover/address:text-primary-500 dark:group-hover/address:text-primary-400'
                            : 'text-surface-300 dark:text-surface-600',
                    )}
                />

                {/* Address lines */}
                <div
                    className={cn(
                        'transition-colors duration-150',
                        hasAnyValue && [
                            'text-surface-900 dark:text-surface-100 font-medium',
                            'group-hover/address:text-primary-600 dark:group-hover/address:text-primary-400',
                        ],
                    )}
                >
                    {hasAnyValue ? (
                        <>
                            {line1 && (
                                <p
                                    className={cn(
                                        hasAnyValue &&
                                            'group-hover/address:underline underline-offset-2 decoration-primary-300 dark:decoration-primary-600',
                                    )}
                                >
                                    {line1}
                                </p>
                            )}
                            {line2 && <p>{line2}</p>}
                            {line3 && <p>{line3}</p>}
                        </>
                    ) : (
                        <p>{emptyText}</p>
                    )}
                </div>
            </Wrapper>
        </div>
    );
}
