/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';
import { use } from 'react';
import { standardizeError } from '@/src/errors/api-errors';
import { ErrorComponent } from '@components/pages/errors';
import type { SearchParams } from '@/types/rest/common';

// * Disclosure: This is the error page for the 500 error

// For now we test the UI, faking the error message.

export default function ErrorPage(props: { searchParams: Promise<SearchParams> }) {
    const searchParams = use(props.searchParams);
    const errorCode: string | null = searchParams.error_code?.toString() ?? '500';
    const errorStatus: number = searchParams.status ? parseInt(searchParams.status.toString()) : 500;
    const errorMessage: string | null =
        searchParams.error_message?.toString() ?? 'Oops! Something went wrong.';
    const errorDescription: string | null =
        searchParams.error_description?.toString() ??
        'We are sorry, but we are unable to process your request at this time. Please try again later.';

    const errorResponse = standardizeError({
        code: errorCode,
        description: errorDescription,
        message: errorMessage,
        status: errorStatus,
    });

    return (
        <ErrorComponent
            code={errorResponse.code ?? errorCode}
            description={errorResponse.description ?? errorDescription}
            message={errorResponse.title ?? errorMessage}
            status={errorResponse.status ?? errorStatus}
        />
    );
}
