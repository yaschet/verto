/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

const config = {
    plugins: {
        '@tailwindcss/postcss': {},
        ...(process.env.NODE_ENV === 'production' ? { cssnano: {} } : {}),
    },
};

export default config;
