/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { nextui } from '@nextui-org/theme';
import tailwindTypography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './src/**/*.{js,ts,jsx,tsx,mdx}',
        './node_modules/@nextui-org/theme/dist/components/(checkbox|pagination).js',
    ],

    plugins: [
        tailwindTypography,
        nextui({
            // NextUI theme configuration (if needed)
            // See: https://nextui.org/docs/customization/theme
        }),
    ],
};
