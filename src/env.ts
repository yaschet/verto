/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

/** Validates deployment configuration without logging credential values. */
export const env = createEnv({
    client: {
        NEXT_PUBLIC_APP_URL: z.url(),
        NEXT_PUBLIC_SUPABASE_URL: z.url(),
        NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().trim().min(1),
        NEXT_PUBLIC_FILE_UPLOAD_BUCKET: z.string().trim().min(1),
        NEXT_PUBLIC_FILE_UPLOAD_BUCKET_ALLOWED_MIME_TYPES: z.string().trim().min(1),
        NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().trim().min(1),
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().trim().min(1),
        NEXT_PUBLIC_DISABLE_GOOGLE_ONE_TAP: z.enum(['true', 'false']).transform((value) => value === 'true'),
        NEXT_PUBLIC_ENABLE_REACT_QUERY_DEVTOOLS: z
            .enum(['true', 'false'])
            .transform((value) => value === 'true'),
    },
    server: {
        SUPABASE_SERVICE_ROLE_KEY: z.string().trim().min(1),
        TRIGGER_PROJECT_REF: z.string().trim().min(1),
        TRIGGER_SECRET_KEY: z.string().trim().min(1),
        STRIPE_SECRET_KEY: z.string().trim().min(1),
        STRIPE_WEBHOOK_SECRET: z.string().trim().min(1),
        RESEND_API_KEY: z.string().trim().min(1),
        RESEND_FROM_EMAIL: z.email(),
        OPEN_AI_API_KEY: z.string().trim().min(1),
        GOOGLE_APPLICATION_CREDENTIALS_JSON_BASE64: z.string().trim().min(1),
        DEBUG_GOOGLE_DOCS_GENERATION: z.enum(['true', 'false']).transform((value) => value === 'true'),
    },
    runtimeEnv: {
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        NEXT_PUBLIC_FILE_UPLOAD_BUCKET: process.env.NEXT_PUBLIC_FILE_UPLOAD_BUCKET,
        NEXT_PUBLIC_FILE_UPLOAD_BUCKET_ALLOWED_MIME_TYPES:
            process.env.NEXT_PUBLIC_FILE_UPLOAD_BUCKET_ALLOWED_MIME_TYPES,
        NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        NEXT_PUBLIC_DISABLE_GOOGLE_ONE_TAP: process.env.NEXT_PUBLIC_DISABLE_GOOGLE_ONE_TAP,
        NEXT_PUBLIC_ENABLE_REACT_QUERY_DEVTOOLS: process.env.NEXT_PUBLIC_ENABLE_REACT_QUERY_DEVTOOLS,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
        TRIGGER_PROJECT_REF: process.env.TRIGGER_PROJECT_REF,
        TRIGGER_SECRET_KEY: process.env.TRIGGER_SECRET_KEY,
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
        STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
        RESEND_API_KEY: process.env.RESEND_API_KEY,
        RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
        OPEN_AI_API_KEY: process.env.OPEN_AI_API_KEY,
        GOOGLE_APPLICATION_CREDENTIALS_JSON_BASE64: process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON_BASE64,
        DEBUG_GOOGLE_DOCS_GENERATION: process.env.DEBUG_GOOGLE_DOCS_GENERATION,
    },
    emptyStringAsUndefined: true,
});
