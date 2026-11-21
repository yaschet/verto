# Synthetic documents

These documents are generated for this repository. They contain no customer files,
personal identities, or production data.

- `structured-report.json` covers section boundaries and cells with row and column spans.
- `arabic-report.json` covers right-to-left text and Arabic numerals.
- `cjk-report.json` covers Japanese text in paragraphs and tables.
- `engine-cases.json` records deterministic reference outputs for repair,
  sanitization, JSON recovery, and batching. Tests also check independent invariants.

Fixture metadata uses a synthetic issue date. It is not a release or project date.

Each report also has a three-page PDF with the same synthetic text, merged cells, lists and section boundaries. PDF font subsets use Cairo and Noto Sans JP under the SIL Open Font License; notices are included in `public/fonts/OFL.txt` and `NotoSansJP-OFL.txt`.
