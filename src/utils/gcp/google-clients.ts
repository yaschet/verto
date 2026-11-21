/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { google } from 'googleapis';
import { z } from 'zod';
import { env } from '@/env';

const credentialsSchema = z.object({
    client_email: z.string().email(),
    private_key: z.string().min(1),
    project_id: z.string().min(1).optional(),
});
let auth: ReturnType<typeof createGoogleAuth> | undefined;

/** Creates the export adapter only when an export runs; builds need no service credentials. */
function createGoogleAuth() {
    const credentials = credentialsSchema.parse(
        JSON.parse(Buffer.from(env.GOOGLE_APPLICATION_CREDENTIALS_JSON_BASE64, 'base64').toString('utf8')),
    );
    return new google.auth.GoogleAuth({
        credentials,
        scopes: [
            'https://www.googleapis.com/auth/cloud-platform',
            'https://www.googleapis.com/auth/drive.file',
            'https://www.googleapis.com/auth/documents',
        ],
    });
}

export function getGoogleAuth() {
    auth ??= createGoogleAuth();
    return auth;
}
