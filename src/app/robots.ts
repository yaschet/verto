/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { APP_URL } from '@library/app';
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = APP_URL;

    return {
        host: baseUrl,
        rules: {
            allow: '/',
            disallow: '/downloads/',
            userAgent: '*',
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
