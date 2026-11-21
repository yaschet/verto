/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import type { ApiErrorType } from './errors';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Unbound transport envelopes carry heterogeneous provider payloads; endpoint contracts bind T.
export type ApiResponse<T = any> = {
    code?: string;
    title?: string;
    success?: boolean;
    error?: boolean;
    message: string;
    description?: string;
    solution?: string;
    status?: number;
    traceId?: string;
    data?: T;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Unbound transport envelopes carry heterogeneous provider payloads; endpoint contracts bind T.
export type ApiResponseOrError<T = any> = ApiResponse<T> | ApiErrorType<T>;
