/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

declare module '*.svg' {
    import type { StaticImageData } from 'next/image';
    const image: StaticImageData;
    export default image;
}
