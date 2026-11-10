/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { Error404 } from '@components/pages/errors';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    description: 'Sorry, we couldn’t find the page you’re looking for.',
    title: '404 - Page not found',
};

export default function NotFound() {
    return <Error404 />;
}
