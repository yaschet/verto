/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

import Link from 'next/link';

export default function Page() {
    return (
        <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 md:px-12 md:py-12">
            <header className="flex items-center justify-between border-b border-current/15 pb-6">
                <span className="text-2xl font-bold tracking-tight">Verto</span>
                <nav aria-label="Main navigation" className="flex gap-6 text-sm">
                    <a href="https://github.com/yaschet/verto">Source</a>
                    <Link href="/auth/sign-in">Sign in →</Link>
                </nav>
            </header>
            <section className="flex flex-1 flex-col justify-center py-20 md:py-28">
                <p className="mb-6 text-sm font-medium uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                    Document translation · Source-available
                </p>
                <h1 className="max-w-4xl text-5xl leading-[1.08] font-semibold tracking-tight md:text-7xl">
                    Translate the document.
                    <br />
                    Keep it editable.
                </h1>
                <p className="mt-8 max-w-2xl text-lg leading-relaxed text-surface-600 dark:text-surface-400">
                    Turn scanned pages into structured translations. Review the source beside the result, edit
                    tables and text, then export to Google Docs, DOCX or PDF.
                </p>
                <div className="mt-10 flex flex-wrap items-center gap-6">
                    <Link
                        href="/preview"
                        className="rounded-lg bg-emerald-700 px-6 py-3 font-medium text-white dark:bg-emerald-500 dark:text-black"
                    >
                        Explore a synthetic document →
                    </Link>
                    <a href="https://yaschet.com/case-studies/verto" className="underline underline-offset-4">
                        Watch the walkthrough
                    </a>
                </div>
            </section>
            <section
                aria-label="Document workflow"
                className="grid gap-8 border-y border-current/15 py-8 md:grid-cols-3"
            >
                {[
                    [
                        '01 / Translate',
                        'Page images become a structured document, including headings, reading direction and table spans.',
                    ],
                    [
                        '02 / Review',
                        'Compare the result with its source. Correct wording and structure in the document editor.',
                    ],
                    [
                        '03 / Deliver',
                        'Generate editable outputs. Customer records, credits and billing stay connected to the job.',
                    ],
                ].map(([title, text]) => (
                    <div key={title}>
                        <h2 className="mb-3 font-semibold">{title}</h2>
                        <p className="text-sm leading-relaxed text-surface-600 dark:text-surface-400">
                            {text}
                        </p>
                    </div>
                ))}
            </section>
            <footer className="flex flex-wrap justify-between gap-4 pt-8 text-sm text-surface-600 dark:text-surface-400">
                <a href="https://yaschet.com">Built by Yassine Chettouch</a>
                <span>PolyForm Noncommercial · Commercial licensing available</span>
            </footer>
        </main>
    );
}
