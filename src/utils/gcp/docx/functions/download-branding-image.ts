/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { env } from '@/env';

type BrandingBucket = 'document_logos' | 'document_stamps';
const maxImageBytes = 2 * 1024 * 1024;
const imageTypes = new Set(['image/png', 'image/jpeg', 'image/svg+xml']);

/** Downloads an owner's branding image from the configured storage origin, bounded to 2 MiB. */
export async function downloadBrandingImage(
    fullUrl: string,
    bucket: BrandingBucket,
    ownerId: string,
): Promise<{ buffer: Buffer; mimeType: string }> {
    const url = new URL(fullUrl);
    const storage = new URL(env.NEXT_PUBLIC_SUPABASE_URL);
    const prefix = `/storage/v1/object/public/${bucket}/`;
    const path = decodeURIComponent(url.pathname);
    const objectPath = path.slice(prefix.length);
    const segments = objectPath.split('/');
    if (
        url.protocol !== 'https:' ||
        url.origin !== storage.origin ||
        url.hostname !== storage.hostname ||
        url.username ||
        url.password ||
        !path.startsWith(prefix) ||
        segments[0] !== ownerId ||
        segments.length < 2 ||
        segments.some((segment) => !segment || segment === '.' || segment === '..' || segment.includes('\\'))
    ) {
        throw new Error('Branding image must be an owned object on the configured storage host');
    }

    const response = await fetch(url, {
        redirect: 'error',
        signal: AbortSignal.timeout(10_000),
        headers: { 'User-Agent': 'GoogleDocs-ImageFetcher/1.0' },
    });
    if (!response.ok) {
        await response.body?.cancel();
        throw new Error(`Branding image download failed (${response.status})`);
    }
    const mimeType = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    const contentLength = Number(response.headers.get('content-length'));
    if (!imageTypes.has(mimeType) || contentLength > maxImageBytes) {
        await response.body?.cancel();
        throw new Error('Branding image has an unsupported content type or exceeds 2 MiB');
    }
    if (!response.body) throw new Error('Branding image response is empty');

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let length = 0;
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            length += value.byteLength;
            if (length > maxImageBytes) {
                await reader.cancel();
                throw new Error('Branding image exceeds 2 MiB');
            }
            chunks.push(value);
        }
    } finally {
        reader.releaseLock();
    }
    if (!length) throw new Error('Branding image response is empty');
    return { buffer: Buffer.concat(chunks, length), mimeType };
}
