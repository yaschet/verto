/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { APP_URL } from '@library/app';
import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl: string = APP_URL;

    return [
        // Home Page
        {
            changeFrequency: 'daily',
            lastModified: new Date().toISOString(),
            priority: 0.9,
            url: baseUrl,
        },
        // Contact Page
        {
            changeFrequency: 'daily',
            lastModified: new Date().toISOString(),
            priority: 0.9,
            url: `${baseUrl}/contact`,
        },
        // Sign In Page
        {
            changeFrequency: 'daily',
            lastModified: new Date().toISOString(),
            priority: 0.9,
            url: `${baseUrl}/auth/signin`,
        },
        // Sign Up Page
        {
            changeFrequency: 'daily',
            lastModified: new Date().toISOString(),
            priority: 0.9,
            url: `${baseUrl}/auth/signup`,
        },
        // Privacy Policy
        {
            changeFrequency: 'monthly',
            lastModified: new Date().toISOString(),
            priority: 0.5,
            url: `${baseUrl}/legal/privacy-policy`,
        },
        // Terms of Service
        {
            changeFrequency: 'monthly',
            lastModified: new Date().toISOString(),
            priority: 0.5,
            url: `${baseUrl}/legal/terms-of-service`,
        },
    ];
}
