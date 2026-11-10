/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import type { NormalisedDocument } from '../src/engine/document/types';

const mocks = vi.hoisted(() => ({
    permission: vi.fn(),
    list: vi.fn(async () => ({ data: { files: [{ id: 'folder' }] } })),
    export: vi.fn(),
    upload: vi.fn(),
    sign: vi.fn(),
}));
vi.mock('@/env', () => ({ env: { DEBUG_GOOGLE_DOCS_GENERATION: false } }));
vi.mock('@utils/gcp/google-clients', () => ({ getGoogleAuth: vi.fn() }));
vi.mock('googleapis', () => ({
    google: {
        drive: () => ({
            files: {
                list: mocks.list,
                create: async () => ({
                    data: {
                        id: 'synthetic-doc',
                        webViewLink: 'https://docs.google.com/document/d/synthetic-doc/edit',
                    },
                }),
                export: mocks.export,
            },
            permissions: { create: mocks.permission },
        }),
        docs: () => ({ documents: { batchUpdate: vi.fn() } }),
    },
}));
vi.mock('../src/utils/gcp/google-docs/mapper', () => ({
    GoogleDocsMapper: class {
        async convert() {
            return { headerFooterRequests: [], bodyRequests: [] };
        }
    },
}));
vi.mock('@utils/supabase/server', () => ({
    createAdminClient: async () => ({
        from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: null }) }) }) }),
        storage: { from: () => ({ upload: mocks.upload, createSignedUrl: mocks.sign }) },
    }),
}));
vi.mock('@utils/gcp/drive/export-from-drive', () => ({
    exportGoogleDocToFormatWithRetry: async () => ({ success: false, error: 'Synthetic unavailable format' }),
    EXPORT_EXTENSIONS: {},
    getContentTypeForFormat: vi.fn(),
}));

import { generateGoogleDocAndExports } from '../src/utils/gcp/docx/functions/generate-google-doc-and-exports';

afterEach(() => vi.restoreAllMocks());

describe('Google Docs delivery', () => {
    it('grants link-viewer access and returns a separate copy link without recipient authentication', async () => {
        vi.spyOn(console, 'log').mockImplementation(() => undefined);
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        mocks.permission.mockResolvedValue({});
        mocks.export.mockResolvedValue({ data: Buffer.from('synthetic DOCX') });
        mocks.upload.mockResolvedValue({ error: null });
        mocks.sign.mockResolvedValue({ data: { signedUrl: 'https://storage.example.invalid/export' } });
        const document: NormalisedDocument = { type: 'doc', content: [], documentType: 'general' };
        const result = await generateGoogleDocAndExports(
            document,
            { id: 'owner' },
            'translation',
            undefined,
            {
                customerName: "Customer's \\ archive",
            },
        );
        expect(mocks.permission).toHaveBeenCalledExactlyOnceWith({
            fileId: 'synthetic-doc',
            requestBody: { role: 'reader', type: 'anyone', allowFileDiscovery: false },
        });
        expect(result.googleDocsEditUrl).toBe('https://docs.google.com/document/d/synthetic-doc/edit');
        expect(result.googleDocsCopyUrl).toBe('https://docs.google.com/document/d/synthetic-doc/copy');
        expect(mocks.list).toHaveBeenLastCalledWith({
            q: "mimeType = 'application/vnd.google-apps.folder' and name = 'Customer\\'s \\\\ archive' and trashed = false and 'folder' in parents",
            fields: 'files(id)',
            spaces: 'drive',
        });
    });
});
