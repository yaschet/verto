/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

'use client';

import { useState, type ReactNode } from 'react';
import Image from 'next/image';
import type { JSONContent } from '@tiptap/core';
import { TranslationEditor } from '@/components/translations/translation-editor/translation-editor';
import english from '../../../fixtures/structured-report.json';
import arabic from '../../../fixtures/arabic-report.json';
import cjk from '../../../fixtures/cjk-report.json';
import './preview.css';

const documents = {
    English: { document: english, direction: 'ltr' as const },
    العربية: { document: arabic, direction: 'rtl' as const },
    日本語: { document: cjk, direction: 'ltr' as const },
};
type Language = keyof typeof documents;

function DocumentNode({ node }: { node: JSONContent }): ReactNode {
    const children = node.content?.map((child, index) => <DocumentNode key={index} node={child} />);
    switch (node.type) {
        case 'text':
            return node.text;
        case 'heading':
            return <h2>{children}</h2>;
        case 'paragraph':
            return <p>{children}</p>;
        case 'table':
            return (
                <table>
                    <tbody>{children}</tbody>
                </table>
            );
        case 'tableRow':
            return <tr>{children}</tr>;
        case 'tableCell':
            return (
                <td colSpan={node.attrs?.colspan} rowSpan={node.attrs?.rowspan}>
                    {children}
                </td>
            );
        case 'tableHeader':
            return (
                <th colSpan={node.attrs?.colspan} rowSpan={node.attrs?.rowspan}>
                    {children}
                </th>
            );
        case 'bulletList':
            return <ul>{children}</ul>;
        case 'orderedList':
            return <ol>{children}</ol>;
        case 'listItem':
            return <li>{children}</li>;
        default:
            return <>{children}</>;
    }
}

/** A local editor demonstration backed entirely by synthetic fixtures. */
export default function Preview() {
    const [language, setLanguage] = useState<Language>('English');
    const [dark, setDark] = useState(false);
    const [changed, setChanged] = useState(false);
    const selected = documents[language];
    return (
        <main className={`verto-preview ${dark ? 'dark' : ''}`}>
            <header className="preview-header">
                <a href="/" aria-label="Verto home" className="preview-brand">
                    <Image
                        src={`/brand/verto-full-logo-mono-${dark ? 'dark' : 'light'}.svg`}
                        width={106}
                        height={32}
                        alt="Verto"
                        unoptimized
                    />
                </a>
                <span className="preview-divider" />
                <span className="preview-title">Document review</span>
                <div className="preview-header-actions">
                    <span className="preview-sample">Synthetic sample</span>
                    <button
                        type="button"
                        onClick={() => setDark(!dark)}
                        aria-label={dark ? 'Use light theme' : 'Use dark theme'}
                    >
                        {dark ? 'Light' : 'Dark'}
                    </button>
                </div>
            </header>
            <section className="preview-intro">
                <div>
                    <p className="preview-eyebrow">TRANSLATE · REVIEW · EXPORT</p>
                    <h1>Keep the document editable.</h1>
                    <p>Review text, tables and reading direction in one workspace.</p>
                </div>
                <div className="preview-language" role="group" aria-label="Sample language">
                    {(Object.keys(documents) as Language[]).map((name) => (
                        <button
                            type="button"
                            key={name}
                            aria-pressed={language === name}
                            onClick={() => {
                                setLanguage(name);
                                setChanged(false);
                            }}
                        >
                            {name}
                        </button>
                    ))}
                </div>
            </section>
            <section className="preview-workspace" aria-label="Synthetic document workspace">
                <div className="preview-pane">
                    <div className="preview-pane-header">
                        <span>Source document</span>
                        <span>English · sample</span>
                    </div>
                    <div className="preview-source">
                        <article className="preview-paper">
                            <div className="preview-document-label">EXAMPLE ORGANIZATION</div>
                            <DocumentNode node={english} />
                            <div className="preview-note">Fictional content for local evaluation.</div>
                        </article>
                    </div>
                </div>
                <div className="preview-pane preview-editor-pane">
                    <div className="preview-pane-header">
                        <span>Editable document</span>
                        <span>
                            {language} · {selected.direction === 'rtl' ? 'Right to left' : 'Left to right'}
                        </span>
                    </div>
                    <div
                        className="preview-editor"
                        lang={language === 'العربية' ? 'ar' : language === '日本語' ? 'ja' : 'en'}
                    >
                        <TranslationEditor
                            key={language}
                            localOnly
                            initialContent={selected.document}
                            direction={selected.direction}
                            onChange={() => setChanged(true)}
                            hasUnsavedChanges={changed}
                        />
                    </div>
                </div>
            </section>
            <footer className="preview-footer">
                <span>Local evaluation · no translation service is called</span>
                <span>Table structure · text alignment · native editing</span>
            </footer>
        </main>
    );
}
