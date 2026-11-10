/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    validateUser: vi.fn(),
    createAdminClient: vi.fn(),
    createUser: vi.fn(),
}));
vi.mock('@/helpers/validate-user', () => ({ validateUser: mocks.validateUser }));
vi.mock('@/src/utils/supabase/server', () => ({ createAdminClient: mocks.createAdminClient }));
vi.mock('@/services/logger', () => ({
    getLogger: () => ({ error: vi.fn() }),
}));
vi.mock('@/src/errors/api-errors', () => ({
    isApiError: (value: unknown) => typeof value === 'object' && value !== null && 'error' in value,
    standardizeError: (details: Record<string, unknown>) => ({ ...details, error: true }),
}));

import { createUser } from '../src/actions/admin/users/create-user';

const account = {
    email: 'person@example.com',
    first_name: 'Sample',
    last_name: 'Person',
    role: 'USER' as const,
};

describe('administrator account creation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.validateUser.mockResolvedValue(undefined);
    });

    it.each([undefined, '', 'short'])(
        'rejects an absent or short password before creating an account',
        async (password) => {
            const result = await createUser({ ...account, password });
            expect(result).toMatchObject({ code: 'INVALID_PASSWORD', status: 400, error: true });
            expect(mocks.validateUser).toHaveBeenCalledWith({ requiredRole: 'ADMIN' });
            expect(mocks.createAdminClient).not.toHaveBeenCalled();
        },
    );

    it('passes the administrator-supplied password to authentication', async () => {
        const update = { eq: vi.fn().mockResolvedValue({ error: null }) };
        mocks.createUser.mockResolvedValue({ data: { user: { id: 'synthetic-account' } }, error: null });
        mocks.createAdminClient.mockResolvedValue({
            auth: { admin: { createUser: mocks.createUser } },
            from: () => ({ update: () => update, insert: async () => ({ error: null }) }),
        });
        const password = 'test test';
        const result = await createUser({ ...account, password });
        expect(result).toMatchObject({ code: 'USER_CREATED', success: true });
        expect(mocks.createUser).toHaveBeenCalledWith(expect.objectContaining({ password }));
    });
});
