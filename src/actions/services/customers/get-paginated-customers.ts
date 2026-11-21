/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { z } from 'zod';
import { validateUser } from '@/helpers/validate-user';
import { isApiError, standardizeError } from '@/src/errors/api-errors';
import { getCustomersCountQuery, getPaginatedCustomersQuery } from '@/src/queries/database/customers';
import { CustomerPublicColumnsArray } from '@/src/schemas/customer-schemas';
import { createServerClient } from '@/src/utils/supabase/server';
import { getLogger } from '@services/logger';
import type { CustomerColumn, CustomerRow } from '@/src/schemas/customer-schemas';
import type { PaginatedQueryParams } from '@/types/rest/common';
import type { PaginatedResponse } from '@/types/rest/common';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';

// Create a Zod schema for PaginatedQueryParams
const CustomersQueryParamsSchema = z.object({
    page: z
        .number({
            error: 'The page index must be a positive integer.',
        })
        .int({
            message: 'The page index must be an integer.',
        })
        .nonnegative({
            message: 'The page index must be a non-negative integer.',
        })
        .default(0),
    pageCustomer: z
        .string({
            error: 'The page customer must be a string.',
        })
        .nullable()
        .optional(),
    pageFilter: z
        .string({
            error: 'The page filter must be a string.',
        })
        .nullable()
        .optional(),
    pageSize: z
        .number({
            error: 'The page size must be a positive integer.',
        })
        .int({
            message: 'The page size must be an integer.',
        })
        .positive({
            message: 'The page size must be a positive integer.',
        })
        .default(10),
    pageSortBy: z
        .enum(CustomerPublicColumnsArray, {
            error: `The page sort by field is invalid, and must be one of the following: ${CustomerPublicColumnsArray.join(', ')}.`,
        })
        .nullable()
        .optional(),
    pageSortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export async function getPaginatedCustomers({
    page = 0,
    pageFilter = null,
    pageSize = 10,
    pageSortBy = null,
    pageSortOrder = 'desc',
}: PaginatedQueryParams<CustomerColumn>): Promise<ApiResponseOrError<PaginatedResponse<CustomerRow>>> {
    const logger = getLogger('SERVICES:CUSTOMERS:GET_PAGINATED');
    try {
        // Check if the user is authenticated:
        const { user } = await validateUser();

        // Validate the passed parameters against the Zod schema:
        const validatedParamsResult = await CustomersQueryParamsSchema.safeParseAsync({
            page,
            pageFilter,
            pageSize,
            pageSortBy,
            pageSortOrder,
        });
        if (!validatedParamsResult.success) {
            const formattedErrors = validatedParamsResult.error.issues
                .map((issue) => `${issue.message}`)
                .join(' ');

            const errorDescription = `There were issues with the provided query parameters: ${formattedErrors}`;

            const errorResponse = standardizeError({
                code: 'INVALID_PARAMETERS',
                description: errorDescription,
                message: 'Invalid parameters provided. Please review the errors below:',
                status: 400,
                title: 'Invalid Parameters',
            });

            logger.error([
                'The service failed to fetch customer data due to the following error:',
                errorResponse,
            ]);

            return errorResponse;
        }

        const validatedParams = validatedParamsResult.data;

        const supabase = await createServerClient();

        // Use the separated query function
        const query = getPaginatedCustomersQuery(supabase, {
            page: validatedParams.page,
            pageFilter: validatedParams.pageFilter,
            pageSize: validatedParams.pageSize,
            pageSortBy: validatedParams.pageSortBy,
            pageSortOrder: validatedParams.pageSortOrder,
            profileId: user.id,
        });

        // Execute the query:
        const { data: customers, error } = await query;

        if (error) {
            const errorResponse = standardizeError(error);
            logger.error([
                'The service has failed to fetch the customers data, due to the following error:',
                errorResponse,
            ]);
            return errorResponse;
        }

        // Ensure customers is not undefined:
        const customersData: CustomerRow[] = customers ?? [];

        // Get the total count for pagination purposes:
        const { count, error: countError } = await getCustomersCountQuery(supabase, user.id);

        if (countError) {
            const errorResponse = standardizeError(countError);
            logger.error([
                'The service has failed to fetch the customers data, due to the following error:',
                errorResponse,
            ]);
            return errorResponse;
        }

        const totalCount: number = count ?? 0;

        const responseObject: PaginatedResponse<CustomerRow> = {
            pagination: {
                nextPage:
                    (validatedParams.page + 1) * validatedParams.pageSize < totalCount
                        ? validatedParams.page + 1
                        : null,
                pageIndex: validatedParams.page,
                pageSize: validatedParams.pageSize,
                pagesCount: Math.ceil(totalCount / validatedParams.pageSize),
                prevPage: validatedParams.page > 0 ? validatedParams.page - 1 : null,
            },
            results: customersData,
            total: totalCount,
        };

        return {
            data: responseObject,
            description: 'Customer data has been successfully retrieved.',
            message: 'Customers retrieved successfully.',
            status: 200,
            success: true,
            title: 'Customers Retrieved',
        };
    } catch (error) {
        const errorResponse: ApiErrorType = isApiError(error)
            ? (error as ApiErrorType)
            : standardizeError(error);
        logger.error([
            'The service has failed to fetch the customers data, due to the following error:',
            errorResponse,
        ]);
        return errorResponse;
    }
}
