/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@utils/supabase/middleware';

export default async function proxy(request: NextRequest) {
    if (request.nextUrl.pathname === '/' || request.nextUrl.pathname.startsWith('/preview')) {
        return NextResponse.next();
    }
    return updateSession(request);
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
         * - api routes
         * - fonts
         * - sitemap.xml
         * - robots.txt
         * - manifest.json
         * - .well-known (for SSL certificates and other well-known paths)
         * - .css, .js, .json (static assets)
         * - .md, .mdx (markdown files)
         * - .pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx (document files)
         * - .zip, .tar, .gz, .rar (archive files)
         * - .mp3, .wav, .ogg, .flac (audio files)
         * - .mp4, .avi, .mov, .flv (video files)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|json|md|mdx|pdf|doc|docx|xls|xlsx|ppt|pptx|zip|tar|gz|rar|mp3|wav|ogg|flac|mp4|avi|mov|wmv|flv)$|api/.*|fonts/.*|sitemap.xml|robots.txt|manifest.json|\\.well-known/.*).*)',
    ],
};
