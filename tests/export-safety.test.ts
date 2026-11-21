/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/env', () => ({ env: { NEXT_PUBLIC_SUPABASE_URL: 'https://storage.example.invalid' } }));

import { downloadBrandingImage } from '../src/utils/gcp/docx/functions/download-branding-image';

const imageUrl = 'https://storage.example.invalid/storage/v1/object/public/document_logos/owner/logo.png';
const fetchImage = vi.fn<typeof fetch>();

describe('branding image download boundary', () => {
    beforeEach(() => vi.stubGlobal('fetch', fetchImage.mockReset()));
    afterEach(() => vi.unstubAllGlobals());

    it.each([
        imageUrl.replace('storage.example.invalid', 'storage.example.invalid.attacker.invalid'),
        imageUrl.replace('storage.example.invalid', 'attacker.invalid'),
        imageUrl.replace('https:', 'http:'),
        imageUrl.replace('https://', 'https://person:credential@'),
        imageUrl.replace('storage.example.invalid/', 'storage.example.invalid:444/'),
        imageUrl.replace('/document_logos/', '/document_stamps/'),
        imageUrl.replace('/owner/', '/someone-else/'),
        imageUrl.replace('/owner/logo.png', '/owner/%2e%2e/other/logo.png'),
    ])('rejects an untrusted or unowned URL before I/O: %s', async (url) => {
        await expect(downloadBrandingImage(url, 'document_logos', 'owner')).rejects.toThrow();
        expect(fetchImage).not.toHaveBeenCalled();
    });

    it('downloads a matching owned image with redirects disabled and a timeout', async () => {
        fetchImage.mockResolvedValue(
            new Response('synthetic image', { headers: { 'content-type': 'image/png' } }),
        );
        const result = await downloadBrandingImage(imageUrl, 'document_logos', 'owner');
        expect(result).toEqual({ buffer: Buffer.from('synthetic image'), mimeType: 'image/png' });
        expect(fetchImage).toHaveBeenCalledWith(
            new URL(imageUrl),
            expect.objectContaining({ redirect: 'error', signal: expect.any(AbortSignal) }),
        );
    });

    it.each([
        new Response('redirect', { status: 302, headers: { location: 'https://other.example.invalid/' } }),
        new Response('not an image', { headers: { 'content-type': 'text/html' } }),
        new Response('image', {
            headers: { 'content-type': 'image/png', 'content-length': String(2 * 1024 * 1024 + 1) },
        }),
        new Response('', { headers: { 'content-type': 'image/png' } }),
    ])('rejects redirects, unsupported types, declared oversize and empty images', async (response) => {
        fetchImage.mockResolvedValue(response);
        await expect(downloadBrandingImage(imageUrl, 'document_logos', 'owner')).rejects.toThrow();
        expect(fetchImage).toHaveBeenCalledTimes(1);
    });

    it('enforces the byte cap even without Content-Length', async () => {
        const cancel = vi.fn();
        let sent = false;
        const stream = new ReadableStream<Uint8Array>({
            pull(controller) {
                if (!sent) {
                    sent = true;
                    controller.enqueue(new Uint8Array(2 * 1024 * 1024 + 1));
                }
            },
            cancel,
        });
        fetchImage.mockResolvedValue(new Response(stream, { headers: { 'content-type': 'image/png' } }));
        await expect(downloadBrandingImage(imageUrl, 'document_logos', 'owner')).rejects.toThrow(
            'exceeds 2 MiB',
        );
        expect(cancel).toHaveBeenCalledOnce();
    });
});
