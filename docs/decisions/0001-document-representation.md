# 0001 — Document representation

## Context

A scanned page carries text, spatial relationships and table structure. Review and export need a common editable representation.

## Decision

Use a vision translation adapter that emits structured document nodes. Keep table repair, document sanitization, JSON recovery and batch sizing in framework-independent modules.

## Consequences

The editor and exporters can consume the same node hierarchy. Model output still requires validation and human review.

## Alternatives considered

Textract and Document AI provide OCR and layout primitives. A text-only pipeline loses some visual context; independent extraction and translation stages require explicit reconciliation.
