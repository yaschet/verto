/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

export default function Page() {
    return (
        <main className="mx-auto max-w-2xl px-6 py-16">
            <h1 className="mb-6 text-3xl font-semibold">Privacy and deployment</h1>
            <p className="leading-relaxed">
                This repository provides application source. The person operating an instance is responsible
                for its privacy policy, retention settings and service configuration. Translation processing
                can send document content to the configured AI and document providers. Read the configuration
                guide before connecting services.
            </p>
            <p className="mt-6">
                <a className="underline" href="/">
                    Back to Verto
                </a>
            </p>
        </main>
    );
}
