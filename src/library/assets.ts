/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import FullLogoAccentDark from '@public/brand/verto-full-logo-accent-dark.svg';
import FullLogoAccentLight from '@public/brand/verto-full-logo-accent-light.svg';
import FullLogoMonoDark from '@public/brand/verto-full-logo-mono-dark.svg';
import FullLogoMonoLight from '@public/brand/verto-full-logo-mono-light.svg';

import LogoMarkDark from '@public/brand/verto-logo-mark-dark.svg';
import LogoMarkLight from '@public/brand/verto-logo-mark-light.svg';
import LogoMarkAccentDark from '@public/brand/verto-logo-mark-accent-dark.svg';
import LogoMarkAccentLight from '@public/brand/verto-logo-mark-accent-light.svg';
import LogoMarkMonoDark from '@public/brand/verto-logo-mark-mono-dark.svg';
import LogoMarkMonoLight from '@public/brand/verto-logo-mark-mono-light.svg';

import FaviconMarkDark from '@public/brand/verto-favicon-mark-dark.svg';
import FaviconMarkLight from '@public/brand/verto-favicon-mark-light.svg';

export const VertoAssets = {
    Logo: {
        Full: {
            Dark: FullLogoAccentDark,
            Light: FullLogoAccentLight,
            Accent: {
                Dark: FullLogoAccentDark,
                Light: FullLogoAccentLight,
            },
            Mono: {
                Dark: FullLogoMonoDark,
                Light: FullLogoMonoLight,
            },
        },
        Icon: {
            Dark: LogoMarkDark,
            Light: LogoMarkLight,
            Accent: {
                Dark: LogoMarkAccentDark,
                Light: LogoMarkAccentLight,
            },
            Mono: {
                Dark: LogoMarkMonoDark,
                Light: LogoMarkMonoLight,
            },
        },
        Favicon: {
            Dark: FaviconMarkDark,
            Light: FaviconMarkLight,
        },
    },
};
