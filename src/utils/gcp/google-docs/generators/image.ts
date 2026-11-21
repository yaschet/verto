/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { safeProviderError } from '@/services/log-safety';

import { docs_v1 } from 'googleapis';
import { ImageNode } from '@/engine/document/types';
import { createAdminClient } from '@/utils/supabase/server';

// We use the admin client for backend uploads to bypass RLS if needed,
// or ensuring we have write access to 'exports' bucket.

/**
 * Handles Image generation.
 * Uploads Base64 images to Supabase Storage and returns Signed URL.
 */
export async function generateImageRequests(
    node: ImageNode,
    startIndex: number,
    options?: { segmentId?: string },
): Promise<{ requests: docs_v1.Schema$Request[]; length: number }> {
    const requests: docs_v1.Schema$Request[] = [];
    let publicUrl = node.attrs.src;
    const locationProps = options?.segmentId ? { segmentId: options.segmentId } : {};

    // Initialize Supabase Client (Admin)
    const supabase = await createAdminClient();

    // 1. Check if Base64
    if (publicUrl.startsWith('data:image')) {
        try {
            // Extract content and mime type
            const matches = publicUrl.match(/^data:(.+);base64,(.+)$/);
            if (!matches) throw new Error('Invalid Base64 string');

            const mimeType = matches[1];
            const data = matches[2];
            const buffer = Buffer.from(data, 'base64');
            const ext = mimeType.split('/')[1] || 'png';

            // Upload to temp storage (expires/auto-cleaned ideally)
            // Using 'exports/temp' path
            const filename = `temp/img-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

            const { error: uploadError } = await supabase.storage
                .from('exports')
                .upload(filename, buffer, { contentType: mimeType, upsert: true });

            if (uploadError) throw uploadError;

            // Get Signed URL
            const { data: signedData, error: signError } = await supabase.storage
                .from('exports')
                .createSignedUrl(filename, 60 * 15); // 15 minutes

            if (signError || !signedData?.signedUrl) throw signError || new Error('No signed URL');

            publicUrl = signedData.signedUrl;
        } catch (error) {
            console.error('Failed to upload inline image:', safeProviderError(error));
            // Fallback? Cannot insert bad image.
            // Insert placeholder text?
            return {
                requests: [
                    {
                        insertText: {
                            text: '[IMAGE UPLOAD FAILED]',
                            location: { index: startIndex, ...locationProps },
                        },
                    },
                ],
                length: 21,
            };
        }
    }

    // 2. Insert Image (via URI)
    requests.push({
        insertInlineImage: {
            uri: publicUrl,
            location: { index: startIndex, ...locationProps },
            objectSize: {
                width: node.attrs.width ? { magnitude: node.attrs.width, unit: 'PT' } : undefined,
                height: node.attrs.height ? { magnitude: node.attrs.height, unit: 'PT' } : undefined,
            },
        },
    });

    // 3. Size of Image
    // An Inline Image acts like a character. Length = 1.
    return {
        requests,
        length: 1,
    };
}
