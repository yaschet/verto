# Verto repository contract

## Commands

- Use Node from `.node-version` and pnpm from `packageManager`.
- Install with `pnpm install --frozen-lockfile`.
- Run `pnpm check`, `pnpm build:offline` and `pnpm quality:markdown` before proposing a change.
- Use `pnpm dev:offline` for the synthetic editor preview.

## Boundaries

- Keep pure transforms in `src/engine/`, provider adapters under `src/utils/` and durable tasks in `trigger/`.
- Tests must not access the network. Use synthetic fixtures and mock service boundaries.
- Never print, commit or upload credentials or private documents. Do not deploy or call paid services without explicit task authorization.
- Preserve SPDX headers, exact license texts and third-party notices.
- The source is source-available under PolyForm Noncommercial; the handbook is separately licensed under CC BY-NC-ND.

## Conventions

- Strict TypeScript, kebab-case files, one formatter and one linter. Narrow unknown values at boundaries. Justify unavoidable dynamic types next to their use.
- No blanket lint suppressions or `@ts-ignore`.
- Conventional Commits and PR titles; explain behavior, verification and material limits.
- Keep documentation paths, configuration keys and architecture aligned with the code.
- Render and inspect UI and handbook changes. Preserve the complete handbook structure.

## Storage

Reuse the checkout and dependencies. Do not duplicate builds or Git objects for ordinary checks. Track task-generated artifacts and remove only confirmed disposable task output. Retain a build needed by a running preview.
