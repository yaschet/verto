/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { ImageResponse } from 'next/og';
import { APP_TITLE, APP_DESCRIPTION } from '@library/app';

export const runtime = 'nodejs';

export function GET() {
    return new ImageResponse(
        (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    background: '#f6f8f7',
                    padding: 72,
                    width: '100%',
                    height: '100%',
                    color: '#103c2f',
                }}
            >
                <div style={{ fontSize: 32 }}>Verto / Source-available</div>
                <div style={{ fontSize: 76, lineHeight: 1.1 }}>{APP_TITLE}</div>
                <div style={{ fontSize: 26 }}>{APP_DESCRIPTION}</div>
            </div>
        ),
        { width: 1280, height: 640 },
    );
}
