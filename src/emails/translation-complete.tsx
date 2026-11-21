/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { Button, Hr, Link, Section, Text } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from '@/emails/components/email-layout';

type TranslationCompleteEmailProps = {
    translationId: string;
    displayName: string;
    sourceLanguage: string;
    targetLanguage: string;
    reviewUrl: string;
    downloadUrl?: string;
};

/**
 * Email sent when a translation task completes successfully.
 * Includes links to review and download the translated document.
 */
export function TranslationCompleteEmail({
    displayName,
    downloadUrl,
    reviewUrl,
    sourceLanguage,
    targetLanguage,
    translationId,
}: TranslationCompleteEmailProps) {
    const preview = `Your translation "${displayName}" is ready for review`;

    return (
        <EmailLayout heading="Translation Complete!" preview={preview}>
            <Text style={paragraph}>
                Your document translation has been completed successfully and is ready for your review.
            </Text>

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
            </Section>

            <Section style={ctaSection}>
                <Button href={reviewUrl} style={button}>
                    Review Translation
                </Button>
            </Section>

            {downloadUrl && (
                <Section style={linkSection}>
                    <Text style={paragraph}>
                        You can also{' '}
                        <Link href={downloadUrl} style={link}>
                            download the translated document
                        </Link>{' '}
                        directly.
                    </Text>
                </Section>
            )}

            <Hr style={divider} />

            <Text style={footerNote}>
                If you have any questions or need assistance, please don't hesitate to contact our support
                team.
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

const linkSection = {
    textAlign: 'center' as const,
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

export default TranslationCompleteEmail;
