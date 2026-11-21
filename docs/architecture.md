# Architecture

## Ownership

| Directory                                         | Responsibility                                                                  |
| ------------------------------------------------- | ------------------------------------------------------------------------------- |
| `src/engine/document/`                            | Document types, table repair, adjacent-table merge and ProseMirror sanitization |
| `src/engine/translation/`                         | Batch sizing and JSON recovery                                                  |
| `src/utils/ai/`                                   | Model configuration, prompts, vision adapter, QA and verification               |
| `src/utils/gcp/`                                  | Google Docs mapping, document generation and Drive exports                      |
| `trigger/tasks/`                                  | Durable translation and export orchestration                                    |
| `src/actions/`                                    | Authenticated application operations                                            |
| `src/app/`                                        | Next.js routes and framework entry points                                       |
| `src/components/translations/translation-editor/` | TipTap extensions and review controls                                           |
| `supabase/migrations/`                            | Empty-database schema baseline                                                  |
| `fixtures/`                                       | Synthetic documents and transform examples                                      |
| `tests/`                                          | Offline transform invariants and regression corpus                              |

The core transforms do not import Next.js, React, a database client or a paid provider. They operate on document values. Diagnostics use a small console boundary. The application and task adapters own credentials, I/O and progress reporting.

## Translation path

The translation task loads the document record, downloads the file through the storage adapter, renders PDF pages using MuPDF, and calls the vision translator. Batch context carries entity names, terminology, headings and a structure summary between requests. Sizing uses page density, document type and token-budget inputs.

JSON recovery attempts direct parsing, bracket balancing and extraction of complete nodes. The sanitizer maps recognized node structures into the editor model and table repair normalizes rectangular grids and spans. These transforms handle malformed model output; they cannot establish that translated content is correct.

QA and verification adapters compare page images and structured content, report issues and can attempt corrections. Durable task checkpoints and persisted status let the UI observe progress. Retry classification distinguishes transient service failures from permanent input or authorization failures.

## Review and export

TipTap owns native block and cell editing. Direction is carried into document attributes and editor configuration. Sanitization normalizes alignment and the required table attributes on review updates.

The Google Docs mapper converts the structured document into API requests and computes insertion indices, paragraphs, tables and formatting. The export adapter creates the document, requests Drive export formats, uploads results and updates per-format status. Provider permission and format support remain external constraints.

## Data and authorization

Supabase separates browser-safe access from the server service role. Server actions verify the current user before reading or writing account data. The service role belongs only in task and server configuration. Review database policies, storage permissions, webhook signatures and service-account scopes for your own installation.

The schema baseline includes profiles, customer and translation records, credit transactions, notifications, access policies and document-branding fields. It initializes an empty database; it is not an upgrade script for an occupied database.

## Verification boundary

Tests use a synthetic corpus and explicit invariants. Network functions are replaced with throwing stubs during the suite. Coverage includes the core transform modules declared in `vitest.config.ts`, excluding type declarations and diagnostics. Connected providers and production operations require separate validation.
