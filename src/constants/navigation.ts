/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

export const NAVIGATION_SHORTCUTS: Record<
    'translate' | 'account' | 'billing' | 'settings' | 'signOut',
    { mac: string; win: string; link: string; description: string }
> = {
    translate: {
        mac: '⌥⇧T',
        win: 'Alt + Shift + T',
        link: '/app/translations/new',
        description: 'Navigate to the translation page.',
    },
    account: {
        mac: '⌥⇧A',
        win: 'Alt + Shift + A',
        link: '/account',
        description: 'Navigate to the account page.',
    },
    billing: {
        mac: '⌥B',
        win: 'Alt + B',
        link: '/account/billing',
        description: 'Navigate to the billing page.',
    },
    settings: {
        mac: '⌥⇧S',
        win: 'Alt + Shift + S',
        link: '/account/settings',
        description: 'Navigate to the settings page.',
    },
    signOut: {
        mac: '⌥⇧Q',
        win: 'Alt + Shift + Q',
        link: '/auth/logout',
        description: 'Sign out of your account.',
    },
};
