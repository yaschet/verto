/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import { Body, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components';
import * as React from 'react';

type EmailLayoutProps = {
    preview: string;
    heading: string;
    children: React.ReactNode;
};

/**
 * Reusable email layout component for all transactional emails.
 * Provides consistent branding and structure across all email types.
 */
export function EmailLayout({ children, heading, preview }: EmailLayoutProps) {
    return (
        <Html>
            <Head />
            <Preview>{preview}</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* Header with branding */}
                    <Section style={header}>
                        <Heading style={h1}>Verto</Heading>
                    </Section>

                    {/* Main heading */}
                    <Section style={content}>
                        <Heading as="h2" style={h2}>
                            {heading}
                        </Heading>

                        {/* Content from child components */}
                        {children}
                    </Section>

                    {/* Footer */}
                    <Section style={footer}>
                        <Text style={footerText}>
                            © {new Date().getFullYear()} Verto. All rights reserved.
                        </Text>
                        <Text style={footerText}>Professional document translation service.</Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}

// Email styles
const main = {
    backgroundColor: '#f6f9fc',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '20px 0 48px',
    marginBottom: '64px',
    maxWidth: '600px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
};

const header = {
    padding: '32px 48px',
    borderBottom: '1px solid #e6ebf1',
};

const h1 = {
    color: '#1a202c',
    fontSize: '28px',
    fontWeight: 'bold',
    margin: '0',
    padding: '0',
};

const content = {
    padding: '32px 48px',
};

const h2 = {
    color: '#1a202c',
    fontSize: '24px',
    fontWeight: '600',
    lineHeight: '1.4',
    margin: '0 0 16px',
};

const footer = {
    padding: '24px 48px',
    borderTop: '1px solid #e6ebf1',
};

const footerText = {
    color: '#8898aa',
    fontSize: '12px',
    lineHeight: '16px',
    margin: '4px 0',
};
