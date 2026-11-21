/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { env } from '@/env';
import type { Metadata } from 'next';

export const APP_NAME = 'Verto';
export const APP_TITLE = 'Verto — Document translation, kept editable';
export const APP_DESCRIPTION =
    'Translate scanned documents, review structured text and tables, and generate editable exports.';
export const APP_URL = env.NEXT_PUBLIC_APP_URL;
export const APP_COLOR_SCHEME = 'light dark';
export const APP_THEME_COLOR = '#087f5b';
export const APP_REFERRER = 'origin';
export const APP_TYPE = 'website';
export const APP_SITENAME = APP_NAME;
export const APP_AUTHORS: Metadata['authors'] = [{ name: 'Yassine Chettouch', url: 'https://yaschet.com' }];
export const APP_ROBOTS: Metadata['robots'] = { index: false, follow: false };
export const APP_KEYWORDS = ['document translation', 'editable tables', 'structured documents', 'Verto'];
export const APP_OG_IMAGES = [
    { alt: 'Verto document translation', height: 640, width: 1280, url: '/social-preview.png' },
];
