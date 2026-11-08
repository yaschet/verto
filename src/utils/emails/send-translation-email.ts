/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { env } from '@/env';
import { render } from '@react-email/components';
import { Resend } from 'resend';
import { TranslationCompleteEmail } from '@/src/emails/translation-complete';
import { TranslationFailedEmail } from '@/src/emails/translation-failed';
import type { Tables } from '@/types/database/database';

/**
 * Initialize Resend client with API key from environment.
 * RESEND_API_KEY must be set in environment variables.
 */
const resend = new Resend(env.RESEND_API_KEY);

/**
 * Default sender email for transactional emails.
 * Should be a verified domain in Resend.
 */
const FROM_EMAIL = env.RESEND_FROM_EMAIL;

/**
 * Base URL for the application (used for generating links in emails).
 */
const APP_BASE_URL = env.NEXT_PUBLIC_APP_URL;

type SendTranslationCompleteEmailParams = {
    to: string;
    translation: Tables<'translations'>;
    profileName?: string;
};

type SendTranslationFailedEmailParams = {
    to: string;
    translation: Tables<'translations'>;
    errorMessage?: string;
    profileName?: string;
};

/**
 * Send email notification when translation completes successfully.
 * Includes links to review and download the translated document.
 *
 * @param params - Email parameters including recipient and translation details
 * @returns Resend response with email ID
 */
export async function sendTranslationCompleteEmail({ to, translation }: SendTranslationCompleteEmailParams) {
    const reviewUrl = `${APP_BASE_URL}/app/translations/${translation.id}`;
    const downloadUrl =
        (translation as typeof translation & { generated_file_url?: string }).generated_file_url || undefined;

    const emailHtml = await render(
        TranslationCompleteEmail({
            translationId: translation.id,
            displayName: translation.display_name,
            sourceLanguage: translation.source_language,
            targetLanguage: translation.target_language,
            reviewUrl,
            downloadUrl,
        }),
    );

    const subject = `Translation Complete: ${translation.display_name}`;

    return resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject,
        html: emailHtml,
        tags: [
            {
                name: 'category',
                value: 'translation-complete',
            },
            {
                name: 'translation_id',
                value: translation.id,
            },
        ],
    });
}

/**
 * Send email notification when translation fails after all retry attempts.
 * Includes error details and support links. Credits are automatically refunded.
 *
 * @param params - Email parameters including recipient and translation details
 * @returns Resend response with email ID
 */
export async function sendTranslationFailedEmail({
    errorMessage,
    to,
    translation,
}: SendTranslationFailedEmailParams) {
    const dashboardUrl = `${APP_BASE_URL}/app/translations`;
    const supportUrl = `${APP_BASE_URL}/support`;

    const emailHtml = await render(
        TranslationFailedEmail({
            translationId: translation.id,
            displayName: translation.display_name,
            sourceLanguage: translation.source_language,
            targetLanguage: translation.target_language,
            errorMessage,
            supportUrl,
            dashboardUrl,
        }),
    );

    const subject = `Translation Failed: ${translation.display_name}`;

    return resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject,
        html: emailHtml,
        tags: [
            {
                name: 'category',
                value: 'translation-failed',
            },
            {
                name: 'translation_id',
                value: translation.id,
            },
        ],
    });
}

/**
 * Helper function to safely send email and log any errors.
 * Used in Trigger.dev tasks to prevent email failures from affecting task completion.
 *
 * @param emailFn - Email sending function to execute
 * @param context - Context string for logging (e.g., "translation-complete")
 */
export async function sendEmailSafely(
    emailFn: () => Promise<unknown>,
    context: string,
): Promise<{ success: boolean; error?: string }> {
    try {
        await emailFn();
        return { success: true };
    } catch (error) {
        console.error(`Failed to send ${context} email:`, error);
        return {
            success: false,
            error: error instanceof Error ? (error as Error).message : String(error),
        };
    }
}
