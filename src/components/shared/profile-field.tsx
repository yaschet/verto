/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { cn } from '@library/utils';
import type { ReactNode } from 'react';

interface ProfileFieldProps {
    /** Label text in sentence case (e.g., "First name") */
    label: string;
    /** The value to display */
    value: string | null | undefined;
    /** Text to show when value is empty */
    emptyText?: string;
    /** Optional leading icon */
    icon?: ReactNode;
    /** Enable enhanced hover effects for interactive fields */
    interactive?: boolean;
    /** Make the field clickable (tel:, mailto:, https://) */
    href?: string;
    /** Additional className for the container */
    className?: string;
    /** Custom children to render instead of value */
    children?: ReactNode;
}

/**
 * ProfileField - Reusable key-value display component
 *
 * Features:
 * - Handles filled/empty states automatically
 * - Expands click target for better UX
 * - Subtle hover background on all fields
 * - Primary color + underline on interactive fields when hovered
 */
export function ProfileField({
    label,
    value,
    emptyText = 'Not provided',
    icon,
    href,
    className,
    children,
}: ProfileFieldProps) {
    const isEmpty = !value || value.trim() === '';
    const isClickable = !!href && !isEmpty;

    // Determine wrapper element
    const ValueWrapper = isClickable ? 'a' : 'div';
    const wrapperProps = isClickable
        ? {
              href,
              target: href.startsWith('http') ? '_blank' : undefined,
              rel: href.startsWith('http') ? 'noopener noreferrer' : undefined,
          }
        : {};

    return (
        <div className={cn('group/field', className)}>
            {/* Label - Sentence case */}
            <p className="text-surface-500 mb-1.5 text-sm font-medium">{label}</p>

            {/* Value or Children */}
            {children ? (
                children
            ) : (
                <ValueWrapper
                    {...wrapperProps}
                    className={cn(
                        // Base styles - expanded click target
                        'flex items-center gap-2 rounded-lg transition-all duration-150',
                        'px-2 py-1.5 -mx-2 -my-1.5',

                        // Filled state
                        !isEmpty && [
                            'text-surface-900 dark:text-surface-100 font-medium',
                            'hover:bg-surface-100/80 dark:hover:bg-surface-800/50',
                        ],

                        // Empty state
                        isEmpty && [
                            'text-surface-400 dark:text-surface-500 italic text-sm',
                            'hover:bg-surface-100/50 dark:hover:bg-surface-800/30',
                        ],

                        // Interactive/clickable state (contact fields)
                        isClickable && [
                            'cursor-pointer',
                            'hover:bg-primary-50/50 dark:hover:bg-primary-950/20',
                        ],
                    )}
                >
                    {/* Icon */}
                    {icon && (
                        <span
                            className={cn(
                                'shrink-0 transition-colors duration-150',
                                isEmpty ? 'text-surface-300 dark:text-surface-600' : 'text-surface-400',
                                isClickable &&
                                    'group-hover/field:text-primary-500 dark:group-hover/field:text-primary-400',
                            )}
                        >
                            {icon}
                        </span>
                    )}

                    {/* Text value */}
                    <span
                        className={cn(
                            isClickable &&
                                !isEmpty && [
                                    'group-hover/field:text-primary-600 dark:group-hover/field:text-primary-400',
                                    'group-hover/field:underline underline-offset-2',
                                    'decoration-primary-300 dark:decoration-primary-600',
                                ],
                        )}
                    >
                        {isEmpty ? emptyText : value}
                    </span>
                </ValueWrapper>
            )}
        </div>
    );
}
