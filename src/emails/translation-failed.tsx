/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { Button, Hr, Link, Section, Text } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from '@/emails/components/email-layout';

type TranslationFailedEmailProps = {
    translationId: string;
    displayName: string;
    sourceLanguage: string;
    targetLanguage: string;
    errorMessage?: string;
    supportUrl: string;
    dashboardUrl: string;
};

/**
 * Email sent when a translation task fails after all retry attempts.
 * Includes error details and links to support and dashboard.
 */
export function TranslationFailedEmail({
    dashboardUrl,
    displayName,
    errorMessage,
    sourceLanguage,
    supportUrl,
    targetLanguage,
    translationId,
}: TranslationFailedEmailProps) {
    const preview = `Translation failed: "${displayName}"`;

    return (
        <EmailLayout heading="Translation Failed" preview={preview}>
            <Text style={paragraph}>
                We encountered an issue while processing your document translation. Our team has been notified
                and will investigate the issue.
            </Text>

            <Section style={alertBox}>
                <Text style={alertText}>
                    Your credits have been automatically refunded and are available for use on other
                    translations.
                </Text>
            </Section>

            <Section style={detailsSection}>
                <Text style={detailLabel}>Document:</Text>
                <Text style={detailValue}>{displayName}</Text>

                <Hr style={divider} />

                <Text style={detailLabel}>Translation ID:</Text>
                <Text style={detailValue}>{translationId}</Text>

                <Hr style={divider} />

                <Text style={detailLabel}>Languages:</Text>
                <Text style={detailValue}>
                    {sourceLanguage.toUpperCase()} → {targetLanguage.toUpperCase()}
                </Text>

                {errorMessage && (
                    <>
                        <Hr style={divider} />
                        <Text style={detailLabel}>Error Details:</Text>
                        <Text style={errorText}>{errorMessage}</Text>
                    </>
                )}
            </Section>

            <Section style={ctaSection}>
                <Button href={dashboardUrl} style={button}>
                    View Dashboard
                </Button>
            </Section>

            <Hr style={divider} />

            <Text style={footerNote}>
                If you need assistance or would like to try again, please{' '}
                <Link href={supportUrl} style={link}>
                    contact our support team
                </Link>
                . We're here to help!
            </Text>
        </EmailLayout>
    );
}

// Component styles
const paragraph = {
    color: '#525f7f',
    fontSize: '16px',
    lineHeight: '24px',
    textAlign: 'left' as const,
    margin: '0 0 16px',
};

const alertBox = {
    backgroundColor: '#fef3c7',
    border: '1px solid #f59e0b',
    borderRadius: '4px',
    padding: '16px',
    marginTop: '24px',
    marginBottom: '24px',
};

const alertText = {
    color: '#92400e',
    fontSize: '14px',
    fontWeight: '500',
    margin: '0',
    textAlign: 'center' as const,
};

const detailsSection = {
    backgroundColor: '#f7fafc',
    borderRadius: '4px',
    padding: '24px',
    marginTop: '24px',
    marginBottom: '24px',
};

const detailLabel = {
    color: '#718096',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    margin: '0 0 4px',
};

const detailValue = {
    color: '#1a202c',
    fontSize: '16px',
    fontWeight: '500',
    margin: '0 0 16px',
};

const errorText = {
    color: '#dc2626',
    fontSize: '14px',
    fontWeight: '400',
    fontFamily: 'monospace',
    backgroundColor: '#fef2f2',
    padding: '12px',
    borderRadius: '4px',
    margin: '0',
};

const divider = {
    borderColor: '#e2e8f0',
    margin: '16px 0',
};

const ctaSection = {
    textAlign: 'center' as const,
    marginTop: '32px',
    marginBottom: '32px',
};

const button = {
    backgroundColor: '#3b82f6',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '600',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '14px 32px',
};

const link = {
    color: '#3b82f6',
    textDecoration: 'underline',
};

const footerNote = {
    color: '#718096',
    fontSize: '14px',
    lineHeight: '20px',
    marginTop: '32px',
    textAlign: 'center' as const,
};

export default TranslationFailedEmail;
