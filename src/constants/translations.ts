/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { parse } from 'bcp-47';
import { getLanguage } from 'language-flag-colors';
import type { Language, LanguageIds } from 'language-flag-colors';

export enum BCP_47_SUPPORTED_LANGUAGE {
    Afrikaans = 'af',
    Arabic = 'ar',
    Azerbaijani = 'az',
    // AzerbaijaniCyrillic = 'az-Cyrl',
    Belarusian = 'be',
    Bulgarian = 'bg',
    Bosnian = 'bs',
    Catalan = 'ca',
    Cebuano = 'ceb',
    Czech = 'cs',
    Welsh = 'cy',
    Danish = 'da',
    German = 'de',
    Greek = 'el',
    English = 'en',
    Esperanto = 'eo',
    Spanish = 'es',
    Estonian = 'et',
    Basque = 'eu',
    Persian = 'fa',
    Finnish = 'fi',
    Filipino = 'fil',
    French = 'fr',
    Irish = 'ga',
    Galician = 'gl',
    Hindi = 'hi',
    Croatian = 'hr',
    HaitianCreole = 'ht',
    Hungarian = 'hu',
    Indonesian = 'id',
    Icelandic = 'is',
    Italian = 'it',
    Hebrew = 'iw',
    Japanese = 'ja',
    Javanese = 'jv',
    Kazakh = 'kk',
    Korean = 'ko',
    Kyrgyz = 'ky',
    Latin = 'la',
    Lithuanian = 'lt',
    Latvian = 'lv',
    Macedonian = 'mk',
    Mongolian = 'mn',
    Marathi = 'mr',
    Malay = 'ms',
    Maltese = 'mt',
    Nepali = 'ne',
    Dutch = 'nl',
    Norwegian = 'no',
    Polish = 'pl',
    Pashto = 'ps',
    Portuguese = 'pt',
    Romanian = 'ro',
    Russian = 'ru',
    // RussianPetrine = 'ru-PETR1708',
    Sanskrit = 'sa',
    Slovak = 'sk',
    Slovenian = 'sl',
    Albanian = 'sq',
    Serbian = 'sr',
    Swedish = 'sv',
    Swahili = 'sw',
    Tagalog = 'tl',
    Turkish = 'tr',
    Ukrainian = 'uk',
    Urdu = 'ur',
    Uzbek = 'uz',
    // UzbekCyrillic = 'uz-Cyrl',
    Vietnamese = 'vi',
    Yiddish = 'yi',
    ChineseSimplified = 'zh',
    // ChineseTraditional = 'zh-Hant',
    Zulu = 'zu',
}

export type ExtendedLanguageIds = {
    bcp_47_code: BCP_47_SUPPORTED_LANGUAGE;
} & LanguageIds;

export type SupportedLanguageType = {
    ids: ExtendedLanguageIds;
} & Omit<Language, 'ids'>;

export const FULL_LIST_OF_LANGUAGES: Record<BCP_47_SUPPORTED_LANGUAGE, SupportedLanguageType> = Object.values(
    BCP_47_SUPPORTED_LANGUAGE,
).reduce(
    (acc, lang) => {
        const bcp47 = parse(lang);
        const language = getLanguage(bcp47?.language ?? lang) as Language;

        if (!language) {
            return acc;
        }

        acc[lang] = {
            ...language,
            ids: {
                ...language?.ids,
                bcp_47_code: lang,
            },
        };
        return acc;
    },
    {} as Record<BCP_47_SUPPORTED_LANGUAGE, SupportedLanguageType>,
);

function filterLanguages(languages: SupportedLanguageType[]): SupportedLanguageType[] {
    const uniqueNames = new Set<string>();
    const uniqueCodes = new Set<string>();

    return languages
        .filter((lang) => lang !== null && lang !== undefined)
        .filter((lang) => {
            const isUnique = !uniqueNames.has(lang.name) && !uniqueCodes.has(lang.ids.bcp_47_code);
            uniqueNames.add(lang.name);
            uniqueCodes.add(lang.ids.bcp_47_code);
            return isUnique;
        })
        .sort((a, b) => a.name.localeCompare(b.name))
        .sort((a, b) => (a.name === 'English' ? -1 : b.name === 'English' ? 1 : 0));
}

export const AVAILABLE_SOURCE_LANGUAGES: Language[] = [
    ...filterLanguages([...Object.values(FULL_LIST_OF_LANGUAGES)]),
];

export const AVAILABLE_TARGET_LANGUAGES: Language[] = [
    ...filterLanguages([...Object.values(FULL_LIST_OF_LANGUAGES)]),
];

/**
 * Auto-detect source language constant.
 * When selected, the AI will detect the source language automatically.
 */
export const AUTO_DETECT_LANGUAGE = 'auto' as const;

/**
 * Type for source language that includes auto-detect option.
 */
export type SourceLanguageValue = typeof AUTO_DETECT_LANGUAGE | BCP_47_SUPPORTED_LANGUAGE;

/**
 * Simplified type for auto-detect option (doesn't need all Language fields).
 */
export type AutoDetectLanguageOption = {
    name: string;
    nativeName: string;
    flag?: { image?: string };
    ids: {
        ISO_639_1: string;
        bcp_47_code: string;
    };
};

/**
 * Special language option for auto-detect.
 * Uses 'auto' as the BCP-47 code which will be handled specially by the translation system.
 */
export const AUTO_DETECT_LANGUAGE_OPTION: AutoDetectLanguageOption = {
    name: 'Auto-detect',
    nativeName: 'Automatic',
    flag: undefined,
    ids: {
        ISO_639_1: AUTO_DETECT_LANGUAGE,
        bcp_47_code: AUTO_DETECT_LANGUAGE,
    },
};

/**
 * Union type for source language options (auto-detect + regular languages).
 */
export type SourceLanguageOption = AutoDetectLanguageOption | Language;

/**
 * Source languages with auto-detect at the top.
 * Use this for the source language selector.
 */
export const AVAILABLE_SOURCE_LANGUAGES_WITH_AUTO: SourceLanguageOption[] = [
    AUTO_DETECT_LANGUAGE_OPTION,
    ...AVAILABLE_SOURCE_LANGUAGES,
];

/**
 * Default language preferences for new users.
 */
export const DEFAULT_SOURCE_LANGUAGE = AUTO_DETECT_LANGUAGE;
export const DEFAULT_TARGET_LANGUAGE = BCP_47_SUPPORTED_LANGUAGE.French;

/**
 * RTL (Right-to-Left) Languages.
 * These languages require special handling for text direction in documents.
 */
export const RTL_LANGUAGES: BCP_47_SUPPORTED_LANGUAGE[] = [
    BCP_47_SUPPORTED_LANGUAGE.Arabic, // ar
    BCP_47_SUPPORTED_LANGUAGE.Hebrew, // iw; the language also uses 'he'
    BCP_47_SUPPORTED_LANGUAGE.Persian, // fa (Farsi)
    BCP_47_SUPPORTED_LANGUAGE.Urdu, // ur
    BCP_47_SUPPORTED_LANGUAGE.Pashto, // ps
    BCP_47_SUPPORTED_LANGUAGE.Yiddish, // yi
];

/**
 * Check if a language code is an RTL language.
 *
 * @param languageCode - BCP-47 language code (e.g., 'ar', 'he', 'fa')
 * @returns true if the language is RTL, false otherwise
 */
export function isRTLLanguage(languageCode: string): boolean {
    // Normalize: handle 'he' as alias for 'iw' (Hebrew)
    // Also handle locale codes (e.g., 'ar-SA' -> 'ar') to ensure they match base RTL languages
    const baseCode = languageCode.split('-')[0].toLowerCase();
    const normalizedCode = baseCode === 'he' ? 'iw' : baseCode;

    return RTL_LANGUAGES.includes(normalizedCode as BCP_47_SUPPORTED_LANGUAGE);
}

/**
 * Get text direction for a language.
 *
 * @param languageCode - BCP-47 language code
 * @returns 'rtl' for RTL languages, 'ltr' for LTR languages
 */
export function getTextDirection(languageCode: string): 'ltr' | 'rtl' {
    return isRTLLanguage(languageCode) ? 'rtl' : 'ltr';
}

// Simple mapping for common languages to country codes for flags
export const COUNTRY_CODE_MAPPING: Record<string, string> = {
    en: 'US',
    fr: 'FR',
    es: 'ES',
    de: 'DE',
    it: 'IT',
    pt: 'PT',
    ru: 'RU',
    zh: 'CN',
    ja: 'JP',
    ko: 'KR',
    ar: 'SA',
    hi: 'IN',
    nl: 'NL',
    pl: 'PL',
    tr: 'TR',
    vi: 'VN',
    th: 'TH',
    id: 'ID',
    sv: 'SE',
    da: 'DK',
    fi: 'FI',
    no: 'NO',
    cs: 'CZ',
    el: 'GR',
    he: 'IL',
    ro: 'RO',
    hu: 'HU',
    sk: 'SK',
    uk: 'UA',
    bg: 'BG',
    hr: 'HR',
    lt: 'LT',
    lv: 'LV',
    et: 'EE',
    sl: 'SI',
    sr: 'RS',
    fa: 'IR',
    ur: 'PK',
    ms: 'MY',
    tl: 'PH',
    sw: 'KE',
};

// Language helper utility to get display name and country code for flags
export const getLanguageDetails = (code: string | null | undefined, isSource: boolean = false) => {
    if (!code || code === AUTO_DETECT_LANGUAGE) {
        return {
            name: 'Auto-detect',
            isAuto: true,
            countryCode: null,
        };
    }

    const list = isSource ? AVAILABLE_SOURCE_LANGUAGES_WITH_AUTO : AVAILABLE_TARGET_LANGUAGES;
    const lang = list.find(
        (l) => l.ids?.ISO_639_1 === code || (l.ids as { bcp_47_code?: string })?.bcp_47_code === code,
    );
    const countryCode = COUNTRY_CODE_MAPPING[code.toLowerCase()] || code.toUpperCase();

    return {
        name: lang?.name || code,
        isAuto: false,
        countryCode,
    };
};
