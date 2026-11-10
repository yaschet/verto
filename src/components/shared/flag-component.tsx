/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import * as Flags from 'country-flag-icons/react/1x1';

const LANGUAGE_TO_COUNTRY: Record<string, keyof typeof Flags> = {
    af: 'ZA',
    ar: 'SA',
    az: 'AZ',
    be: 'BY',
    bg: 'BG',
    bs: 'BA',
    ca: 'ES',
    ceb: 'PH',
    cs: 'CZ',
    cy: 'GB',
    da: 'DK',
    de: 'DE',
    el: 'GR',
    en: 'US',
    eo: 'AQ', // Antarctica as placeholder or just skip
    es: 'ES',
    et: 'EE',
    eu: 'ES',
    fa: 'IR',
    fi: 'FI',
    fil: 'PH',
    fr: 'FR',
    ga: 'IE',
    gl: 'ES',
    hi: 'IN',
    hr: 'HR',
    ht: 'HT',
    hu: 'HU',
    id: 'ID',
    is: 'IS',
    it: 'IT',
    iw: 'IL',
    he: 'IL',
    ja: 'JP',
    jv: 'ID',
    kk: 'KZ',
    ko: 'KR',
    ky: 'KG',
    la: 'VA',
    lt: 'LT',
    lv: 'LV',
    mk: 'MK',
    mn: 'MN',
    mr: 'IN',
    ms: 'MY',
    mt: 'MT',
    ne: 'NP',
    nl: 'NL',
    no: 'NO',
    pl: 'PL',
    ps: 'AF',
    pt: 'PT',
    ro: 'RO',
    ru: 'RU',
    sa: 'IN',
    sk: 'SK',
    sl: 'SI',
    sq: 'AL',
    sr: 'RS',
    sv: 'SE',
    sw: 'TZ',
    tl: 'PH',
    tr: 'TR',
    uk: 'UA',
    ur: 'PK',
    uz: 'UZ',
    vi: 'VN',
    yi: 'IL',
    zh: 'CN',
    zu: 'ZA',
};

export const getLanguageDetails = (languageCode: string) => {
    // Normalize code (lowercase)
    const normalizedCode = languageCode.toLowerCase();

    // Get country code from map or assume it matches (e.g. if we add more)
    // Cast to unknown then string to use as index, but verify existence
    let countryCode = LANGUAGE_TO_COUNTRY[normalizedCode];

    // Fallback: if not in map, maybe the language code IS a country code or close enough?
    // But usually language codes are lower case.

    if (!countryCode) {
        // Try uppercase as direct lookup if it happens to be valid country code
        const directCountry = normalizedCode.toUpperCase();
        if (directCountry in Flags) {
            countryCode = directCountry as keyof typeof Flags;
        }
    }

    const FlagComponent = countryCode ? Flags[countryCode] : null;

    return {
        FlagComponent,
        countryCode,
    };
};
