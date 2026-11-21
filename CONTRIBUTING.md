# Contributing

Discuss substantial work in an issue before implementation. Use synthetic data for examples and tests. Do not submit credentials, customer documents, private deployment identifiers or assets whose redistribution rights are unclear.

## Development

Use the pinned Node and pnpm versions, then follow [setup](docs/setup.md).

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm build:offline
pnpm quality:markdown
```

Keep pure document transforms in `src/engine/`, provider I/O in adapters and durable work in `trigger/`. Use strict TypeScript, narrow unknown input at boundaries and explain unavoidable dynamic types locally. Never use `@ts-ignore` or a file-wide lint suppression.

Add tests for meaningful behavior changes. Describe the exact measured scope of coverage. Review the rendered editor when changing review controls or styling.

## Commits and pull requests

Use Conventional Commits, for example `fix(engine): preserve merged table cells`. Lefthook checks formatting before a commit and commitlint validates its message. PR titles follow the same convention because squash merges use the PR title.

Describe the concrete problem, resulting behavior, verification and limits. Keep changes focused and retain SPDX headers and third-party notices. CI must pass before merge.

## License

Contributions are submitted under the repository's [source license](LICENSE). Handbook contributions also require permission to distribute them under its [separate license](handbook/LICENSE). See [commercial licensing](COMMERCIAL.md) for commercial use.
