/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { ArrowSquareOutIcon } from '@phosphor-icons/react';
import { useMutation } from '@tanstack/react-query';
import React from 'react';
import { toast } from 'sonner';
import { openCustomerPortal } from '@actions/billing/stripe/open-customer-portal';
import { Button } from '@components/ui/button';
import { isApiError, standardizeError } from '@errors/api-errors';
import { cn } from '@library/utils';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';
import type { ButtonProps } from '@components/ui/button';

export function StripeCustomerPortalButton({
    className,
    color,
    loading = false,
    size,
    tooltipContent,
    variant,
    ...props
}: React.HTMLAttributes<HTMLButtonElement> & Omit<ButtonProps, 'children'>): React.ReactElement<
    React.HTMLAttributes<HTMLButtonElement>,
    'button'
> {
    // * - Submit Handler:
    const { isPending, mutateAsync } = useMutation({
        mutationFn: async () => {
            const response = await openCustomerPortal();

            if (response?.error) {
                throw response;
            }

            const customerPortalUrl = response?.data?.customerPortalUrl;

            if (!customerPortalUrl) {
                throw standardizeError({
                    description: 'An error occurred while processing your request. Please try again.',
                    message: 'Failed to retrieve customer portal URL.',
                    title: 'Error!',
                });
            }

            // Redirect to the payment page:
            // router.push(customerPortalUrl);
            if (typeof window !== 'undefined') {
                window?.open(customerPortalUrl, '_blank');
            } else {
                throw standardizeError({
                    description: 'An error occurred while processing your request. Please try again.',
                    message: 'Failed to open customer portal URL.',
                    title: 'Error!',
                });
            }

            return response;
        },
        onError: (error: (Error & Partial<ApiErrorType>) | ApiErrorType) => {
            toast.error(error?.title ?? error?.message ?? 'Error!', {
                description:
                    error?.description ??
                    'An error occurred while processing your request. Please try again.',
            });
        },
        onSuccess: (data: ApiResponseOrError | ApiErrorType) => {
            if (isApiError(data)) {
                toast.error(data?.title ?? data?.message ?? 'Error!', {
                    description:
                        data?.description ??
                        'An error occurred while processing your request. Please try again.',
                });
            }

            toast.success(data?.title ?? data?.message ?? 'Redirecting to your customer portal...', {
                description: data?.description ?? 'You will be redirected to the payment page shortly.',
                id: 'redirecting-to-payment-page',
            });
        },
        retry: 0,
    });

    const handleCustomerPortal = async () => {
        await mutateAsync();
    };

    return (
        <Button
            aria-label="View billing history and download invoices."
            className={cn('flex h-auto items-center justify-center gap-1', className)}
            color={color ?? 'accent'}
            loading={isPending || loading}
            size={size ?? 'sm'}
            tooltipContent={tooltipContent}
            variant={variant ?? (isPending ? 'solid' : 'solid')}
            onClick={async () => handleCustomerPortal()}
            {...props}
        >
            {!isPending && <ArrowSquareOutIcon className="size-5" color="currentColor" weight="duotone" />}
            <span className="text-sm font-bold lining-nums">
                {isPending ? 'Redirecting' : 'Customer Portal'}
            </span>
        </Button>
    );
}
