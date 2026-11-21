/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { APP_DESCRIPTION, APP_NAME, APP_THEME_COLOR } from '@library/app';
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        background_color: '#ffffff',
        description: APP_DESCRIPTION,
        display: 'standalone',
        icons: [
            {
                sizes: '192x192',
                src: '/icons/verto-favicon-mark-light-192.png',
                type: 'image/png',
            },
            {
                sizes: '512x512',
                src: '/icons/verto-favicon-mark-light-512.png',
                type: 'image/png',
            },
        ],
        name: APP_NAME,
        short_name: APP_NAME,
        start_url: '/',
        theme_color: APP_THEME_COLOR,
    };
}
