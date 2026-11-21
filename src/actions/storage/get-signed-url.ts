/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use server';

import { validateUser } from '@/helpers/validate-user';
import { isApiError, standardizeError } from '@errors/api-errors';
import { getLogger } from '@services/logger';
import { env } from '@/env';
import { createServerClient } from '@utils/supabase/server';
import type { ApiErrorType } from '@/types/rest/errors';
import type { ApiResponseOrError } from '@/types/rest/response';

export type SignedUrlResponse =
    | ApiResponseOrError<{
          signedUrl?: string | null;
      }>
    | ApiErrorType;

export async function getSignedUrl({
    bucket,
    download,
    fileName,
}: {
    bucket?: string | null;
    fileName?: string | null;
    download?: boolean;
}): Promise<SignedUrlResponse> {
    const logger = getLogger('API:PAYMENT:CUSTOMER-PORTAL');

    try {
        // Step 1: Validate user and profile.
        await validateUser();

        // Step 2: Create Supabase Client.
        const supabase = await createServerClient();

        // Create a short-lived download URL.
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from(bucket ?? env.NEXT_PUBLIC_FILE_UPLOAD_BUCKET)
            .createSignedUrl(fileName ?? 'file.txt', 60, {
                download: download ?? false,
            });

        if (signedUrlError || !signedUrlData) {
            if (signedUrlError.message.includes('not found')) {
                logger.error(['File not found:', signedUrlError]);
                return standardizeError({
                    code: 'FILE_NOT_FOUND',
                    title: 'File Not Found',
                    status: 404,
                    description: 'The file was not found in your account storage.',
                });
            }

            logger.error(['Error generating signed URL:', signedUrlError]);
            return standardizeError(signedUrlError);
        }

        const signedUrl = signedUrlData.signedUrl;

        // Step 5: Return response.
        return {
            code: 'SIGN_URL_GENERATED',
            data: {
                signedUrl,
            },
            description: 'The signed URL has been generated successfully.',
            message: 'Signed URL has been generated successfully.',
            status: 200,
            title: 'Signed URL Generated',
        };
    } catch (error) {
        const errorResponse = isApiError(error) ? error : standardizeError(error);
        logger.error(['Error creating signed URL:', errorResponse]);
        return errorResponse;
    }
}
