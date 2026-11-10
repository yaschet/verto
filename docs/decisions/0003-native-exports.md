# 0003 — Native exports

## Context

Reviewers need to edit paragraphs and cells and receive documents with native structure.

## Decision

Use TipTap for review and Google Docs API requests for document generation, with Drive exports stored through the storage adapter.

## Consequences

Provider permissions and format support affect exports. The Google Docs layout model limits visual fidelity to a scanned page.

## Alternatives considered

Raster page exports preserve appearance but do not provide native text and cell editing. Direct file generation needs a separate layout and pagination implementation.
