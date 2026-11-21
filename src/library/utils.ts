/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { createHash } from 'crypto';
import { passwordStrength } from 'check-password-strength';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { env } from '@/env';
import type { ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const checkPasswordStrength: (password: string) => {
    label: 'Too Weak' | 'Weak' | 'Medium' | 'Strong';
    value: number;
    color: 'primary' | 'secondary' | 'success' | 'destructive' | 'warning' | 'info';
} = (password: string) => {
    // Will return: Too Weak, Weak, Medium, Strong.

    // Advanced Password Strength.
    const advancedStrength = passwordStrength(password);

    // Basic Password Strength.
    switch (advancedStrength.value) {
        case 'Too weak':
            return { color: 'destructive', label: 'Too Weak', value: 1 };
        case 'Weak':
            return { color: 'warning', label: 'Weak', value: 2 };
        case 'Medium':
            return { color: 'info', label: 'Medium', value: 3 };
        case 'Strong':
            return { color: 'success', label: 'Strong', value: 4 };
        default:
            return { color: 'destructive', label: 'Too Weak', value: 1 };
    }
};

export const generateStrongPassword = () => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+{}:"<>?';
    let password = '';
    const length = 12;
    let isStrong = false;

    while (!isStrong) {
        password = '';
        for (let i = 0, n = charset.length; i < length; ++i) {
            password += charset.charAt(Math.floor(Math.random() * n));
        }

        isStrong = checkPasswordStrength(password).label === 'Strong';
    }

    return password;
};

export async function wait(duration: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, duration);
    });
}

export { wait as sleep };

export const generateGravatarUrl: (email: string) => string = (email) => {
    const emailString = email.trim().toLowerCase();
    const hash: string = createHash('sha256').update(emailString).digest('hex');
    return `https://www.gravatar.com/avatar/${hash}?d=404&s=480`;
};

export const generateGravatarProfileUrl: (email: string) => string = (email) => {
    if (!email || email === '') {
        return 'https://gravatar.com';
    }

    const emailString = email.trim().toLowerCase();
    const hash: string = createHash('sha256').update(emailString).digest('hex');
    return `https://www.gravatar.com/${hash}`;
};

/**
 * Get the range of items to display on a page.
 *
 * @category Utils/Pagination
 * @param page
 * @param limit
 */
export function getRange(page: number, limit: number) {
    const from = page;
    const to = page + limit - 1;

    return {
        start: from,
        end: to,
    };
}

/**
 * Check if the text is Arabic.
 * @param text
 */
export const isArabic = (text: string) => {
    const arabicPattern = /[\u0600-\u06FF\u0750-\u077F]/;
    return arabicPattern.test(text);
};

/**
 * Detect the operating system.
 * @returns 'macOS' | 'Windows' | 'Other'
 * @category Utils/OS
 */
export function getOS(): 'macOS' | 'Windows' | 'Other' {
    const userAgent = window.navigator.userAgent;
    if (userAgent.includes('Mac')) {
        return 'macOS';
    } else if (userAgent.includes('Win')) {
        return 'Windows';
    }
    return 'Other';
}

/**
 * Get the email provider URL.
 * @param email
 * @category Utils/Email
 * @returns string | null
 */
export function getEmailProviderURL(email: string): string | null {
    const emailDomain = email.split('@')[1];
    const appDomain: string = env.NEXT_PUBLIC_APP_URL.split('://')[1].split('/')[0] ?? '';
    const supabaseDomain: string = env.NEXT_PUBLIC_SUPABASE_URL.split('://')[1].split('/')[0] ?? '';

    const emailProviders: Record<string, string> = {
        'aol.com': 'https://mail.aol.com/',
        'example.com': 'https://mail.google.com/',
        'hotmail.com': 'https://outlook.live.com/',
        'icloud.com': 'https://www.icloud.com/mail/',
        'outlook.com': 'https://outlook.live.com/',
        'protonmail.com': 'https://mail.protonmail.com/',
        'yahoo.com': 'https://mail.yahoo.com/',
        'yandex.com': 'https://mail.yandex.com/',
    };

    const emailProvidersSniperLinks: Record<string, string> = {
        'example.com': `https://mail.google.com/mail/u/${email}/#search/from%3A${appDomain}+OR+from%3A${supabaseDomain}+in%3Aanywhere+newer_than%3A1d`,
        'icloud.com': `https://www.icloud.com/mail/#search/from%3A${appDomain}+OR+from%3A${supabaseDomain}`,
        'outlook.com': `https://outlook.live.com/mail/inbox/search?q=from%3A${appDomain}+OR+from%3A${supabaseDomain}`,
        'protonmail.com': `https://mail.protonmail.com/search?keyword=${appDomain}+OR+keyword=${supabaseDomain}`,
        'yahoo.com': `https://mail.yahoo.com/d/search/keyword=${appDomain}+OR+keyword=${supabaseDomain}`,
    };

    const emailProviderURL = emailProvidersSniperLinks[emailDomain] ?? emailProviders[emailDomain];

    if (process.env.NODE_ENV === 'development') {
        return `http://verto.local:54324/m/${email.split('@')[0]}`;
    } else if (emailProviderURL) {
        return emailProviderURL;
    }

    return null;
}
